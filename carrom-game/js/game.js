/**
 * Main Game Controller - Carrom Game
 * Orchestrates all game components and manages game state
 * Works with separate files: utils.js, physics.js, board.js, coins.js, 
 * striker.js, controls.js, bot.js, ui.js
 */

class CarromGame {
    constructor() {
        // Get canvas element
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Game components (initialized later)
        this.physics = null;
        this.board = null;
        this.coinManager = null;
        this.striker = null;
        this.controls = null;
        this.ui = null;
        this.bot = null;
        
        // Game state
        this.gameMode = null;      // 'single' or 'two'
        this.currentPlayer = 1;     // 1 = Player 1, 2 = Player 2
        this.scores = { 1: 0, 2: 0 };
        this.playerColors = { 1: 'black', 2: 'white' };
        this.queenPocketedBy = null;
        this.queenCovered = false;
        this.isProcessingTurn = false;
        this.gameActive = false;
        this.foulStreak = { 1: 0, 2: 0 };
        this.extraTurn = false;
        this.boardSize = 550;
        
        // Bind methods
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        
        // Initialize UI Manager (must be first)
        this.ui = new UIManager();
        
        // Initialize Bot Player
        this.bot = new BotPlayer(this.boardSize);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Calculate board size based on container
        this.calculateBoardSize();
        
        // Show main menu
        this.ui.showScreen('menu');
        
        // Draw preview on menu
        setTimeout(() => this.drawMenuPreview(), 100);
        
        // Start game loop
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
        
        console.log('CarromGame initialized. Ready to play!');
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
        
        // Set canvas dimensions with device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.boardSize * dpr;
        this.canvas.height = this.boardSize * dpr;
        this.canvas.style.width = `${this.boardSize}px`;
        this.canvas.style.height = `${this.boardSize}px`;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }
    
    setupEventListeners() {
        // Main menu buttons - FIXED: Properly bind to start game
        if (this.ui.btnSinglePlayer) {
            this.ui.btnSinglePlayer.onclick = (e) => {
                e.preventDefault();
                console.log('Single Player vs Bot mode selected');
                this.startGame('single');
            };
        }
        
        if (this.ui.btnTwoPlayer) {
            this.ui.btnTwoPlayer.onclick = (e) => {
                e.preventDefault();
                console.log('Local 2 Player mode selected');
                this.startGame('two');
            };
        }
        
        // Pause menu buttons
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
        
        // Game over screen buttons
        if (this.ui.btnPlayAgain) {
            this.ui.btnPlayAgain.onclick = () => this.restartGame();
        }
        
        if (this.ui.btnBackMenu) {
            this.ui.btnBackMenu.onclick = () => this.goToMainMenu();
        }
        
        // Striker slider
        if (this.ui.strikerSlider) {
            this.ui.strikerSlider.oninput = () => this.updateStrikerPosition();
        }
        
        // Window resize handler
        window.addEventListener('resize', Utils.debounce(() => {
            if (this.gameActive) {
                this.handleResize();
            }
        }, 250));
    }
    
    drawMenuPreview() {
        if (this.ctx && this.boardSize) {
            // Create temporary components for preview
            const tempPhysics = new PhysicsEngine();
            tempPhysics.init(this.canvas, this.boardSize, this.boardSize);
            const tempBoard = new CarromBoard(tempPhysics, this.boardSize);
            const tempCoinManager = new CoinManager(tempPhysics, this.boardSize);
            tempCoinManager.createCoins();
            
            // Draw preview
            tempBoard.render(this.ctx);
            tempCoinManager.render(this.ctx);
        }
    }
    
