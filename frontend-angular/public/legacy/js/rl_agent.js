class RLAgent {
    constructor() {
        this.qTable = {};
        this.learningRate = 0.5;
        this.discountFactor = 0.9;
        this.epsilon = 0.5; // Curiosidad inicial
    }

    getQ(x, y, action) {
        const state = `${x},${y}`;
        if (!this.qTable[state]) this.qTable[state] = { UP:0, DOWN:0, LEFT:0, RIGHT:0 };
        return this.qTable[state][action];
    }

    setQ(x, y, action, value) {
        const state = `${x},${y}`;
        if (!this.qTable[state]) this.qTable[state] = { UP:0, DOWN:0, LEFT:0, RIGHT:0 };
        this.qTable[state][action] = value;
    }

    getBestAction(x, y) {
        const actions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        let best = null;
        let max = -Infinity;
        actions.forEach(a => {
            let val = this.getQ(x, y, a);
            if(val > max) { max = val; best = a; }
        });
        return { action: best, value: max };
    }

    decideAction(x, y) {
        const actions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        // Epsilon-Greedy: Explorar vs Explotar
        const isExploiting = Math.random() > this.epsilon;
        
        if (isExploiting) {
            return { 
                action: this.getBestAction(x, y).action, 
                type: 'EXPLOIT' 
            };
        } else {
            return { 
                action: actions[Math.floor(Math.random() * actions.length)], 
                type: 'EXPLORE' 
            };
        }
    }

    learn(x, y, action, reward, nextX, nextY) {
        const oldQ = this.getQ(x, y, action);
        const bestFutureQ = this.getBestAction(nextX, nextY).value;
        
        // Ecuación de Bellman (Q-Learning)
        const newQ = oldQ + this.learningRate * (reward + this.discountFactor * bestFutureQ - oldQ);
        this.setQ(x, y, action, newQ);
    }
    
    decayEpsilon() {
        this.epsilon *= 0.98; // Se vuelve más sabio con el tiempo
    }

    resetMemory() {
        this.qTable = {};
        this.epsilon = 0.5;
    }
}