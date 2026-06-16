/**
 * NEURO-MAZE ENGINE - ARQUITECTURA "SHARK MEMORY" v25.0
 * Incluye: Anti-Bucles (Shark), Memoria de Ruta (Path Burning) y Control Manual.
 */
class NeuroMaze {
    constructor(canvasId) {
        // --- 1. MOTOR GRÁFICO ---
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.cols = 15;
        this.rows = 10;
        this.cellSize = 60;
        
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;

        // --- 2. CEREBRO IA ---
        this.brain = new RLAgent(); 
        this.loadBrain();

        // --- 3. ESTADO DEL MUNDO ---
        this.grid = [];     
        this.agent = { x: 1, y: 1 };
        this.startPos = { x: 1, y: 1 };
        
        // Memoria Inmediata (Para premios manuales)
        this.lastMove = null; 
        
        // Memoria de Ruta (Para no repetir caminos malos)
        this.episodePath = []; 

        // --- SISTEMAS DE CONTROL ---
        this.stuckCounter = 0;        
        this.lastPosKey = "1,1";      
        this.victoryCooldown = false; 
        this.sharkMode = false; // Modo Riel Anti-Retorno

        this.goalPos = { x: -1, y: -1 }; 

        // --- UI ---
        this.episode = 0;
        this.steps = 0;
        this.running = true; // AUTO-ARRANQUE ACTIVADO
        this.speedDelay = 200;
        this.lastTime = 0;
        this.showBrain = true;
        this.drawingMode = 1;
        this.agentColor = '#00d2ff'; 

        // --- INPUT ---
        this.isMouseDown = false;
        this.mouseButton = 0;

        // --- INICIO ---
        this.loadLevel(0);
        this.setupInput();
        
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
        
        console.log("NeuroMaze SHARK MEMORY: Listo. Control manual habilitado.");
    }

    // =================================================================
    //  NUEVA FUNCIÓN: CONTROL DE CURIOSIDAD
    //  Conéctala a tu slider HTML así: oninput="game.setCuriosity(this.value)"
    // =================================================================
    setCuriosity(val) {
        // El slider suele ir de 0 a 100, lo convertimos a 0.0 - 1.0
        let newEpsilon = val / 100;
        if (newEpsilon < 0) newEpsilon = 0;
        if (newEpsilon > 1) newEpsilon = 1;
        
        this.brain.epsilon = newEpsilon;
        console.log("Curiosidad ajustada manualmente a:", Math.round(newEpsilon * 100) + "%");
    }

    // -----------------------------------------------------------------------
    // GESTIÓN DE NIVELES
    // -----------------------------------------------------------------------
    loadLevel(levelIndex) {
        if (typeof GameLevels === 'undefined' || !GameLevels[levelIndex]) {
            this.grid = Array(10).fill().map(() => Array(15).fill(0)); 
        } else {
            this.grid = JSON.parse(JSON.stringify(GameLevels[levelIndex]));
        }
        
        this.goalPos = { x: -1, y: -1 };
        for(let y = 0; y < this.rows; y++) {
            for(let x = 0; x < this.cols; x++) {
                if(this.grid[y][x] === 2) this.goalPos = {x: x, y: y};
            }
        }

        this.startPos = {x: 1, y: 1};
        this.agent.x = this.startPos.x;
        this.agent.y = this.startPos.y;
        
        // Reset Variables
        this.lastMove = null; 
        this.stuckCounter = 0;
        this.victoryCooldown = false;
        this.sharkMode = false;
        this.episodePath = []; // Limpiar camino
        
        // Valor inicial de curiosidad (si no se toca el slider)
        this.brain.epsilon = 0.3; 

        this.draw();
    }

