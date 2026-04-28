/**
 * Carrom Game - Complete Implementation
 * Physics engine, board, coins, striker, and UI manager
 * Fixed: Single Player vs Bot & Local 2 Players modes working with proper HTML IDs
 */

// ============ UTILITIES ============
const Utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    allBodiesStopped(bodies, threshold = 0.15) {
        if (!bodies || bodies.length === 0) return true;
        for (let body of bodies) {
            if (body && body.active && (Math.abs(body.vx) > threshold || Math.abs(body.vy) > threshold)) {
                return false;
            }
        }
        return true;
    },
    
    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }
};

// ============ PHYSICS ENGINE ============
class PhysicsEngine {
    constructor() {
        this.bodies = [];
        this.collisionCallbacks = [];
        this.isRunning = false;
        this.animationId = null;
        this.gravity = 0;
        this.friction = 0.985;
        this.bounce = 0.92;
        this.bounds = null;
        this.pockets = [];
    }
    
    init(canvas, width, height) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this.bounds = {
            minX: 42,
            maxX: width - 42,
            minY: 42,
            maxY: height - 42
        };
        this.pockets = [
            { x: 42, y: 42, radius: 18 },
            { x: width - 42, y: 42, radius: 18 },
            { x: 42, y: height - 42, radius: 18 },
            { x: width - 42, y: height - 42, radius: 18 }
        ];
    }
    
    addBody(body) {
        this.bodies.push(body);
    }
    
    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index > -1) this.bodies.splice(index, 1);
    }
    
    clear() {
        this.bodies = [];
    }
    
    onCollision(callback) {
        this.collisionCallbacks.push(callback);
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.update();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    update() {
        if (!this.isRunning) return;
        
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (!body.active) continue;
            
            body.vx *= this.friction;
            body.vy *= this.friction;
            
            body.x += body.vx;
            body.y += body.vy;
            
            this.checkBoundaries(body);
            this.checkPockets(body);
        }
        
        this.handleCollisions();
        
        this.animationId = requestAnimationFrame(() => this.update());
    }
    
    checkBoundaries(body) {
        const r = body.radius;
        if (body.x - r < this.bounds.minX) {
            body.x = this.bounds.minX + r;
            body.vx = -body.vx * this.bounce;
        }
        if (body.x + r > this.bounds.maxX) {
            body.x = this.bounds.maxX - r;
            body.vx = -body.vx * this.bounce;
        }
        if (body.y - r < this.bounds.minY) {
            body.y = this.bounds.minY + r;
            body.vy = -body.vy * this.bounce;
        }
        if (body.y + r > this.bounds.maxY) {
            body.y = this.bounds.maxY - r;
            body.vy = -body.vy * this.bounce;
        }
    }
    
    checkPockets(body) {
        for (let pocket of this.pockets) {
            const dx = body.x - pocket.x;
            const dy = body.y - pocket.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pocket.radius) {
                body.pocketed = true;
                body.active = false;
                this.triggerCollision({ type: 'pocket', body: body });
                break;
            }
        }
    }
    
    handleCollisions() {
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];
                if (!a.active || !b.active) continue;
                
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = a.radius + b.radius;
                
                if (dist < minDist) {
                    this.resolveCollision(a, b, dx, dy, dist, minDist);
                    this.triggerCollision({ type: 'collision', bodyA: a, bodyB: b });
                }
            }
        }
    }
    
    resolveCollision(a, b, dx, dy, dist, minDist) {
        const angle = Math.atan2(dy, dx);
        const overlap = minDist - dist;
        const pushX = Math.cos(angle) * overlap * 0.5;
        const pushY = Math.sin(angle) * overlap * 0.5;
        
        a.x -= pushX;
        a.y -= pushY;
        b.x += pushX;
        b.y += pushY;
        
        const nx = dx / dist;
        const ny = dy / dist;
        const vrelx = b.vx - a.vx;
        const vrely = b.vy - a.vy;
        const velAlong = vrelx * nx + vrely * ny;
        
        if (velAlong > 0) return;
        
        const e = 0.7;
        const massSum = a.mass + b.mass;
        const imp = (1 + e) * velAlong / massSum;
        
        a.vx += imp * b.mass * nx;
        a.vy += imp * b.mass * ny;
        b.vx -= imp * a.mass * nx;
        b.vy -= imp * a.mass * ny;
    }
    
    triggerCollision(event) {
        for (let callback of this.collisionCallbacks) {
            callback(event);
        }
    }
}

