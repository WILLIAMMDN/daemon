/* js/comic_engine.js - VERSIÓN ULTIMATE (Completa sin recortes) */

let historyStack = [];
let redoStack = [];
const MAX_HISTORY = 30; // Límite de pasos para deshacer
let clipboard = null;   // Portapapeles interno
let selectedElement = null; // Elemento seleccionado actualmente

document.addEventListener("DOMContentLoaded", () => {
    // 1. CARGAR DATOS INICIALES DEL HTML (PHP)
    cargarDesdeInputs();
    
    // 2. CARGAR IMÁGENES AL SIDEBAR (GALERÍA)
    const loadedImgs = new Set();
    document.querySelectorAll('.panel-bg').forEach(img => {
        const src = img.getAttribute('src');
        if(src && img.style.opacity !== '0' && !loadedImgs.has(src)) {
            agregarAlSidebar(src);
            loadedImgs.add(src);
        }
    });

    // 3. AUTO-GUARDADO (Cada 60 segundos)
    setInterval(() => { autoGuardarSilencioso(); }, 60000);
    
    // 4. GUARDAR ESTADO INICIAL EN HISTORIAL
    registrarCambio(true); 
});

/* ==========================================================================
   SISTEMA DE HISTORIAL (UNDO / REDO)
   ========================================================================== */

function obtenerEstadoGlobal() {
    // Escanea todos los paneles y genera un objeto JSON con todo el estado actual
    let estado = {};
    for(let i=1; i<=6; i++) {
        const panel = document.getElementById('panel_' + i);
        estado[i] = {
            bubbles: [],
            chars: []
        };

        // Guardar Globos
        panel.querySelectorAll('.bubble-wrapper').forEach(wrap => {
            const txt = wrap.querySelector('textarea');
            let type = 'normal';
            if(wrap.classList.contains('style-thought')) type = 'thought';
            if(wrap.classList.contains('style-shout')) type = 'shout';
            if(wrap.classList.contains('style-whisper')) type = 'whisper';
            if(wrap.classList.contains('style-box')) type = 'box';

            estado[i].bubbles.push({
                x: parseInt(wrap.style.left), y: parseInt(wrap.style.top),
                w: parseInt(wrap.style.width), h: parseInt(wrap.style.height),
                text: txt.value, 
                fs: parseInt(txt.style.fontSize) || 16, 
                type: type,
                z: parseInt(wrap.style.zIndex) || 100,
                f: wrap.getAttribute('data-flip') === 'true',
                l: wrap.getAttribute('data-locked') === 'true', // Lock
                bg: wrap.getAttribute('data-bgcolor'),          // Color
                fn: wrap.getAttribute('data-font')              // Fuente
            });
        });

        // Guardar Personajes
        panel.querySelectorAll('.character-wrapper').forEach(wrap => {
            const img = wrap.querySelector('img');
            estado[i].chars.push({
                x: parseInt(wrap.style.left), y: parseInt(wrap.style.top),
                w: parseInt(wrap.style.width), h: parseInt(wrap.style.height),
                src: img.getAttribute('src'),
                z: parseInt(wrap.style.zIndex) || 50,
                f: img.getAttribute('data-flip') === 'true',
                l: wrap.getAttribute('data-locked') === 'true'  // Lock
            });
        });
    }
    return JSON.stringify(estado);
}

function registrarCambio(esInicial = false) {
    const estadoActual = obtenerEstadoGlobal();
    
    // Evitar duplicados consecutivos (no guardar si no hubo cambios reales)
    if (historyStack.length > 0 && historyStack[historyStack.length - 1] === estadoActual) {
        return; 
    }

    historyStack.push(estadoActual);
    if (historyStack.length > MAX_HISTORY) historyStack.shift(); // Limitar memoria
    
    if (!esInicial) redoStack = []; // Si haces algo nuevo, se borra el futuro (redo)
}