    // -----------------------------------------------------------------------
    // CEREBRO PRINCIPAL (STEP)
    // -----------------------------------------------------------------------
    step() {
        if(!this.running || this.victoryCooldown) return;

        // 1. DETECCIÓN DE ATASCO
        const currentKey = `${this.agent.x},${this.agent.y}`;
        if (currentKey === this.lastPosKey) this.stuckCounter++;
        else { this.stuckCounter = 0; this.lastPosKey = currentKey; }

        // Si se atasca (5 turnos quieto), apagar modo estricto para que se mueva
        if (this.stuckCounter > 5) {
            this.sharkMode = false; 
            this.agentColor = '#ff00ff'; // Pánico visual
        }

        // 2. DECISIÓN
        let decision = this.brain.decideAction(this.agent.x, this.agent.y);
        let action = decision.action;

        // --- FILTRO SHARK (Anti-Retorno post-premio) ---
        if (this.sharkMode && this.lastMove) {
            let forbiddenDir = this.getOpposite(this.lastMove.action);
            if (action === forbiddenDir) {
                // Si intenta volver, forzamos otra dirección válida
                const alternatives = ['UP', 'DOWN', 'LEFT', 'RIGHT'].filter(d => d !== forbiddenDir);
                let bestAlt = null; 
                let maxQ = -Infinity;
                
                // Buscar la mejor alternativa
                alternatives.forEach(alt => {
                    let q = this.brain.getQ(this.agent.x, this.agent.y, alt);
                    if (q > maxQ) { maxQ = q; bestAlt = alt; }
                });

                // Si no sabe qué hacer, elegir al azar para no quedarse quieto
                if (maxQ <= 0 || Math.random() < 0.3) {
                    action = alternatives[Math.floor(Math.random() * alternatives.length)];
                } else {
                    action = bestAlt;
                }
                this.agentColor = '#ffffff'; 
            }
        } 
        
        if (this.agentColor !== '#ff00ff' && this.agentColor !== '#ffffff') {
            this.agentColor = (decision.type === 'EXPLOIT') ? '#00d2ff' : '#ffd700';
        }

        // 3. REGISTRO DE PASOS (MEMORIA DE RUTA)
        this.episodePath.push({
            x: this.agent.x,
            y: this.agent.y,
            action: action
        });

        this.lastMove = { x: this.agent.x, y: this.agent.y, action: action };

        // 4. FÍSICA
        let distBefore = this.getDistanceToGoal(this.agent.x, this.agent.y);
        let nextX = this.agent.x;
        let nextY = this.agent.y;

        if(action === 'UP') nextY--;
        if(action === 'DOWN') nextY++;
        if(action === 'LEFT') nextX--;
        if(action === 'RIGHT') nextX++;

        // 5. EVALUACIÓN
        let reward = -1; 
        let hitWall = false;
        let reset = false;
        let win = false;

        if(nextX < 0 || nextX >= this.cols || nextY < 0 || nextY >= this.rows) {
            hitWall = true; reward = -20; 
        } else {
            const cell = this.grid[nextY][nextX];
            
            if (cell === 1) { // PARED
                reward = -20; hitWall = true;
                nextX = this.agent.x; nextY = this.agent.y; 

            } else if (cell === 2) { // META
                reward = 5000; reset = true; win = true;
                this.brain.decayEpsilon();
                this.saveBrain();
                this.claimRewardDB();

            } else if (cell === 3) { // TRAMPA (BANDERA ROJA)
                reward = -2000; 
                reset = true;
                
                // ¡AQUÍ ESTÁ LA MAGIA!
                // Quemar el camino recorrido para no repetirlo
                this.punishPath();
            } else {
                // Instinto Magnético (Ayuda leve)
                if (this.goalPos.x !== -1) { 
                    let distAfter = this.getDistanceToGoal(nextX, nextY);
                    if (distAfter < distBefore) reward += 5; else reward -= 2; 
                }
            }
        }

        // 6. APRENDIZAJE
        this.brain.learn(this.agent.x, this.agent.y, action, reward, nextX, nextY);

        // 7. MOVER
        if(!hitWall) {
            this.agent.x = nextX;
            this.agent.y = nextY;
        }

        this.steps++;
        if(reset) {
            if(win) this.handleVictory(); else this.resetLevel(false);
        }
    }

    // =================================================================
    //  NUEVA FUNCIÓN: QUEMAR CAMINO (PATH BURNING)
    // =================================================================
    punishPath() {
        // Recorremos los últimos pasos dados en este intento
        // y les asignamos un valor negativo fuerte para que la IA los evite.
        for (let i = 0; i < this.episodePath.length; i++) {
            const step = this.episodePath[i];
            // Castigo severo (-500) a la acción tomada en esa casilla
            this.brain.setQ(step.x, step.y, step.action, -500);
        }
        console.log("¡Ruta marcada como peligrosa! No volverá a pasar por ahí.");
    }

    // -----------------------------------------------------------------------
    // INTERVENCIÓN HUMANA
    // -----------------------------------------------------------------------
    getOpposite(action) {
        if (action === 'UP') return 'DOWN';
        if (action === 'DOWN') return 'UP';
        if (action === 'LEFT') return 'RIGHT';
        if (action === 'RIGHT') return 'LEFT';
        return null;
    }

