/**
 * Zero Grid - Game Engine
 */

class Game {
    constructor() {
        this.grid = [];
        this.size = 3;
        this.moves = 0;
        this.history = [];
        this.currentLevel = 1;
        this.isGameOver = false;
        
        // UI Elements
        this.screens = {
            menu: document.getElementById('menu-screen'),
            levels: document.getElementById('levels-screen'),
            game: document.getElementById('game-screen')
        };
        this.gridContainer = document.getElementById('grid');
        this.overlay = document.getElementById('overlay');
        
        this.init();
    }

    init() {
        // Navigation
        document.getElementById('start-btn').onclick = () => {
            this.currentLevel = 0;
            this.loadLevel(0);
            this.showScreen('game');
        };
        document.getElementById('levels-btn').onclick = () => this.showScreen('levels');
        
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.onclick = (e) => this.showScreen(e.target.dataset.target);
        });

        // Game Controls
        document.getElementById('reset-btn').onclick = () => this.loadLevel(this.currentLevel);
        document.getElementById('undo-btn').onclick = () => this.undo();
        document.getElementById('retry-btn').onclick = () => {
            this.hideOverlay();
            this.loadLevel(this.currentLevel);
        };
        document.getElementById('next-btn').onclick = () => {
            this.hideOverlay();
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
        };
        document.getElementById('menu-from-result-btn').onclick = () => {
            this.hideOverlay();
            this.showScreen('menu');
        };

        this.renderLevelList();
    }

    showScreen(screenId) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[screenId.split('-')[0]].classList.add('active');
        
        if (screenId === 'levels') this.renderLevelList();
    }

    renderLevelList() {
        const container = document.getElementById('levels-container');
        container.innerHTML = '';
        
        // Level 0 (Tutorial)
        const tutorialCard = document.createElement('div');
        tutorialCard.className = 'level-card tutorial-card';
        tutorialCard.innerHTML = `<span>0</span><small>Tutorial</small>`;
        tutorialCard.onclick = () => {
            this.currentLevel = 0;
            this.loadLevel(0);
            this.showScreen('game');
        };
        container.appendChild(tutorialCard);

        // Define 100 levels
        for (let i = 1; i <= 100; i++) {
            const card = document.createElement('div');
            card.className = 'level-card';
            const size = i <= 30 ? 3 : (i <= 60 ? 4 : (i <= 85 ? 5 : 6));
            card.innerHTML = `<span>${i}</span><small>${size}x${size}</small>`;
            card.onclick = () => {
                this.currentLevel = i;
                this.loadLevel(i);
                this.showScreen('game');
            };
            container.appendChild(card);
        }
    }

    loadLevel(levelNum) {
        this.moves = 0;
        this.history = [];
        this.isGameOver = false;
        document.getElementById('move-counter').textContent = `Moves: ${this.moves}`;
        document.getElementById('current-level-name').textContent = `Level ${levelNum}`;
        document.getElementById('undo-btn').disabled = true;

        // Difficulty scaling for 100 levels
        if (levelNum === 0) {
            this.size = 3;
            this.setupTutorial();
        } else {
            this.size = levelNum <= 30 ? 3 : (levelNum <= 60 ? 4 : (levelNum <= 85 ? 5 : 6));
            const steps = 3 + Math.floor(levelNum * 0.5);
            this.generateSolvableLevel(this.size, steps);
            this.hideTutorialHint();
        }
        this.renderGrid();
    }

    setupTutorial() {
        this.size = 3;
        this.grid = [
            [0, 1, 0],
            [1, 0, 1],
            [0, 1, 0]
        ];
        this.showTutorialHint('GOAL: Make all cells 0. Click in the center to decrease its neighbors!');
    }

    showTutorialHint(text) {
        let hintEl = document.getElementById('tutorial-hint');
        if (!hintEl) {
            hintEl = document.createElement('div');
            hintEl.id = 'tutorial-hint';
            hintEl.className = 'tutorial-hint-overlay';
            document.getElementById('game-screen').appendChild(hintEl);
        }
        hintEl.textContent = text;
        hintEl.classList.add('active');
    }

    hideTutorialHint() {
        const hintEl = document.getElementById('tutorial-hint');
        if (hintEl) hintEl.classList.remove('active');
    }

    generateSolvableLevel(size, steps) {
        // Start with all zeros
        this.grid = Array(size).fill().map(() => Array(size).fill(0));
        
        let clicks = 0;
        while (clicks < steps) {
            const r = Math.floor(Math.random() * size);
            const c = Math.floor(Math.random() * size);
            
            // "Reverse Click" - adds to neighbors
            const neighbors = this.getNeighbors(r, c);
            if (neighbors.length > 0) {
                neighbors.forEach(([nr, nc]) => {
                    this.grid[nr][nc]++;
                });
                clicks++;
            }
        }
    }

    getNeighbors(r, c) {
        const neighbors = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        dirs.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                neighbors.push([nr, nc]);
            }
        });
        return neighbors;
    }

    renderGrid() {
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        this.gridContainer.innerHTML = '';
        
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const val = this.grid[r][c];
                const cell = document.createElement('div');
                cell.className = `cell ${val === 0 ? 'zero' : 'pulse'} ${val > 5 ? 'critical' : ''}`;
                cell.textContent = val;
                cell.onclick = () => this.handleCellClick(r, c);
                this.gridContainer.appendChild(cell);
            }
        }
    }

    handleCellClick(r, c) {
        if (this.isGameOver) return;

        // Save state for undo
        this.history.push(JSON.parse(JSON.stringify(this.grid)));
        document.getElementById('undo-btn').disabled = false;

        const neighbors = this.getNeighbors(r, c);
        let lost = false;

        neighbors.forEach(([nr, nc]) => {
            this.grid[nr][nc]--;
            if (this.grid[nr][nc] < 0) lost = true;
            
            // Visual feedback for neighbor
            const index = nr * this.size + nc;
            const cellEl = this.gridContainer.children[index];
            cellEl.classList.add('neighbor-hit');
            setTimeout(() => cellEl.classList.remove('neighbor-hit'), 300);
        });

        this.moves++;
        document.getElementById('move-counter').textContent = `Moves: ${this.moves}`;
        this.renderGrid();

        if (lost) {
            this.endGame(false);
        } else if (this.checkWin()) {
            if (this.currentLevel === 0) this.hideTutorialHint();
            this.endGame(true);
        }
    }

    undo() {
        if (this.history.length === 0 || this.isGameOver) return;
        this.grid = this.history.pop();
        this.moves--;
        document.getElementById('move-counter').textContent = `Moves: ${this.moves}`;
        if (this.history.length === 0) document.getElementById('undo-btn').disabled = true;
        this.renderGrid();
    }

    checkWin() {
        return this.grid.every(row => row.every(val => val === 0));
    }

    endGame(win) {
        this.isGameOver = true;
        const title = document.getElementById('result-title');
        const msg = document.getElementById('result-message');
        const nextBtn = document.getElementById('next-btn');

        if (win) {
            title.textContent = 'Victory!';
            title.style.color = 'var(--primary)';
            msg.textContent = `Level ${this.currentLevel} completed in ${this.moves} moves.`;
            nextBtn.style.display = 'block';
            this.createParticles();
        } else {
            title.textContent = 'Failed';
            title.style.color = 'var(--accent)';
            msg.textContent = 'One of the cells went below zero. Try again.';
            nextBtn.style.display = 'none';
            this.gridContainer.classList.add('shake');
            setTimeout(() => this.gridContainer.classList.remove('shake'), 400);
        }

        setTimeout(() => this.showOverlay(), 600);
    }

    showOverlay() {
        this.overlay.classList.add('active');
    }

    hideOverlay() {
        this.overlay.classList.remove('active');
        document.querySelectorAll('.win-confetti').forEach(p => p.remove());
    }

    createParticles() {
        const colors = ['#00f2ff', '#bd00ff', '#ff007a'];
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.className = 'win-confetti';
            p.style.width = Math.random() * 8 + 4 + 'px';
            p.style.height = p.style.width;
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = '-10px';
            p.style.borderRadius = '50%';
            p.style.transition = `transform ${Math.random() * 2 + 1}s ease-out, opacity 1s`;
            document.body.appendChild(p);

            setTimeout(() => {
                p.style.transform = `translate(${Math.random() * 200 - 100}px, ${window.innerHeight + 20}px) rotate(${Math.random() * 360}deg)`;
                p.style.opacity = '0';
            }, 10);
            
            setTimeout(() => p.remove(), 3000);
        }
    }
}

// Start Game
window.onload = () => {
    new Game();
};