function deshacer() {
    if (historyStack.length <= 1) return; // Debe quedar al menos el estado inicial
    
    const estadoActual = historyStack.pop();
    redoStack.push(estadoActual);
    
    const estadoAnterior = historyStack[historyStack.length - 1];
    aplicarEstado(JSON.parse(estadoAnterior));
}

function rehacer() {
    if (redoStack.length === 0) return;
    
    const estadoFuturo = redoStack.pop();
    historyStack.push(estadoFuturo);
    aplicarEstado(JSON.parse(estadoFuturo));
}

function aplicarEstado(estado) {
    // 1. Limpiar todos los paneles (solo elementos dinámicos)
    for(let i=1; i<=6; i++) {
        const panel = document.getElementById('panel_' + i);
        panel.querySelectorAll('.bubble-wrapper, .character-wrapper').forEach(el => el.remove());
        
        // 2. Reconstruir desde el estado guardado
        if(estado[i]) {
            // Personajes
            estado[i].chars.forEach(c => 
                createCharacterElement(panel, c.src, c.x, c.y, c.w, c.h, c.z, c.f, c.l, false)
            );
            // Globos
            estado[i].bubbles.forEach(b => 
                createBubbleElement(panel, b.type, b.x, b.y, b.w, b.h, b.text, b.fs, b.z, b.f, b.l, false, b.bg, b.fn)
            );
        }
    }
    // Deseleccionar visualmente para evitar errores de referencia
    deseleccionarTodo({target: document.body});
}

/* ==========================================================================
   PORTAPAPELES (COPY / PASTE)
   ========================================================================== */

function copiarElemento() {
    if (!selectedElement) return;
    
    // Detectar qué es y guardar sus datos en memoria
    if (selectedElement.classList.contains('bubble-wrapper')) {
        const txt = selectedElement.querySelector('textarea');
        let type = 'normal';
        if(selectedElement.classList.contains('style-thought')) type = 'thought';
        if(selectedElement.classList.contains('style-shout')) type = 'shout';
        if(selectedElement.classList.contains('style-whisper')) type = 'whisper';
        if(selectedElement.classList.contains('style-box')) type = 'box';
        
        clipboard = {
            kind: 'bubble',
            data: {
                w: parseInt(selectedElement.style.width), h: parseInt(selectedElement.style.height),
                text: txt.value, fs: parseInt(txt.style.fontSize) || 16, type: type,
                z: (parseInt(selectedElement.style.zIndex) || 100) + 1, // Pegar un poco más arriba
                f: selectedElement.getAttribute('data-flip') === 'true',
                bg: selectedElement.getAttribute('data-bgcolor'),
                fn: selectedElement.getAttribute('data-font')
            }
        };
    } else if (selectedElement.classList.contains('character-wrapper')) {
        const img = selectedElement.querySelector('img');
        clipboard = {
            kind: 'char',
            data: {
                w: parseInt(selectedElement.style.width), h: parseInt(selectedElement.style.height),
                src: img.getAttribute('src'),
                z: (parseInt(selectedElement.style.zIndex) || 50) + 1,
                f: img.getAttribute('data-flip') === 'true'
            }
        };
    }
}

function pegarElemento() {
    if (!clipboard) return;
    
    // Determinar dónde pegar: En el panel del elemento seleccionado, o en el panel 1 por defecto
    let targetPanel = document.getElementById('panel_1');
    if (selectedElement && selectedElement.parentElement) {
        targetPanel = selectedElement.parentElement;
    } else {
        // Intentar buscar el primer panel visible
        targetPanel = document.querySelector('.panel-container');
    }

    // Offset aleatorio para que no quede justo encima y parezca que no pasó nada
    const x = 50 + (Math.random() * 30); 
    const y = 50 + (Math.random() * 30);

    if (clipboard.kind === 'bubble') {
        const d = clipboard.data;
        // createBubbleElement(panel, type, x, y, w, h, text, fs, z, f, locked, shouldRegister, bg, fn)
        createBubbleElement(targetPanel, d.type, x, y, d.w, d.h, d.text, d.fs, d.z, d.f, false, true, d.bg, d.fn);
    } else if (clipboard.kind === 'char') {
        const d = clipboard.data;
        // createCharacterElement(panel, src, x, y, w, h, z, f, locked, shouldRegister)
        createCharacterElement(targetPanel, d.src, x, y, d.w, d.h, d.z, d.f, false, true);
    }
}