    manualReward(val) {
        if (!this.lastMove) return;

        const prevX = this.lastMove.x;
        const prevY = this.lastMove.y;
        const prevAction = this.lastMove.action;

        // --- CASTIGO ---
        if (val < 0) {
            this.brain.setQ(prevX, prevY, prevAction, -10000);
            
            // Retroceso físico para corrección visual
            this.agent.x = prevX;
            this.agent.y = prevY;
            
            this.sharkMode = false;
            this.brain.epsilon = 0.5; // Subir curiosidad para buscar alternativa
            
            this.lastMove = null;
            this.agentColor = '#ff0000';
            console.log("CASTIGO: Bloqueo total.");

        } 
        // --- PREMIO ---
        else {
            let currentQ = this.brain.getQ(prevX, prevY, prevAction);
            this.brain.setQ(prevX, prevY, prevAction, Math.max(currentQ, 0) + val + 2000);

            this.sharkMode = true; // Activar modo no retorno
            
            let reverseAction = this.getOpposite(prevAction);
            if (reverseAction) {
                this.brain.setQ(this.agent.x, this.agent.y, reverseAction, -1000);
            }

            this.brain.epsilon = 0.1; // Bajar curiosidad (Obediencia)
            this.agentColor = '#ffffff';
            console.log("PREMIO: Camino reforzado.");
        }

        this.draw();
        setTimeout(() => {
            if(this.agentColor === '#ff0000' || this.agentColor === '#ffffff') {
                this.agentColor = '#00d2ff';
                this.draw();
            }
        }, 200);
    }

    // -----------------------------------------------------------------------
    // SOPORTE
    // -----------------------------------------------------------------------
    handleVictory() {
        this.victoryCooldown = true;
        this.agentColor = '#00ff00';
        this.draw();
        setTimeout(() => {
            this.victoryCooldown = false;
            this.resetLevel(true);
            this.agentColor = '#00d2ff';
            this.draw();
        }, 500);
    }

    getDistanceToGoal(x, y) {
        if(this.goalPos.x === -1) return 999;
        return Math.abs(x - this.goalPos.x) + Math.abs(y - this.goalPos.y);
    }

    resetLevel(win) {
        this.agent.x = this.startPos.x;
        this.agent.y = this.startPos.y;
        this.episode++;
        this.steps = 0;
        this.lastMove = null;
        this.stuckCounter = 0;
        this.sharkMode = false;
        
        // Limpiar la memoria del camino al reiniciar
        this.episodePath = []; 
        
        const epLabel = document.getElementById('episodeCount');
        if(epLabel) epLabel.innerText = this.episode;
    }

    claimRewardDB() {
        const formData = new FormData();
        formData.append('action', 'reward_tokens');
        fetch('neuro_maze_api.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(d => { if(d.status === 'success') document.getElementById('uiTokenCount').innerText = d.new_tokens; })
        .catch(e => {});
    }

   // --- GUARDADO EN LA NUBE (BASE DE DATOS) ---
    saveBrain() {
        // 1. Guardar en Local (Copia de seguridad rápida)
        try {
            const data = {
                qTable: this.brain.qTable,
                epsilon: this.brain.epsilon
            };
            const jsonString = JSON.stringify(data);
            localStorage.setItem('neuro_brain_full', jsonString);

            // 2. Guardar en Base de Datos (Persistencia Real)
            const formData = new FormData();
            formData.append('action', 'save_brain');
            formData.append('brain_data', jsonString);

            fetch('neuro_maze_api.php', { method: 'POST', body: formData })
            .then(r => r.json())
            .then(d => {
                if(d.status === 'success') console.log("¡Cerebro sincronizado con la BD!");
            })
            .catch(e => console.error("Error guardando en BD:", e));

        } catch(e) { console.error("Error al serializar cerebro:", e); }
    }

    // --- CARGA DESDE LA NUBE ---
    loadBrain() {
        // Primero intentamos cargar de la BD para tener la última versión
        const formData = new FormData();
        formData.append('action', 'load_brain');

        fetch('neuro_maze_api.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(d => {
            if(d.status === 'success' && d.brain_data) {
                const data = JSON.parse(d.brain_data);
                this.brain.qTable = data.qTable || {};
                this.brain.epsilon = parseFloat(data.epsilon) || 0.2;
                console.log("Cerebro descargado de la Nube.");
            } else {
                // Si no hay nada en la BD, miramos el LocalStorage por si acaso
                this.loadFromLocal();
            }
        })
        .catch(e => {
            console.warn("No se pudo conectar a la BD, usando memoria local.");
            this.loadFromLocal();
        });
    }