    startGame(mode) {
        console.log(`Starting game in ${mode} mode...`);
        
        // Reset game state
        this.gameMode = mode;
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.queenPocketedBy = null;
        this.queenCovered = false;
        this.foulStreak = { 1: 0, 2: 0 };
        this.extraTurn = false;
        this.gameActive = true;
        this.isProcessingTurn = false;
        
        // Set player names in UI
        if (mode === 'single') {
            this.ui.setPlayerNames('Player', 'Bot');
        } else {
            this.ui.setPlayerNames('Player 1', 'Player 2');
        }
        
        // Initialize physics engine
        this.calculateBoardSize();
        this.physics = new PhysicsEngine();
        this.physics.init(this.canvas, this.boardSize, this.boardSize);
        
        // Initialize game components
        this.board = new CarromBoard(this.physics, this.boardSize);
        this.coinManager = new CoinManager(this.physics, this.boardSize);
        this.striker = new Striker(this.physics, this.boardSize);
        this.controls = new Controls(this.canvas, this.striker, this.board);
        
        // Set up shoot callback
        this.controls.onShoot = (vx, vy) => this.onStrikerShot(vx, vy);
        
        // Create coins on the board
        this.coinManager.createCoins();
        
        // Start physics engine
        this.physics.start();
        
        // Show game screen
        this.ui.showScreen('game');
        this.ui.updateScores(0, 0);
        this.ui.setActivePlayer(1);
        this.ui.updateTurnIndicator('Player 1');
        
        // Start first turn
        this.startTurn();
    }
    
    startTurn() {
        if (!this.gameActive) return;
        
        this.isProcessingTurn = false;
        this.ui.setSliderValue(50);
        
        // Place striker at appropriate position based on player
        const pos = this.board.getStrikerPosition(50, this.currentPlayer);
        this.striker.create(pos.x, pos.y);
        
        // Handle turn based on game mode
        if (this.gameMode === 'single' && this.currentPlayer === 2) {
            // Bot's turn - disable controls and execute bot move
            this.ui.disableSlider();
            this.controls.disable();
            this.ui.updateTurnIndicator('Bot', true);
            setTimeout(() => this.executeBotTurn(), 500);
        } else {
            // Human player's turn - enable controls
            this.ui.enableSlider();
            this.controls.enable();
            const playerName = this.gameMode === 'single' ? 'Player' : `Player ${this.currentPlayer}`;
            this.ui.updateTurnIndicator(playerName);
            this.ui.showMessage(`${playerName}'s turn - Aim by dragging on board!`, 1500);
        }
    }
    
    async executeBotTurn() {
        if (!this.gameActive || this.currentPlayer !== 2) return;
        
        // Short delay for natural feel
        await new Promise(resolve => setTimeout(resolve, 400));
        
        if (!this.gameActive) return;
        
        // Bot selects striker position
        const sliderPos = this.bot.selectStrikerPosition(
            this.board, 
            this.coinManager.coins, 
            this.playerColors[2]
        );
        this.ui.setSliderValue(sliderPos);
        this.updateStrikerPosition();
        
        // Delay before shooting
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (this.striker.body && !this.striker.hasBeenShot && this.gameActive) {
            // Bot calculates and executes shot
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
        
        // Get all moving bodies
        const allCoins = this.coinManager.getActiveCoinBodies();
        const strikerBody = this.striker.body;
        const allBodies = strikerBody && strikerBody.active ? [...allCoins, strikerBody] : allCoins;
        
        // Check if all bodies have stopped moving
        if (Utils.allBodiesStopped(allBodies, 0.2)) {
            this.processTurnResult();
        }
    }
    
    processTurnResult() {
        if (!this.isProcessingTurn) return;
        this.isProcessingTurn = false;
        
        // Check for pocketed coins and striker
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
            // Only enable controls if it's human player's turn
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
        // Note: Full repositioning of game elements would require reinitialization
        // For simplicity, we just resize the canvas
        if (this.gameActive) {
            this.ui.showMessage('Screen resized - restart recommended for optimal view', 2000);
        }
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
            // Clear canvas
            this.ctx.clearRect(0, 0, this.boardSize, this.boardSize);
            
            // Draw game elements
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