/* ==========================================================================
   ARRASTRAR Y SOLTAR (DRAG & DROP NATIVO)
   ========================================================================== */

function dragStartTool(ev, type) {
    ev.dataTransfer.setData("action", "create_bubble");
    ev.dataTransfer.setData("type", type);
}

function dragStartImage(ev) {
    // Leer si es modo Fondo o Personaje desde los radio buttons
    const mode = document.querySelector('input[name="imgMode"]:checked').value;
    ev.dataTransfer.setData("action", "image");
    ev.dataTransfer.setData("src", ev.target.src);
    ev.dataTransfer.setData("mode", mode);
}

function dragOverHandler(ev) { ev.preventDefault(); }

function dropHandler(ev, panelId) {
    ev.preventDefault();
    const action = ev.dataTransfer.getData("action");
    const panel = document.getElementById('panel_' + panelId);
    const rect = panel.getBoundingClientRect();

    // 1. SOLTAR IMAGEN
    if (action === "image") {
        const src = ev.dataTransfer.getData("src");
        const mode = ev.dataTransfer.getData("mode");
        
        if (mode === 'bg') {
            // MODO FONDO: Reemplaza el fondo del panel
            const bgImg = document.getElementById('show_img_' + panelId);
            bgImg.src = src;
            bgImg.style.opacity = "1";
            document.getElementById('input_img_' + panelId).value = src;
            registrarCambio(); // Guardar cambio
        } else {
            // MODO PERSONAJE: Crea elemento flotante
            const x = ev.clientX - rect.left - 50; 
            const y = ev.clientY - rect.top - 50;
            createCharacterElement(panel, src, x, y, 100, 100, 50, false, false, true);
        }
        return;
    }

    // 2. SOLTAR GLOBO
    if (action === "create_bubble") {
        const type = ev.dataTransfer.getData("type");
        const x = ev.clientX - rect.left - 75; 
        const y = ev.clientY - rect.top - 40;
        createBubbleElement(panel, type, x, y, 150, 90, "", 16, 100, false, false, true); 
    }
}

/* ==========================================================================
   FÁBRICAS DE ELEMENTOS (CREATION FACTORIES)
   ========================================================================== */

function createCharacterElement(panel, src, x, y, w, h, z = 50, f = false, l = false, shouldRegister = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'character-wrapper';
    wrapper.style.left = x + 'px'; 
    wrapper.style.top = y + 'px';
    wrapper.style.width = w + 'px'; 
    wrapper.style.height = h + 'px';
    wrapper.style.zIndex = z; 

    // Detectar PNG para mix-blend-mode
    if(src.toLowerCase().includes('.png') || src.startsWith('data:image/png')) {
        wrapper.classList.add('is-png');
    }

    // Transformaciones
    let transformStyle = f ? 'scaleX(-1)' : 'scaleX(1)';
    wrapper.setAttribute('data-flip', f);
    wrapper.setAttribute('data-locked', l);
    if(l) wrapper.classList.add('locked');

    wrapper.innerHTML = `
        <img src="${src}" class="character-img" style="transform: ${transformStyle}" data-flip="${f}" crossorigin="anonymous">
        <div class="resizer br"></div><div class="resizer bl"></div><div class="resizer tr"></div><div class="resizer tl"></div>
    `;

    // Eventos
    wrapper.onmousedown = (e) => startDrag(e, wrapper);
    wrapper.onclick = (e) => selectElement(e, wrapper);
    wrapper.querySelectorAll('.resizer').forEach(r => r.onmousedown = (e) => startResize(e, wrapper, r));

    panel.appendChild(wrapper);
    selectElement({stopPropagation:()=>{}}, wrapper);
    
    if(shouldRegister) registrarCambio();
}