    loadFromLocal() {
        try {
            const localData = localStorage.getItem('neuro_brain_full');
            if(localData) {
                const data = JSON.parse(localData);
                this.brain.qTable = data.qTable || {};
                this.brain.epsilon = parseFloat(data.epsilon) || 0.2;
            }
        } catch(e) { this.resetBrainMemory(); }
    }

    resetBrainMemory() {
        this.brain.resetMemory();
        localStorage.removeItem('neuro_brain_qtable');
        localStorage.removeItem('neuro_brain_epsilon');
    }

    setupInput() {
        this.canvas.addEventListener('contextmenu', e => { e.preventDefault(); return false; });
        this.canvas.addEventListener('mousedown', e => { this.isMouseDown = true; this.mouseButton = e.button; this.handleInput(e); });
        this.canvas.addEventListener('mousemove', e => { if(this.isMouseDown) this.handleInput(e); });
        window.addEventListener('mouseup', () => { this.isMouseDown = false; });
    }

    handleInput(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.cellSize);
        
        if(x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
            if (this.drawingMode === 4 && this.mouseButton === 0) {
                if (this.grid[y][x] !== 1) {
                    this.agent.x = x; this.agent.y = y; this.lastMove = null; this.sharkMode = false; 
                    this.episodePath = []; // Resetear camino si lo mueves a mano
                    this.draw(); return; 
                }
            }
            let val = (this.mouseButton === 2) ? 0 : this.drawingMode;
            if(x === 0 || x === this.cols-1 || y === 0 || y === this.rows-1) return;
            if (this.drawingMode !== 4) {
                this.grid[y][x] = val;
                if (val === 2) this.goalPos = {x: x, y: y};
                delete this.brain.qTable[`${x},${y}`]; 
            }
        }
    }

    gameLoop(timestamp) {
        if (timestamp - this.lastTime > this.speedDelay) {
            this.step();
            this.lastTime = timestamp;
        }
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
    
    draw() {
        this.ctx.fillStyle = '#161b22';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for(let y = 0; y < this.rows; y++) {
            for(let x = 0; x < this.cols; x++) {
                const px = x * this.cellSize;
                const py = y * this.cellSize;
                this.ctx.strokeStyle = '#222';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);

                if(this.grid[y][x] === 1) { 
                    this.ctx.fillStyle = '#444'; this.ctx.fillRect(px+2, py+2, this.cellSize-4, this.cellSize-4);
                } else if(this.grid[y][x] === 2) { 
                    this.ctx.fillStyle = '#00ff00'; this.ctx.beginPath(); this.ctx.arc(px+30, py+30, 15, 0, Math.PI*2); this.ctx.fill();
                    this.ctx.shadowBlur = 15; this.ctx.shadowColor = '#00ff00';
                } else if(this.grid[y][x] === 3) { 
                    this.ctx.fillStyle = '#ff0000'; this.ctx.fillRect(px+10, py+10, this.cellSize-20, this.cellSize-20);
                }

                if(this.showBrain && this.grid[y][x] === 0) {
                    this.drawBrainArrow(x, y, px, py);
                }
                this.ctx.shadowBlur = 0;
            }
        }
        
        const ax = this.agent.x * this.cellSize + this.cellSize/2;
        const ay = this.agent.y * this.cellSize + this.cellSize/2;
        this.ctx.fillStyle = this.agentColor;
        this.ctx.shadowBlur = 20; this.ctx.shadowColor = this.agentColor;
        this.ctx.beginPath(); this.ctx.arc(ax, ay, this.cellSize/3, 0, Math.PI*2); this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(ax-5, ay-5, 4, 4); this.ctx.fillRect(ax+5, ay-5, 4, 4);
    }
    
    drawBrainArrow(x, y, px, py) {
         const best = this.brain.getBestAction(x, y); 
         if(best.value <= 0) return; 
         
         const alpha = Math.min(best.value / 300, 1.0); 
         this.ctx.strokeStyle = `rgba(0, 210, 255, ${alpha + 0.3})`;
         this.ctx.lineWidth = 2;
         const cx = px + this.cellSize/2;
         const cy = py + this.cellSize/2;
         this.ctx.beginPath();
         this.ctx.moveTo(cx, cy);
         if(best.action === 'UP') this.ctx.lineTo(cx, cy-15);
         if(best.action === 'DOWN') this.ctx.lineTo(cx, cy+15);
         if(best.action === 'LEFT') this.ctx.lineTo(cx-15, cy);
         if(best.action === 'RIGHT') this.ctx.lineTo(cx+15, cy);
         this.ctx.stroke();
    }
    
    setSpeed(val) { this.speedDelay = 510 - (val * 5); }
}