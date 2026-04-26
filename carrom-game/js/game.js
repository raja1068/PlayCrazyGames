/**
 * Carrom Game - Complete Implementation
 * Physics engine, board, coins, striker, and UI manager
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
            if (body && (Math.abs(body.vx) > threshold || Math.abs(body.vy) > threshold)) {
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
    }
    
    init(canvas, width, height) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this.bounds = {
            minX: 45,
            maxX: width - 45,
            minY: 45,
            maxY: height - 45
        };
        this.pockets = [
            { x: 45, y: 45, radius: 18 },
            { x: width - 45, y: 45, radius: 18 },
            { x: 45, y: height - 45, radius: 18 },
            { x: width - 45, y: height - 45, radius: 18 }
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
        
        // Update all bodies
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (!body.active) continue;
            
            // Apply friction
            body.vx *= this.friction;
            body.vy *= this.friction;
            
            // Update position
            body.x += body.vx;
            body.y += body.vy;
            
            // Check boundaries and pockets
            this.checkBoundaries(body);
            this.checkPockets(body);
        }
        
        // Check collisions
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
    
    create() {
        // Board creation logic (visual only)
    }
    
    getStrikerPosition(sliderPercent, player) {
        const minX = 100;
        const maxX = this.size - 100;
        const x = minX + (sliderPercent / 100) * (maxX - minX);
        const y = player === 1 ? this.size - 55 : 55;
        return { x, y };
    }
    
    isInPocket(x, y, radius) {
        const pockets = [
            { x: 45, y: 45 }, { x: this.size - 45, y: 45 },
            { x: 45, y: this.size - 45 }, { x: this.size - 45, y: this.size - 45 }
        ];
        for (let p of pockets) {
            if (Math.hypot(x - p.x, y - p.y) < 20) return true;
        }
        return false;
    }
    
    render(ctx) {
        // Draw wooden board
        ctx.fillStyle = '#d4b87a';
        ctx.fillRect(0, 0, this.size, this.size);
        
        // Draw border
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 6;
        ctx.strokeRect(20, 20, this.size - 40, this.size - 40);
        
        // Draw inner lines
        ctx.beginPath();
        ctx.moveTo(this.size / 2, 20);
        ctx.lineTo(this.size / 2, this.size - 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(20, this.size / 2);
        ctx.lineTo(this.size - 20, this.size / 2);
        ctx.stroke();
        
        // Draw circle in center
        ctx.beginPath();
        ctx.arc(this.size / 2, this.size / 2, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw pockets
        const pockets = [[45,45], [this.size-45,45], [45,this.size-45], [this.size-45,this.size-45]];
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
        
        // Draw striker line
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
            { x: center - 25, y: center - 25, type: 'black', score: 10 },
            { x: center + 25, y: center - 25, type: 'white', score: 10 },
            { x: center - 25, y: center + 25, type: 'white', score: 10 },
            { x: center + 25, y: center + 25, type: 'black', score: 10 },
            { x: center - 50, y: center, type: 'black', score: 10 },
            { x: center + 50, y: center, type: 'white', score: 10 },
            { x: center, y: center - 50, type: 'white', score: 10 },
            { x: center, y: center + 50, type: 'black', score: 10 }
        ];
        
        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const coin = {
                id: i,
                x: p.x,
                y: p.y,
                vx: 0,
                vy: 0,
                radius: 12,
                mass: 1,
                type: p.type,
                score: p.score,
                active: true,
                pocketed: false
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
            const vx = (dx / length) * power * 12;
            const vy = (dy / length) * power * 12;
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
        if (this.isAiming && this.striker.body && !this.striker.hasBeenShot) {
            ctx.beginPath();
            ctx.moveTo(this.striker.body.x, this.striker.body.y);
            ctx.lineTo(this.aimEnd.x, this.aimEnd.y);
            ctx.strokeStyle = '#ffcc44';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            const length = Math.hypot(this.aimStart.x - this.aimEnd.x, this.aimStart.y - this.aimEnd.y);
            const power = Math.min(100, Math.floor(length / 1.5));
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`⚡${power}%`, this.striker.body.x + 15, this.striker.body.y - 10);
        }
    }
}

// ============ UI MANAGER ============
class UIManager {
    constructor() {
        this.screens = {
            menu: document.getElementById('main-menu'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-overlay')
        };
        
        this.scoreP1 = document.getElementById('score-p1');
        this.scoreP2 = document.getElementById('score-p2');
        this.turnIndicator = document.getElementById('current-turn');
        this.p1Area = document.getElementById('player1-score-area');
        this.p2Area = document.getElementById('player2-score-area');
        this.strikerSlider = document.getElementById('striker-slider');
        this.gameMessage = document.getElementById('game-message');
        this.messageText = document.getElementById('message-text');
        
        this.btnSinglePlayer = document.getElementById('btn-single-player');
        this.btnTwoPlayer = document.getElementById('btn-two-player');
        this.btnPause = document.getElementById('btn-pause');
        this.btnResume = document.getElementById('btn-resume');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnMainMenu = document.getElementById('btn-main-menu');
        this.btnPlayAgain = document.getElementById('btn-play-again');
        this.btnBackMenu = document.getElementById('btn-back-menu');
        
        this.gameoverOverlay = document.getElementById('gameover-overlay');
        this.finalWinner = document.getElementById('final-winner');
        this.finalScoresDetail = document.getElementById('final-scores-detail');
    }
    
    showScreen(screen) {
        if (this.screens.menu) this.screens.menu.classList.add('hidden');
        if (this.screens.game) this.screens.game.classList.add('hidden');
        if (this.screens.pause) this.screens.pause.classList.add('hidden');
        if (this.gameoverOverlay) this.gameoverOverlay.classList.add('hidden');
        
        if (screen === 'menu' && this.screens.menu) this.screens.menu.classList.remove('hidden');
        if (screen === 'game' && this.screens.game) this.screens.game.classList.remove('hidden');
        if (screen === 'pause' && this.screens.pause) this.screens.pause.classList.remove('hidden');
    }
    
    setPlayerNames(p1Name, p2Name) {
        const p1Elem = document.querySelector('#player1-score-area .player-name');
        const p2Elem = document.querySelector('#player2-score-area .player-name');
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
        if (this.gameoverOverlay) this.gameoverOverlay.classList.remove('hidden');
        if (this.finalWinner) {
            if (isTie) this.finalWinner.textContent = "🤝 IT'S A TIE! 🤝";
            else this.finalWinner.textContent = `🏆 ${winner} WINS! 🏆`;
        }
        if (this.finalScoresDetail) {
            this.finalScoresDetail.textContent = `P1: ${score1}  |  P2: ${score2}`;
        }
    }
}

// ============ BOT PLAYER ============
class BotPlayer {
    constructor(boardSize) {
        this.boardSize = boardSize;
    }
    
    selectStrikerPosition(board, coins, color) {
        // Simple: return random position between 20-80%
        return Utils.randomRange(30, 70);
    }
    
    async calculateMove(striker, coins, board, color) {
        // Find closest coin to striker
        if (!striker.body) return null;
        
        let closest = null;
        let minDist = Infinity;
        
        for (let coin of coins) {
            if (!coin.pocketed && coin.type !== 'queen') {
                const dx = coin.x - striker.body.x;
                const dy = coin.y - striker.body.y;
                const dist = Math.hypot(dx, dy);
                if (dist < minDist && dist > 10) {
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
                const power = Math.min(0.8, 200 / length);
                return {
                    velocityX: (dx / length) * power * 10,
                    velocityY: (dy / length) * power * 10
                };
            }
        }
        
        // Random shot
        const angle = Math.random() * Math.PI * 2;
        const power = 0.5 + Math.random() * 0.7;
        return {
            velocityX: Math.cos(angle) * power * 10,
            velocityY: Math.sin(angle) * power * 10
        };
    }
}

// ============ MAIN GAME CONTROLLER ============
class CarromGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.calculateBoardSize();
        
        this.physics = new PhysicsEngine();
        this.board = new CarromBoard(this.physics, this.boardSize);
        this.coinManager = new CoinManager(this.physics, this.boardSize);
        this.striker = new Striker(this.physics, this.boardSize);
        this.controls = new Controls(this.canvas, this.striker, this.board);
        this.ui = new UIManager();
        this.bot = new BotPlayer(this.boardSize);
        
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
        
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        
        this.setupEventListeners();
        
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
        
        // Show menu initially
        this.ui.showScreen('menu');
        this.drawMenuPreview();
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
            this.ui.btnSinglePlayer.addEventListener('click', () => this.startGame('single'));
        }
        if (this.ui.btnTwoPlayer) {
            this.ui.btnTwoPlayer.addEventListener('click', () => this.startGame('two'));
        }
        if (this.ui.btnPause) {
            this.ui.btnPause.addEventListener('click', () => this.pauseGame());
        }
        if (this.ui.btnResume) {
            this.ui.btnResume.addEventListener('click', () => this.resumeGame());
        }
        if (this.ui.btnRestart) {
            this.ui.btnRestart.addEventListener('click', () => this.restartGame());
        }
        if (this.ui.btnMainMenu) {
            this.ui.btnMainMenu.addEventListener('click', () => this.goToMainMenu());
        }
        if (this.ui.btnPlayAgain) {
            this.ui.btnPlayAgain.addEventListener('click', () => this.restartGame());
        }
        if (this.ui.btnBackMenu) {
            this.ui.btnBackMenu.addEventListener('click', () => this.goToMainMenu());
        }
        if (this.ui.strikerSlider) {
            this.ui.strikerSlider.addEventListener('input', () => this.updateStrikerPosition());
        }
        
        this.controls.onShoot = (vx, vy) => this.onStrikerShot(vx, vy);
        
        window.addEventListener('resize', Utils.debounce(() => {
            if (this.gameActive) {
                this.handleResize();
            }
        }, 250));
    }
    
    drawMenuPreview() {
        if (this.board && this.ctx) {
            this.board.render(this.ctx);
            this.coinManager.render(this.ctx);
        }
    }
    
    startGame(mode) {
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
            setTimeout(() => this.executeBotTurn(), 400);
        } else {
            this.ui.enableSlider();
            this.controls.enable();
            const playerName = this.gameMode === 'single' ? 'Player' : `Player ${this.currentPlayer}`;
            this.ui.updateTurnIndicator(playerName);
        }
    }
    
    async executeBotTurn() {
        if (!this.gameActive || this.currentPlayer !== 2) return;
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const sliderPos = this.bot.selectStrikerPosition(this.board, this.coinManager.coins, this.playerColors[2]);
        this.ui.setSliderValue(sliderPos);
        this.updateStrikerPosition();
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (this.striker.body && !this.striker.hasBeenShot) {
            const dx = (Math.random() - 0.5) * 2;
            const dy = Math.random() * 1.5 + 0.5;
            const len = Math.hypot(dx, dy);
            const power = 0.6 + Math.random() * 0.6;
            const vx = (dx / len) * power * 11;
            const vy = (dy / len) * power * 11;
            this.onStrikerShot(vx, vy);
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
        
        for (let coin of pocketed) {
            if (coin.type === this.playerColors[this.currentPlayer] || coin.type === 'coin') {
                scoredOwn = true;
                pointsEarned += coin.score;
            }
            if (coin.type === 'queen') {
                scoredQueen = true;
                pointsEarned += coin.score;
            }
        }
        
        if (scoredQueen && this.queenPocketedBy === null) {
            this.queenPocketedBy = this.currentPlayer;
            this.ui.showMessage('👑 Queen pocketed! Cover it with your coin next turn!');
        }
        
        if (this.queenPocketedBy === this.currentPlayer && scoredOwn && !scoredQueen) {
            this.queenCovered = true;
            pointsEarned += 50;
            this.ui.showMessage('✨ Queen covered! +50 points! ✨');
        }
        
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
        
        if (pointsEarned > 0) {
            this.scores[this.currentPlayer] += pointsEarned;
            this.ui.updateScores(this.scores[1], this.scores[2]);
        }
        
        if (this.queenPocketedBy === this.currentPlayer && !this.queenCovered && !scoredOwn && pocketed.length > 0) {
            this.coinManager.returnQueen();
            this.queenPocketedBy = null;
            this.ui.showMessage('Queen returned! Failed to cover.');
        }
        
        this.striker.remove();
        
        if (this.checkGameOver()) return;
        
        const keepTurn = (pointsEarned > 0 && !strikerPocketed) || scoredOwn;
        
        setTimeout(() => {
            if (!keepTurn) {
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                this.ui.setActivePlayer(this.currentPlayer);
            } else if (pointsEarned > 0) {
                this.ui.showMessage('🎯 Extra turn! Keep shooting!');
            }
            this.startTurn();
        }, 1200);
    }
    
    checkGameOver() {
        const blackRemaining = this.coinManager.hasCoinsRemaining('black');
        const whiteRemaining = this.coinManager.hasCoinsRemaining('white');
        
        if (!blackRemaining || !whiteRemaining) {
            let winner;
            if (this.scores[1] > this.scores[2]) {
                winner = this.gameMode === 'single' ? 'Player' : 'Player 1';
            } else if (this.scores[2] > this.scores[1]) {
                winner = this.gameMode === 'single' ? 'Bot' : 'Player 2';
            } else {
                winner = null;
            }
            
            setTimeout(() => {
                this.gameActive = false;
                this.physics.stop();
                this.controls.disable();
                this.ui.showGameOver(winner, this.scores[1], this.scores[2], winner === null);
            }, 500);
            return true;
        }
        return false;
    }
    
    pauseGame() {
        if (this.gameActive) {
            this.physics.stop();
            this.controls.disable();
            this.ui.showScreen('pause');
        }
    }
    
    resumeGame() {
        this.physics.start();
        if (this.gameActive && !this.isProcessingTurn) {
            this.controls.enable();
        }
        this.ui.showScreen('game');
    }
    
    restartGame() {
        this.physics.stop();
        this.physics.clear();
        this.startGame(this.gameMode);
    }
    
    goToMainMenu() {
        this.gameActive = false;
        this.physics.stop();
        this.physics.clear();
        this.controls.disable();
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
        } else if (!this.gameActive && this.ui.screens.menu && !this.ui.screens.menu.classList.contains('hidden')) {
            this.drawMenuPreview();
        }
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    render() {
        if (this.ctx && this.board) {
            this.ctx.clearRect(0, 0, this.boardSize, this.boardSize);
            this.board.render(this.ctx);
            this.coinManager.render(this.ctx);
            this.striker.render(this.ctx);
            this.controls.renderAimLine(this.ctx);
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new CarromGame();
});