function createBubbleElement(panel, type, x, y, w, h, text, fs, z = 100, f = false, l = false, shouldRegister = false, bg = null, fn = null) {
    const wrapper = document.createElement('div');
    wrapper.className = `bubble-wrapper style-${type}`;
    wrapper.style.left = x + 'px'; wrapper.style.top = y + 'px';
    wrapper.style.width = w + 'px'; wrapper.style.height = h + 'px';
    wrapper.style.zIndex = z;
    
    // Atributos de estado
    wrapper.setAttribute('data-flip', f);
    wrapper.setAttribute('data-locked', l);
    if (l) wrapper.classList.add('locked');
    if (f) wrapper.style.transform = 'scaleX(-1)';

    wrapper.innerHTML = `
        <div class="bubble-shape"></div>
        ${ (type !== 'box' && type !== 'shout') ? '<div class="bubble-tail"></div>' : '' }
        <textarea class="bubble-text" style="font-size:${fs}px" placeholder="...">${text}</textarea>
        <div class="resizer br"></div><div class="resizer bl"></div><div class="resizer tr"></div><div class="resizer tl"></div>
    `;

    const textarea = wrapper.querySelector('textarea');
    
    // Flip de texto (Contra-volteo)
    if (f) textarea.style.transform = 'scaleX(-1)';

    // Aplicar estilos personalizados si existen
    if (bg) {
        wrapper.querySelector('.bubble-shape').style.backgroundColor = bg;
        wrapper.setAttribute('data-bgcolor', bg);
    }
    if (fn) {
        textarea.style.fontFamily = fn;
        wrapper.setAttribute('data-font', fn);
    }

    // Eventos
    wrapper.onmousedown = (e) => startDrag(e, wrapper);
    wrapper.onclick = (e) => selectElement(e, wrapper);
    wrapper.ondblclick = (e) => { e.stopPropagation(); wrapper.classList.add('editing'); textarea.focus(); };
    
    // Registrar cambio al terminar de editar texto
    textarea.onblur = () => { 
        wrapper.classList.remove('editing'); 
        registrarCambio(); 
    };
    
    wrapper.querySelectorAll('.resizer').forEach(r => r.onmousedown = (e) => startResize(e, wrapper, r));

    panel.appendChild(wrapper);
    selectElement({stopPropagation:()=>{}}, wrapper);
    
    if(shouldRegister) registrarCambio();
}

/* ==========================================================================
   SELECCIÓN Y GESTIÓN DE PROPIEDADES
   ========================================================================== */