// ============ CARROM BOARD ============
class CarromBoard {
    constructor(physics, size) {
        this.physics = physics;
        this.size = size;
        this.strikerLine = size - 50;
    }
    
    create() {}
    
    getStrikerPosition(sliderPercent, player) {
        const margin = 80;
        const minX = margin;
        const maxX = this.size - margin;
        const x = minX + (sliderPercent / 100) * (maxX - minX);
        const y = player === 1 ? this.size - 55 : 55;
        return { x, y };
    }
    
    isInPocket(x, y, radius) {
        const pockets = [
            { x: 42, y: 42 }, { x: this.size - 42, y: 42 },
            { x: 42, y: this.size - 42 }, { x: this.size - 42, y: this.size - 42 }
        ];
        for (let p of pockets) {
            if (Math.hypot(x - p.x, y - p.y) < 20) return true;
        }
        return false;
    }
    
    render(ctx) {
        ctx.fillStyle = '#d4b87a';
        ctx.fillRect(0, 0, this.size, this.size);
        
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 6;
        ctx.strokeRect(20, 20, this.size - 40, this.size - 40);
        
        ctx.beginPath();
        ctx.moveTo(this.size / 2, 20);
        ctx.lineTo(this.size / 2, this.size - 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(20, this.size / 2);
        ctx.lineTo(this.size - 20, this.size / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.size / 2, this.size / 2, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        const pockets = [[42,42], [this.size-42,42], [42,this.size-42], [this.size-42,this.size-42]];
        for (let [x, y] of pockets) {
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fillStyle = '#2c1a0c';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#000000aa';
            ctx.fill();
        }
        
        ctx.beginPath();
        ctx.moveTo(30, this.strikerLine);
        ctx.lineTo(this.size - 30, this.strikerLine);
        ctx.strokeStyle = '#8B5A2B';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// ============ COIN MANAGER ============
class CoinManager {
    constructor(physics, size) {
        this.physics = physics;
        this.size = size;
        this.coins = [];
        this.scores = { coin: 10, queen: 50 };
    }
    
    createCoins() {
        const center = this.size / 2;
        const positions = [
            { x: center, y: center, type: 'queen', score: 50 },
            { x: center - 28, y: center - 28, type: 'black', score: 10 },
            { x: center + 28, y: center - 28, type: 'white', score: 10 },
            { x: center - 28, y: center + 28, type: 'white', score: 10 },
            { x: center + 28, y: center + 28, type: 'black', score: 10 },
            { x: center - 55, y: center, type: 'black', score: 10 },
            { x: center + 55, y: center, type: 'white', score: 10 },
            { x: center, y: center - 55, type: 'white', score: 10 },
            { x: center, y: center + 55, type: 'black', score: 10 }
        ];
        
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const coin = {
                id: i,
                x: p.x,
                y: p.y,
                vx: 0,
                vy: 0,
                radius: 11,
                mass: 1,
                type: p.type,
                score: p.score,
                active: true,
                pocketed: false,
                processed: false
            };
            this.coins.push(coin);
            this.physics.addBody(coin);
        }
    }
    
    getActiveCoinBodies() {
        return this.coins.filter(c => c.active);
    }
    
    checkPocketed(board) {
        const pocketed = [];
        for (let coin of this.coins) {
            if (coin.pocketed && !coin.processed) {
                coin.processed = true;
                pocketed.push(coin);
            }
        }
        return pocketed;
    }
    
    hasCoinsRemaining(color) {
        return this.coins.some(c => c.type === color && !c.pocketed);
    }
    
    returnQueen() {
        for (let coin of this.coins) {
            if (coin.type === 'queen' && coin.pocketed) {
                coin.pocketed = false;
                coin.active = true;
                coin.processed = false;
                coin.x = this.size / 2;
                coin.y = this.size / 2;
                coin.vx = 0;
                coin.vy = 0;
                this.physics.addBody(coin);
                break;
            }
        }
    }
    
    render(ctx) {
        for (let coin of this.coins) {
            if (coin.pocketed) continue;
            
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, coin.radius - 1, 0, Math.PI * 2);
            
            if (coin.type === 'queen') {
                ctx.fillStyle = '#FFD700';
                ctx.fill();
                ctx.fillStyle = '#B8860B';
                ctx.font = 'bold 14px monospace';
                ctx.fillText('👑', coin.x - 6, coin.y + 5);
            } else if (coin.type === 'black') {
                ctx.fillStyle = '#2d2d2d';
                ctx.fill();
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#f0e6d0';
                ctx.fill();
                ctx.fillStyle = '#c0a080';
                ctx.beginPath();
                ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// ============ STRIKER ============
class Striker {
    constructor(physics, size) {
        this.physics = physics;
        this.size = size;
        this.body = null;
        this.hasBeenShot = false;
    }
    
    create(x, y) {
        if (this.body) this.remove();
        this.body = {
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            radius: 11,
            mass: 1.5,
            active: true,
            pocketed: false,
            type: 'striker'
        };
        this.physics.addBody(this.body);
        this.hasBeenShot = false;
    }
    
    setPosition(x, y) {
        if (this.body && !this.hasBeenShot) {
            this.body.x = x;
            this.body.y = y;
        }
    }
    
    shoot(vx, vy) {
        if (this.body && !this.hasBeenShot) {
            this.body.vx = vx;
            this.body.vy = vy;
            this.hasBeenShot = true;
        }
    }
    
    isInPocket(board) {
        if (this.body && this.body.pocketed) return true;
        return false;
    }
    
    remove() {
        if (this.body) {
            this.physics.removeBody(this.body);
            this.body = null;
        }
    }
    
    render(ctx) {
        if (this.body && !this.body.pocketed) {
            ctx.beginPath();
            ctx.arc(this.body.x, this.body.y, this.body.radius - 1, 0, Math.PI * 2);
            ctx.fillStyle = '#d4a017';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.body.x, this.body.y, this.body.radius - 3, 0, Math.PI * 2);
            ctx.fillStyle = '#f5c542';
            ctx.fill();
        }
    }
}

// ============ CONTROLS ============
class Controls {
    constructor(canvas, striker, board) {
        this.canvas = canvas;
        this.striker = striker;
        this.board = board;
        this.isAiming = false;
        this.aimStart = { x: 0, y: 0 };
        this.aimEnd = { x: 0, y: 0 };
        this.onShoot = null;
        this.enabled = true;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startAim(e));
        window.addEventListener('mousemove', (e) => this.moveAim(e));
        window.addEventListener('mouseup', (e) => this.endAim(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.startAim(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.moveAim(e), { passive: false });
        window.addEventListener('touchend', (e) => this.endAim(e));
    }
    
    enable() {
        this.enabled = true;
    }
    
    disable() {
        this.enabled = false;
        this.isAiming = false;
    }
    
    startAim(e) {
        if (!this.enabled || !this.striker.body || this.striker.hasBeenShot) return;
        e.preventDefault();
        this.isAiming = true;
        const pos = this.getEventPosition(e);
        this.aimStart = pos;
        this.aimEnd = pos;
    }
    
    moveAim(e) {
        if (!this.isAiming || !this.enabled) return;
        e.preventDefault();
        this.aimEnd = this.getEventPosition(e);
    }
    
    endAim(e) {
        if (!this.isAiming || !this.enabled) return;
        e.preventDefault();
        this.isAiming = false;
        
        const dx = this.aimStart.x - this.aimEnd.x;
        const dy = this.aimStart.y - this.aimEnd.y;
        const length = Math.hypot(dx, dy);
        
        if (length > 10 && this.onShoot) {
            const power = Math.min(1, length / 150);
            const vx = (dx / length) * power * 13;
            const vy = (dy / length) * power * 13;
            this.onShoot(vx, vy);
        }
    }
    
    getEventPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        return { x: Math.min(Math.max(20, x), this.canvas.width - 20), y: Math.min(Math.max(20, y), this.canvas.height - 20) };
    }
    
    renderAimLine(ctx) {
        if (this.isAiming && this.striker.body && !this.striker.hasBeenShot && this.enabled) {
            ctx.beginPath();
            ctx.moveTo(this.striker.body.x, this.striker.body.y);
            ctx.lineTo(this.aimEnd.x, this.aimEnd.y);
            ctx.strokeStyle = '#ffcc44';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            const length = Math.hypot(this.aimStart.x - this.aimEnd.x, this.aimStart.y - this.aimEnd.y);
            const power = Math.min(100, Math.floor(length / 1.5));
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'black';
            ctx.fillText(`⚡${power}%`, this.striker.body.x + 15, this.striker.body.y - 12);
            ctx.shadowBlur = 0;
        }
    }
}

// ============ UI MANAGER ============
class UIManager {
    constructor() {
        // Match HTML IDs
        this.screens = {
            menu: document.getElementById('main-menu'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-menu')
        };
        
        this.scoreP1 = document.getElementById('player1-score')?.querySelector('.score-value');
        this.scoreP2 = document.getElementById('player2-score')?.querySelector('.score-value');
        this.turnIndicator = document.getElementById('current-turn');
        this.p1Area = document.getElementById('player1-score');
        this.p2Area = document.getElementById('player2-score');
        this.strikerSlider = document.getElementById('striker-slider');
        this.gameMessage = document.getElementById('game-message');
        this.messageText = document.getElementById('message-text');
        
        // Buttons matching HTML
        this.btnSinglePlayer = document.getElementById('btn-single-player');
        this.btnTwoPlayer = document.getElementById('btn-two-player');
        this.btnPause = document.getElementById('btn-pause');
        this.btnResume = document.getElementById('btn-resume');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnMainMenu = document.getElementById('btn-main-menu');
        this.btnPlayAgain = document.getElementById('btn-play-again');
        this.btnBackMenu = document.getElementById('btn-back-menu');
        
        // Game over elements
        this.gameOverScreen = document.getElementById('game-over');
        this.winnerText = document.getElementById('winner-text');
        this.finalScore1 = document.getElementById('final-score-1');
        this.finalScore2 = document.getElementById('final-score-2');
    }
    
    showScreen(screen) {
        if (this.screens.menu) this.screens.menu.classList.add('hidden');
        if (this.screens.game) this.screens.game.classList.add('hidden');
        if (this.screens.pause) this.screens.pause.classList.add('hidden');
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        
        if (screen === 'menu' && this.screens.menu) this.screens.menu.classList.remove('hidden');
        if (screen === 'game' && this.screens.game) this.screens.game.classList.remove('hidden');
        if (screen === 'pause' && this.screens.pause) this.screens.pause.classList.remove('hidden');
    }
    
    setPlayerNames(p1Name, p2Name) {
        const p1Elem = document.querySelector('#player1-score .player-name');
        const p2Elem = document.querySelector('#player2-score .player-name');
        if (p1Elem) p1Elem.textContent = p1Name;
        if (p2Elem) p2Elem.textContent = p2Name;
    }
    
    updateScores(score1, score2) {
        if (this.scoreP1) this.scoreP1.textContent = score1;
        if (this.scoreP2) this.scoreP2.textContent = score2;
    }
    
    setActivePlayer(player) {
        if (this.p1Area) {
            if (player === 1) this.p1Area.classList.add('active');
            else this.p1Area.classList.remove('active');
        }
        if (this.p2Area) {
            if (player === 2) this.p2Area.classList.add('active');
            else this.p2Area.classList.remove('active');
        }
    }
    
    updateTurnIndicator(playerName, isBot = false) {
        if (this.turnIndicator) {
            const icon = isBot ? '🤖' : (playerName === 'Player 1' ? '🔶' : '🔴');
            this.turnIndicator.textContent = `${icon} ${playerName}'s Turn`;
        }
    }
    
    setSliderValue(value) {
        if (this.strikerSlider) this.strikerSlider.value = value;
    }
    
    getSliderValue() {
        return this.strikerSlider ? parseInt(this.strikerSlider.value) : 50;
    }
    
    enableSlider() {
        if (this.strikerSlider) this.strikerSlider.disabled = false;
    }
    
    disableSlider() {
        if (this.strikerSlider) this.strikerSlider.disabled = true;
    }
    
    showMessage(message, duration = 2000) {
        if (this.messageText) this.messageText.textContent = message;
        if (this.gameMessage) {
            this.gameMessage.classList.remove('hidden');
            setTimeout(() => {
                if (this.gameMessage) this.gameMessage.classList.add('hidden');
            }, duration);
        }
    }
    
    showGameOver(winner, score1, score2, isTie = false) {
        if (this.gameOverScreen) this.gameOverScreen.classList.remove('hidden');
        if (this.winnerText) {
            if (isTie) this.winnerText.textContent = "🤝 IT'S A TIE! 🤝";
            else this.winnerText.textContent = `🏆 ${winner} WINS! 🏆`;
        }
        if (this.finalScore1) this.finalScore1.textContent = score1;
        if (this.finalScore2) this.finalScore2.textContent = score2;
    }
}

// ============ BOT PLAYER ============
class BotPlayer {
    constructor(boardSize) {
        this.boardSize = boardSize;
    }
    
    selectStrikerPosition(board, coins, color) {
        return Utils.randomRange(25, 75);
    }
    
    async calculateMove(striker, coins, board, color) {
        if (!striker.body) return null;
        
        let closest = null;
        let minDist = Infinity;
        
        for (let coin of coins) {
            if (!coin.pocketed && coin.type !== 'queen') {
                const dx = coin.x - striker.body.x;
                const dy = coin.y - striker.body.y;
                const dist = Math.hypot(dx, dy);
                if (dist < minDist && dist > 15) {
                    minDist = dist;
                    closest = coin;
                }
            }
        }
        
        if (closest) {
            const dx = closest.x - striker.body.x;
            const dy = closest.y - striker.body.y;
            const length = Math.hypot(dx, dy);
            if (length > 0.01) {
                const power = Math.min(0.9, 220 / length);
                return {
                    velocityX: (dx / length) * power * 11,
                    velocityY: (dy / length) * power * 11
                };
            }
        }
        
        const angle = (Math.random() - 0.5) * Math.PI * 1.5;
        const power = 0.5 + Math.random() * 0.7;
        return {
            velocityX: Math.cos(angle) * power * 12,
            velocityY: Math.sin(angle) * power * 12
        };
    }
}

// ============ MAIN GAME CONTROLLER ============
class CarromGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.physics = null;
        this.board = null;
        this.coinManager = null;
        this.striker = null;
        this.controls = null;
        this.ui = null;
        this.bot = null;
        
        this.gameMode = null;
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.playerColors = { 1: 'black', 2: 'white' };
        this.queenPocketedBy = null;
        this.queenCovered = false;
        this.isProcessingTurn = false;
        this.gameActive = false;
        this.foulStreak = { 1: 0, 2: 0 };
        this.extraTurn = false;
        this.boardSize = 550;
        
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        
        this.ui = new UIManager();
        this.bot = new BotPlayer(this.boardSize);
        
        this.setupEventListeners();
        this.calculateBoardSize();
        
        this.ui.showScreen('menu');
        setTimeout(() => this.drawMenuPreview(), 100);
        
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    calculateBoardSize() {
        const container = document.getElementById('canvas-container');
        if (container) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            this.boardSize = Math.min(containerWidth, containerHeight, 550, 550);
        } else {
            this.boardSize = 550;
        }
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.boardSize * dpr;
        this.canvas.height = this.boardSize * dpr;
        this.canvas.style.width = `${this.boardSize}px`;
        this.canvas.style.height = `${this.boardSize}px`;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }
    
    setupEventListeners() {
        if (this.ui.btnSinglePlayer) {
            this.ui.btnSinglePlayer.onclick = (e) => {
                e.preventDefault();
                console.log('Single Player button clicked');
                this.startGame('single');
            };
        }
        
        if (this.ui.btnTwoPlayer) {
            this.ui.btnTwoPlayer.onclick = (e) => {
                e.preventDefault();
                console.log('Two Player button clicked');
                this.startGame('two');
            };
        }
        
        if (this.ui.btnPause) {
            this.ui.btnPause.onclick = () => this.pauseGame();
        }
        if (this.ui.btnResume) {
            this.ui.btnResume.onclick = () => this.resumeGame();
        }
        if (this.ui.btnRestart) {
            this.ui.btnRestart.onclick = () => this.restartGame();
        }
        if (this.ui.btnMainMenu) {
            this.ui.btnMainMenu.onclick = () => this.goToMainMenu();
        }
        if (this.ui.btnPlayAgain) {
            this.ui.btnPlayAgain.onclick = () => this.restartGame();
        }
        if (this.ui.btnBackMenu) {
            this.ui.btnBackMenu.onclick = () => this.goToMainMenu();
        }
        
        if (this.ui.strikerSlider) {
            this.ui.strikerSlider.oninput = () => this.updateStrikerPosition();
        }
        
        window.addEventListener('resize', Utils.debounce(() => {
            if (this.gameActive) {
                this.handleResize();
            }
        }, 250));
    }
    
    drawMenuPreview() {
        if (this.ctx && this.boardSize) {
            const tempPhysics = new PhysicsEngine();
            tempPhysics.init(this.canvas, this.boardSize, this.boardSize);
            const tempBoard = new CarromBoard(tempPhysics, this.boardSize);
            const tempCoinManager = new CoinManager(tempPhysics, this.boardSize);
            tempCoinManager.createCoins();
            
            tempBoard.render(this.ctx);
            tempCoinManager.render(this.ctx);
        }
    }
    
    startGame(mode) {
        console.log('Starting game in mode:', mode);
        
        this.gameMode = mode;
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.queenPocketedBy = null;
        this.queenCovered = false;
        this.foulStreak = { 1: 0, 2: 0 };
        this.extraTurn = false;
        this.gameActive = true;
        this.isProcessingTurn = false;
        
        if (mode === 'single') {
            this.ui.setPlayerNames('Player', 'Bot');
        } else {
            this.ui.setPlayerNames('Player 1', 'Player 2');
        }
        
        this.calculateBoardSize();
        this.physics = new PhysicsEngine();
        this.physics.init(this.canvas, this.boardSize, this.boardSize);
        
        this.board = new CarromBoard(this.physics, this.boardSize);
        this.coinManager = new CoinManager(this.physics, this.boardSize);
        this.striker = new Striker(this.physics, this.boardSize);
        this.controls = new Controls(this.canvas, this.striker, this.board);
        
        this.controls.onShoot = (vx, vy) => this.onStrikerShot(vx, vy);
        
        this.coinManager.createCoins();
        this.physics.start();
        
        this.ui.showScreen('game');
        this.ui.updateScores(0, 0);
        this.ui.setActivePlayer(1);
        this.ui.updateTurnIndicator('Player 1');
        
        this.startTurn();
    }
    
    startTurn() {
        if (!this.gameActive) return;
        
        this.isProcessingTurn = false;
        this.ui.setSliderValue(50);
        
        const pos = this.board.getStrikerPosition(50, this.currentPlayer);
        this.striker.create(pos.x, pos.y);
        
        if (this.gameMode === 'single' && this.currentPlayer === 2) {
            this.ui.disableSlider();
            this.controls.disable();
            this.ui.updateTurnIndicator('Bot', true);
            setTimeout(() => this.executeBotTurn(), 500);
        } else {
            this.ui.enableSlider();
            this.controls.enable();
            const playerName = this.gameMode === 'single' ? 'Player' : `Player ${this.currentPlayer}`;
            this.ui.updateTurnIndicator(playerName);
            this.ui.showMessage(`${playerName}'s turn - Aim and shoot!`, 1500);
        }
    }
    
    async executeBotTurn() {
        if (!this.gameActive || this.currentPlayer !== 2) return;
        
        await new Promise(resolve => setTimeout(resolve, 400));
        if (!this.gameActive) return;
        
        const sliderPos = this.bot.selectStrikerPosition(this.board, this.coinManager.coins, this.playerColors[2]);
        this.ui.setSliderValue(sliderPos);
        this.updateStrikerPosition();
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (this.striker.body && !this.striker.hasBeenShot && this.gameActive) {
            const shot = await this.bot.calculateMove(
                this.striker,
                this.coinManager.coins,
                this.board,
                this.playerColors[2]
            );
            
            if (shot) {
                this.onStrikerShot(shot.velocityX, shot.velocityY);
            }
        }
    }
    
    updateStrikerPosition() {
        if (this.striker && !this.striker.hasBeenShot && this.striker.body) {
            const value = this.ui.getSliderValue();
            const pos = this.board.getStrikerPosition(value, this.currentPlayer);
            this.striker.setPosition(pos.x, pos.y);
        }
    }
    
    onStrikerShot(vx, vy) {
        if (!this.gameActive || this.isProcessingTurn) return;
        
        this.controls.disable();
        this.ui.disableSlider();
        this.striker.shoot(vx, vy);
        this.isProcessingTurn = true;
    }
    
    update() {
        if (!this.gameActive || !this.isProcessingTurn) return;
        
        const allCoins = this.coinManager.getActiveCoinBodies();
        const strikerBody = this.striker.body;
        const allBodies = strikerBody && strikerBody.active ? [...allCoins, strikerBody] : allCoins;
        
        if (Utils.allBodiesStopped(allBodies, 0.2)) {
            this.processTurnResult();
        }
    }
    
    processTurnResult() {
        if (!this.isProcessingTurn) return;
        this.isProcessingTurn = false;
        
        const pocketed = this.coinManager.checkPocketed(this.board);
        const strikerPocketed = this.striker.isInPocket(this.board);
        
        let pointsEarned = 0;
        let scoredOwn = false;
        let scoredQueen = false;
        
        // Process pocketed coins
        for (let coin of pocketed) {
            if (coin.type === this.playerColors[this.currentPlayer] || 
                (coin.type !== 'queen' && coin.type !== 'black' && coin.type !== 'white')) {
                scoredOwn = true;
                pointsEarned += coin.score;
            }
            if (coin.type === 'queen') {
                scoredQueen = true;
                pointsEarned += coin.score;
            }
        }
        
        // Queen pocketing logic
        if (scoredQueen && this.queenPocketedBy === null) {
            this.queenPocketedBy = this.currentPlayer;
            this.ui.showMessage('👑 Queen pocketed! Cover it with your coin next turn!');
        }
        
        // Queen covering logic
        if (this.queenPocketedBy === this.currentPlayer && scoredOwn && !scoredQueen && pointsEarned > 0) {
            this.queenCovered = true;
            pointsEarned += 50;
            this.ui.showMessage('✨ Queen covered! +50 points! ✨');
        }
        
        // Foul handling (striker pocketed)
        if (strikerPocketed) {
            pointsEarned = 0;
            this.scores[this.currentPlayer] = Math.max(0, this.scores[this.currentPlayer] - 1);
            this.ui.showMessage('❌ Foul! Striker pocketed! -1 point');
            this.foulStreak[this.currentPlayer]++;
            
            if (this.foulStreak[this.currentPlayer] >= 3) {
                this.scores[this.currentPlayer] = Math.max(0, this.scores[this.currentPlayer] - 10);
                this.ui.showMessage('⚠️ 3 consecutive fouls! -10 points penalty!');
                this.foulStreak[this.currentPlayer] = 0;
            }
        } else {
            this.foulStreak[this.currentPlayer] = 0;
        }
        
        // Add points to score
        if (pointsEarned > 0) {
            this.scores[this.currentPlayer] += pointsEarned;
            this.ui.updateScores(this.scores[1], this.scores[2]);
            if (pointsEarned >= 10) {
                this.ui.showMessage(`🎯 +${pointsEarned} points!`);
            }
        }
        
        // Return queen if not covered
        if (this.queenPocketedBy === this.currentPlayer && !this.queenCovered && pocketed.length > 0 && !scoredOwn) {
            this.coinManager.returnQueen();
            this.queenPocketedBy = null;
            this.ui.showMessage('Queen returned! Failed to cover.');
        }
        
        // Remove striker from physics
        this.striker.remove();
        
        // Check if game is over
        if (this.checkGameOver()) return;
        
        // Determine if player gets extra turn
        const keepTurn = (pointsEarned > 0 && !strikerPocketed) && !scoredQueen;
        
        // Transition to next turn
        setTimeout(() => {
            if (!keepTurn) {
                // Switch player
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                this.ui.setActivePlayer(this.currentPlayer);
                const nextPlayer = this.currentPlayer === 1 ? 'Player 1' : 
                    (this.gameMode === 'single' && this.currentPlayer === 2 ? 'Bot' : 'Player 2');
                this.ui.showMessage(`Switch to ${nextPlayer}'s turn`);
            } else if (pointsEarned > 0) {
                this.ui.showMessage('🎯 Extra turn! Keep shooting!');
            }
            this.startTurn();
        }, 1500);
    }
    
    checkGameOver() {
        const blackRemaining = this.coinManager.hasCoinsRemaining('black');
        const whiteRemaining = this.coinManager.hasCoinsRemaining('white');
        
        // Win conditions: 7 points or all coins of one color cleared
        if (this.scores[1] >= 7 || this.scores[2] >= 7 || !blackRemaining || !whiteRemaining) {
            let winner = null;
            
            if (this.scores[1] >= 7 || (!whiteRemaining && this.scores[1] > this.scores[2])) {
                winner = this.gameMode === 'single' ? 'Player' : 'Player 1';
            } else if (this.scores[2] >= 7 || (!blackRemaining && this.scores[2] > this.scores[1])) {
                winner = this.gameMode === 'single' ? 'Bot' : 'Player 2';
            } else if (this.scores[1] > this.scores[2]) {
                winner = this.gameMode === 'single' ? 'Player' : 'Player 1';
            } else if (this.scores[2] > this.scores[1]) {
                winner = this.gameMode === 'single' ? 'Bot' : 'Player 2';
            }
            
            setTimeout(() => {
                this.gameActive = false;
                if (this.physics) this.physics.stop();
                if (this.controls) this.controls.disable();
                this.ui.showGameOver(winner, this.scores[1], this.scores[2], winner === null);
            }, 500);
            return true;
        }
        return false;
    }
    
    pauseGame() {
        if (this.gameActive && this.physics) {
            this.physics.stop();
            if (this.controls) this.controls.disable();
            this.ui.showScreen('pause');
        }
    }
    
    resumeGame() {
        if (this.physics) this.physics.start();
        if (this.gameActive && !this.isProcessingTurn && this.controls) {
            if (!(this.gameMode === 'single' && this.currentPlayer === 2)) {
                this.controls.enable();
            }
        }
        this.ui.showScreen('game');
    }
    
    restartGame() {
        if (this.physics) {
            this.physics.stop();
            this.physics.clear();
        }
        this.startGame(this.gameMode);
    }
    
    goToMainMenu() {
        this.gameActive = false;
        if (this.physics) {
            this.physics.stop();
            this.physics.clear();
        }
        if (this.controls) this.controls.disable();
        this.ui.showScreen('menu');
        this.drawMenuPreview();
    }
    
    handleResize() {
        this.calculateBoardSize();
    }
    
    gameLoop(timestamp) {
        if (this.gameActive) {
            this.update();
            this.render();
        } else if (!this.gameActive && this.ui && this.ui.screens.menu && 
                   !this.ui.screens.menu.classList.contains('hidden')) {
            this.drawMenuPreview();
        }
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    render() {
        if (this.ctx && this.board && this.boardSize > 0) {
            this.ctx.clearRect(0, 0, this.boardSize, this.boardSize);
            this.board.render(this.ctx);
            if (this.coinManager) this.coinManager.render(this.ctx);
            if (this.striker) this.striker.render(this.ctx);
            if (this.controls) this.controls.renderAimLine(this.ctx);
        }
    }
}

// Initialize game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CarromGame...');
    window.game = new CarromGame();
});