function selectElement(e, wrapper) {
    e.stopPropagation(); 
    
    // Limpiar selección previa
    document.querySelectorAll('.bubble-wrapper, .character-wrapper').forEach(el => el.classList.remove('selected'));
    
    wrapper.classList.add('selected');
    selectedElement = wrapper;
    
    // Ocultar panel de herramientas y mostrar propiedades
    const panelGlobos = document.getElementById('panelGlobos');
    if(panelGlobos) panelGlobos.style.display = 'none';
    
    document.getElementById('propiedades').style.display = 'block';
    
    const textControls = document.getElementById('textControls');
    const btnMagic = document.getElementById('btnMagic');
    const slider = document.getElementById('fontSizeSlider');

    // Configurar controles según tipo
    if (wrapper.classList.contains('bubble-wrapper')) {
        if(textControls) textControls.style.display = 'block';
        if(btnMagic) btnMagic.style.display = 'none';
        
        const textarea = wrapper.querySelector('textarea');
        const shape = wrapper.querySelector('.bubble-shape');

        // Cargar valores actuales en los controles
        let size = parseInt(window.getComputedStyle(textarea).fontSize) || 16;
        slider.value = size;
        document.getElementById('fontSizeVal').innerText = size + 'px';

        // Cargar color
        let bgColor = wrapper.getAttribute('data-bgcolor') || '#ffffff';
        if(bgColor.startsWith('rgb')) bgColor = rgbToHex(shape.style.backgroundColor);
        const colorPicker = document.getElementById('bubbleColorPicker');
        if(colorPicker) colorPicker.value = bgColor;

        // Cargar fuente
        let font = wrapper.getAttribute('data-font') || "'Comic Neue', cursive";
        font = font.replace(/"/g, "'");
        const fontSelect = document.getElementById('fontFamilySelect');
        if(fontSelect) fontSelect.value = font;

    } else {
        // Es un personaje
        if(textControls) textControls.style.display = 'none';
        if(btnMagic) btnMagic.style.display = 'block';
    }

    // Actualizar botón de candado
    const isLocked = wrapper.getAttribute('data-locked') === 'true';
    actualizarBotonCandado(isLocked);
}

function deseleccionarTodo(e) {
    if (!e.target.closest('.bubble-wrapper') && !e.target.closest('.character-wrapper') && !e.target.closest('.tools-sidebar')) {
        document.querySelectorAll('.bubble-wrapper, .character-wrapper').forEach(el => {
            el.classList.remove('selected');
            el.classList.remove('editing');
        });
        selectedElement = null;
        
        // Volver al estado inicial
        document.getElementById('propiedades').style.display = 'none';
        const panelGlobos = document.getElementById('panelGlobos');
        if(panelGlobos) panelGlobos.style.display = 'block';
    }
}

/* ==========================================================================
   HERRAMIENTAS DE TRANSFORMACIÓN Y ACCIONES
   ========================================================================== */

function transformarElemento(accion) {
    if (!selectedElement) return;

    if (accion === 'flip') {
        if (selectedElement.classList.contains('character-wrapper')) {
            const img = selectedElement.querySelector('img');
            const isFlipped = img.getAttribute('data-flip') === 'true';
            img.style.transform = isFlipped ? 'scaleX(1)' : 'scaleX(-1)';
            img.setAttribute('data-flip', !isFlipped);
        } else if (selectedElement.classList.contains('bubble-wrapper')) {
            const isFlipped = selectedElement.getAttribute('data-flip') === 'true';
            const textarea = selectedElement.querySelector('textarea');
            // Flip al wrapper + Contra-flip al texto
            selectedElement.style.transform = isFlipped ? 'scaleX(1)' : 'scaleX(-1)';
            textarea.style.transform = isFlipped ? 'scaleX(1)' : 'scaleX(-1)';
            selectedElement.setAttribute('data-flip', !isFlipped);
        }
    }
    
    // Z-Index
    if (accion === 'front') {
        let currentZ = parseInt(window.getComputedStyle(selectedElement).zIndex) || 50;
        selectedElement.style.zIndex = currentZ + 1;
    }
    if (accion === 'back') {
        let currentZ = parseInt(window.getComputedStyle(selectedElement).zIndex) || 50;
        if(currentZ > 10) selectedElement.style.zIndex = currentZ - 1;
    }
    
    registrarCambio(); 
}

function updateStyle(prop, val) {
    if (!selectedElement) return;

    if (selectedElement.classList.contains('bubble-wrapper')) {
        const textarea = selectedElement.querySelector('textarea');
        const shape = selectedElement.querySelector('.bubble-shape');
        const tail = selectedElement.querySelector('.bubble-tail');

        if (prop === 'size') {
            textarea.style.fontSize = val + 'px';
            document.getElementById('fontSizeVal').innerText = val + 'px';
        }
        
        if (prop === 'bgColor') {
            shape.style.backgroundColor = val;
            if(tail) tail.style.setProperty('--tail-color', val); // Intento de colorear cola (requiere CSS avanzado)
            selectedElement.setAttribute('data-bgcolor', val);
        }

        if (prop === 'font') {
            textarea.style.fontFamily = val;
            selectedElement.setAttribute('data-font', val);
        }
    }
    registrarCambio();
}

function updateFontSize(val) {
    updateStyle('size', val);
}

function eliminarGlobo() {
    if(selectedElement) {
        if(selectedElement.getAttribute('data-locked') === 'true') return; // Seguridad
        
        selectedElement.remove();
        selectedElement = null;
        
        // Restaurar UI
        document.getElementById('propiedades').style.display = 'none';
        const panelGlobos = document.getElementById('panelGlobos');
        if(panelGlobos) panelGlobos.style.display = 'block';
        
        registrarCambio();
    }
}

function quitarFondoMagico() {
    if (!selectedElement || !selectedElement.classList.contains('character-wrapper')) return;
    if(selectedElement.getAttribute('data-locked') === 'true') return;

    const img = selectedElement.querySelector('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    // Algoritmo Chroma Key (basado en pixel 0,0)
    const bgR = data[0], bgG = data[1], bgB = data[2];
    const tolerance = 40; 

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        if (diff < tolerance) data[i + 3] = 0; // Alpha 0
    }
    
    ctx.putImageData(imgData, 0, 0);
    img.src = canvas.toDataURL();
    selectedElement.classList.add('is-png'); 
    registrarCambio();
}

function toggleBloqueo() {
    if (!selectedElement) return;

    const isLocked = selectedElement.getAttribute('data-locked') === 'true';

    if (isLocked) {
        selectedElement.setAttribute('data-locked', 'false');
        selectedElement.classList.remove('locked');
        actualizarBotonCandado(false);
    } else {
        selectedElement.setAttribute('data-locked', 'true');
        selectedElement.classList.add('locked');
        actualizarBotonCandado(true);
    }
    registrarCambio();
}

function actualizarBotonCandado(bloqueado) {
    const btn = document.getElementById('btnLock');
    if(!btn) return;
    
    if (bloqueado) {
        btn.className = "btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2";
        btn.innerHTML = '<i class="bi bi-lock-fill"></i> <span>BLOQUEADO</span>';
    } else {
        btn.className = "btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2";
        btn.innerHTML = '<i class="bi bi-unlock"></i> <span>DESBLOQUEADO</span>';
    }
}

/* ==========================================================================
   MOVIMIENTO Y REDIMENSIONADO (INTERACCIÓN)
   ========================================================================== */

function startDrag(e, wrapper) {
    if (e.target.classList.contains('resizer')) return;
    if (wrapper.classList.contains('editing')) return;
    if (wrapper.getAttribute('data-locked') === 'true') return; // Bloqueo
    
    let startX = e.clientX, startY = e.clientY;
    let origLeft = wrapper.offsetLeft, origTop = wrapper.offsetTop;

    function onMouseMove(ev) {
        ev.preventDefault();
        wrapper.style.left = (origLeft + (ev.clientX - startX)) + 'px';
        wrapper.style.top = (origTop + (ev.clientY - startY)) + 'px';
    }
    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        registrarCambio(); // Guardar historial
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function startResize(e, wrapper, resizer) {
    e.preventDefault(); e.stopPropagation();
    if (wrapper.getAttribute('data-locked') === 'true') return; // Bloqueo
    
    const isBR = resizer.classList.contains('br');
    const isBL = resizer.classList.contains('bl');
    const isTR = resizer.classList.contains('tr');
    const isTL = resizer.classList.contains('tl');

    let startX = e.clientX, startY = e.clientY;
    let startW = wrapper.offsetWidth, startH = wrapper.offsetHeight; 
    let startLeft = wrapper.offsetLeft, startTop = wrapper.offsetTop;

    function doResize(ev) {
        let deltaX = ev.clientX - startX;
        let deltaY = ev.clientY - startY;
        let newW = startW, newH = startH, newLeft = startLeft, newTop = startTop;

        if (isBR) { newW = startW + deltaX; newH = startH + deltaY; }
        else if (isBL) { newW = startW - deltaX; newH = startH + deltaY; newLeft = startLeft + deltaX; }
        else if (isTR) { newW = startW + deltaX; newH = startH - deltaY; newTop = startTop + deltaY; }
        else if (isTL) { newW = startW - deltaX; newH = startH - deltaY; newLeft = startLeft + deltaX; newTop = startTop + deltaY; }

        if (newW > 30) { wrapper.style.width = newW + 'px'; wrapper.style.left = newLeft + 'px'; }
        if (newH > 30) { wrapper.style.height = newH + 'px'; wrapper.style.top = newTop + 'px'; }
    }

    function stopResize() {
        window.removeEventListener('mousemove', doResize);
        window.removeEventListener('mouseup', stopResize);
        registrarCambio(); // Guardar historial
    }
    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
}

// ATAJOS DE TECLADO GLOBALES
document.addEventListener('keydown', (e) => {
    // Si escribe texto, ignorar atajos simples
    const isTyping = document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT';
    
    if (isTyping) return; 

    // UNDO (Ctrl + Z)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); deshacer(); return; }
    // REDO (Ctrl + Y)
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); rehacer(); return; }
    // COPY (Ctrl + C)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copiarElemento(); return; }
    // PASTE (Ctrl + V)
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pegarElemento(); return; }

    if (!selectedElement) return;

    // Movimiento con flechas
    const step = e.shiftKey ? 10 : 1;
    switch(e.key) {
        case 'Delete':
        case 'Backspace': e.preventDefault(); eliminarGlobo(); break;
        case 'ArrowUp': e.preventDefault(); selectedElement.style.top = (selectedElement.offsetTop - step) + 'px'; registrarCambio(); break;
        case 'ArrowDown': e.preventDefault(); selectedElement.style.top = (selectedElement.offsetTop + step) + 'px'; registrarCambio(); break;
        case 'ArrowLeft': e.preventDefault(); selectedElement.style.left = (selectedElement.offsetLeft - step) + 'px'; registrarCambio(); break;
        case 'ArrowRight': e.preventDefault(); selectedElement.style.left = (selectedElement.offsetLeft + step) + 'px'; registrarCambio(); break;
        case 'Escape': e.preventDefault(); deseleccionarTodo({target: document.body}); break;
    }
});

/* ==========================================================================
   PERSISTENCIA DE DATOS (GUARDAR / CARGAR)
   ========================================================================== */

function cargarDesdeInputs() {
    for(let i=1; i<=6; i++) {
        const input = document.getElementById('data_json_' + i);
        const panel = document.getElementById('panel_' + i);
        try {
            const data = JSON.parse(input.value);
            const bubbles = Array.isArray(data) ? data : (data.bubbles || []);
            const chars = data.chars || [];
            
            // Cargar con todas las propiedades nuevas (lock, flip, color, etc.)
            chars.forEach(c => createCharacterElement(panel, c.src, c.x, c.y, c.w, c.h, c.z, c.f, c.l, false));
            bubbles.forEach(b => createBubbleElement(panel, b.type, b.x, b.y, b.w, b.h, b.text, b.fs, b.z, b.f, b.l, false, b.bg, b.fn));
        } catch(e) {}
    }
}

function prepararDatos() {
    const estado = JSON.parse(obtenerEstadoGlobal());
    for(let i=1; i<=6; i++) {
        document.getElementById('data_json_' + i).value = JSON.stringify(estado[i]);
    }
}

function guardarComic() {
    prepararDatos();
    document.getElementById('comicForm').submit();
}

function autoGuardarSilencioso() {
    prepararDatos();
    const form = document.getElementById('comicForm');
    const formData = new FormData(form);
    
    let badge = document.getElementById('autoSaveBadge');
    if (!badge) {
        const headerDiv = document.querySelector('.d-flex.gap-2');
        if (headerDiv) {
            badge = document.createElement('span');
            badge.id = 'autoSaveBadge';
            badge.className = 'badge bg-secondary d-flex align-items-center me-2';
            headerDiv.prepend(badge);
        }
    }
    if(badge) {
        badge.innerText = "Guardando...";
        badge.classList.replace('bg-success', 'bg-warning');
        badge.style.display = 'inline-flex';
    }

    fetch('crear_cuento.php', { method: 'POST', body: formData })
    .then(response => {
        if (response.ok && badge) {
            badge.innerText = "Autoguardado";
            badge.classList.replace('bg-warning', 'bg-success');
            setTimeout(() => { badge.style.display = 'none'; }, 2000);
        }
    });
}

// Helper: Convertir RGB a Hex para input color
function rgbToHex(rgb) {
    if(!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff';
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    rgb = rgb.substr(4).split(")")[0].split(sep);
    let r = (+rgb[0]).toString(16), g = (+rgb[1]).toString(16), b = (+rgb[2]).toString(16);
    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;
    return "#" + r + g + b;
}

// Utils Galería
// Utils Galería
function subirImagen(input) {
    if (input.files && input.files[0]) {
        let formData = new FormData(); 
        formData.append('file', input.files[0]);
        
        // Añadimos feedback visual (opcional: cursor de espera)
        document.body.style.cursor = 'wait';

        fetch('upload_asset.php', { method: 'POST', body: formData })
            .then(r => r.text())
            .then(ruta => {
                document.body.style.cursor = 'default';
                
                // LIMPIEZA CRÍTICA: Quitar espacios extra y verificar error
                ruta = ruta.trim(); 
                
                if(ruta && !ruta.includes('error')) {
                    agregarAlSidebar(ruta);
                } else {
                    console.error("Error subida:", ruta);
                    alert("No se pudo subir la imagen. Intenta con otra.");
                }
            })
            .catch(err => {
                document.body.style.cursor = 'default';
                console.error(err);
            });
    }
}
function agregarAlSidebar(ruta) {
    // 1. Crear el Contenedor (Wrapper)
    let wrapper = document.createElement('div');
    wrapper.className = 'asset-wrapper'; // Clase para posicionar la X
    
    // 2. Crear la Imagen
    let img = document.createElement('img'); 
    img.src = ruta; 
    img.className = 'asset-item'; 
    img.draggable = true; 
    img.ondragstart = (e) => dragStartImage(e);
    
    // 3. Crear el Botón de Borrar (X)
    let btnDelete = document.createElement('div');
    btnDelete.className = 'asset-delete-btn';
    btnDelete.innerHTML = '<i class="bi bi-trash3-fill"></i>';
    btnDelete.title = "Eliminar imagen";
    
    // Acción de borrar
    btnDelete.onclick = function() {
        if(confirm("¿Seguro que quieres eliminar esta imagen? Si la usas en el cómic, desaparecerá.")) {
            let formData = new FormData();
            formData.append('file', ruta);
            
            fetch('delete_asset.php', { method: 'POST', body: formData })
                .then(r => r.text())
                .then(res => {
                    if(res.trim() === 'ok') {
                        wrapper.remove(); // Quitar de la galería visualmente
                    } else {
                        alert("No se pudo borrar el archivo.");
                    }
                });
        }
    };

    // Unir todo
    wrapper.appendChild(img);
    wrapper.appendChild(btnDelete);
    
    // Añadir al principio de la galería
    document.getElementById('assetsGrid').prepend(wrapper);
}
// --- LIMPIAR FONDO DE UN PANEL ---
function limpiarFondoPanel(idPanel) {
    if(confirm("¿Quieres quitar el fondo de esta escena?")) {
        const img = document.getElementById('show_img_' + idPanel);
        const input = document.getElementById('input_img_' + idPanel);
        
        // 1. Ocultar imagen visualmente
        img.src = ""; 
        img.style.opacity = "0";
        
        // 2. Borrar valor del input oculto (para que no se guarde)
        input.value = "";
        
        // 3. Guardar cambios en el historial
        registrarCambio();
    }
}