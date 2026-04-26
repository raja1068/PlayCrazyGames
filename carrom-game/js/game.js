/**
 * Main game controller
 */
class CarromGame {
    constructor() {
        // Get canvas and calculate size
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.calculateBoardSize();
        
        // Initialize components
        this.physics = new PhysicsEngine();
        this.board = new CarromBoard(this.physics, this.boardSize);
        this.coinManager = new CoinManager(this.physics, this.boardSize);
        this.striker = new Striker(this.physics, this.boardSize);
        this.controls = new Controls(this.canvas, this.striker, this.board);
        this.ui = new UIManager();
        this.bot = new BotPlayer(this.boardSize);
        
        // Game state
        this.gameMode = null; // 'single' or 'two'
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.playerColors = { 1: 'black', 2: 'white' };
        this.queenPocketedBy = null;
        this.queenCovered = false;
        this.isProcessingTurn = false;
        this.gameActive = false;
        this.foulStreak = { 1: 0, 2: 0 };
        
        // Bind methods
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start render loop
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    calculateBoardSize() {
        const container = document.getElementById('canvas-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Make board square, fitting within container
        this.boardSize = Math.min(containerWidth, containerHeight, 600);
        
        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.boardSize * dpr;
        this.canvas.height = this.boardSize * dpr;
        this.canvas.style.width = `${this.boardSize}px`;
        this.canvas.style.height = `${this.boardSize}px`;
        this.ctx.scale(dpr, dpr);
    }

    setupEventListeners() {
        // Menu buttons
        this.ui.btnSinglePlayer.addEventListener('click', () => this.startGame('single'));
        this.ui.btnTwoPlayer.addEventListener('click', () => this.startGame('two'));
        
        // Pause menu
        this.ui.btnPause.addEventListener('click', () => this.pauseGame());
        this.ui.btnResume.addEventListener('click', () => this.resumeGame());
        this.ui.btnRestart.addEventListener('click', () => this.restartGame());
        this.ui.btnMainMenu.addEventListener('click', () => this.goToMainMenu());
        
        // Game over
        this.ui.btnPlayAgain.addEventListener('click', () => this.restartGame());
        this.ui.btnBackMenu.addEventListener('click', () => this.goToMainMenu());
        
        // Striker slider
        this.ui.strikerSlider.addEventListener('input', () => this.updateStrikerPosition());
        
        // Controls shoot callback
        this.controls.onShoot = () => this.onStrikerShot();
        
        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            if (this.gameActive) {
                this.handleResize();
            }
        }, 250));
    }

    startGame(mode) {
        this.gameMode = mode;
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.queenPocketedBy = null;
        this.queenCovered = false;
        this.foulStreak = { 1: 0, 2: 0 };
        this.gameActive = true;
        
        // Setup player names
        if (mode === 'single') {
            this.ui.setPlayerNames('Player', 'Bot');
        } else {
            this.ui.setPlayerNames('Player 1', 'Player 2');
        }
        
        // Initialize physics
        this.calculateBoardSize();
        this.physics.init(this.canvas, this.boardSize, this.boardSize);
        
        // Create board and coins
        this.board = new CarromBoard(this.physics, this.boardSize);
        this.coinManager = new CoinManager(this.physics, this.boardSize);
        this.striker = new Striker(this.physics, this.boardSize);
        this.controls = new Controls(this.canvas, this.striker, this.board);
        this.controls.onShoot = () => this.onStrikerShot();
        
        this.board.create();
        this.coinManager.createCoins();
        
        // Setup collision detection
        this.physics.onCollision((event) => this.handleCollision(event));
        
        // Start physics
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
        this.isProcessingTurn = false;
        
        // Reset slider to center
        this.ui.setSliderValue(50);
        
        // Place striker
        const pos = this.board.getStrikerPosition(50, this.currentPlayer);
        this.striker.create(pos.x, pos.y);
        
        // Enable controls for human player
        if (this.gameMode === 'single' && this.currentPlayer === 2) {
            // Bot's turn
            this.ui.disableSlider();
            this.controls.disable();
            this.ui.updateTurnIndicator('Bot', true);
            this.executeBotTurn();
        } else {
            // Human's turn
            this.ui.enableSlider();
            this.controls.enable();
            const playerName = this.gameMode === 'single' ? 'Player' : `Player ${this.currentPlayer}`;
            this.ui.updateTurnIndicator(playerName);
        }
    }

    async executeBotTurn() {
        // Wait a bit for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Bot selects striker position
        const sliderPos = this.bot.selectStrikerPosition(
            this.board,
            this.coinManager.coins,
            this.playerColors[2]
        );
        this.ui.setSliderValue(sliderPos);
        this.updateStrikerPosition();
        
        // Wait for position to settle
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Calculate and execute shot
        const shot = await this.bot.calculateMove(
            this.striker,
            this.coinManager.coins,
            this.board,
            this.playerColors[2]
        );
        
        if (shot && this.gameActive) {
            this.striker.shoot(shot.velocityX, shot.velocityY);
            this.onStrikerShot();
        }
    }

    updateStrikerPosition() {
        if (!this.striker.hasBeenShot) {
            const value = this.ui.getSliderValue();
            const pos = this.board.getStrikerPosition(value, this.currentPlayer);
            this.striker.setPosition(pos.x, pos.y);
        }
    }

    onStrikerShot() {
        this.controls.disable();
        this.ui.disableSlider();
        this.isProcessingTurn = true;
    }

    update() {
        if (!this.gameActive || !this.isProcessingTurn) return;
        
        // Check if all pieces have stopped
        const allCoins = this.coinManager.getActiveCoinBodies();
        const strikerBody = this.striker.body;
        const allBodies = strikerBody ? [...allCoins, strikerBody] : allCoins;
        
        if (Utils.allBodiesStopped(allBodies, 0.15)) {
            this.processTurnResult();
        }
    }

    processTurnResult() {
        if (!this.isProcessingTurn) return;
        this.isProcessingTurn = false;
        
        // Check for pocketed coins
        const pocketed = this.coinManager.checkPocketed(this.board);
        const strikerPocketed = this.striker.isInPocket(this.board);
        
        // Analyze results
        let turnResult = this.analyzeTurn(pocketed, strikerPocketed);
        
        // Apply results
        this.applyTurnResult(turnResult);
        
        // Check for game over
        if (this.checkGameOver()) {
            return;
        }
        
        // Handle turn transition
        this.handleTurnTransition(turnResult);
    }

    analyzeTurn(pocketed, strikerPocketed) {
        const result = {
            scoredOwn: false,
            scoredOpponent: false,
            scoredQueen: false,
            strikerFoul: strikerPocketed,
            pointsEarned: 0,
            coinsToReturn: [],
            switchTurn: true,
            message: null
        };
        
        const ownColor = this.playerColors[this.currentPlayer];
        const opponentColor = this.playerColors[this.currentPlayer === 1 ? 2 : 1];
        
        pocketed.forEach(coin => {
            if (coin.type === ownColor) {
                result.scoredOwn = true;
                result.pointsEarned += coin.score;
            } else if (coin.type === opponentColor) {
                result.scoredOpponent = true;
            } else if (coin.type === 'queen') {
                result.scoredQueen = true;
            }
        });
        
        // Handle queen logic
        if (result.scoredQueen) {
            if (this.queenPocketedBy === null) {
                this.queenPocketedBy = this.currentPlayer;
                result.message = 'Queen pocketed! Cover it next turn.';
            }
        }
        
        // Check if queen was covered
        if (this.queenPocketedBy === this.currentPlayer && result.scoredOwn && !result.scoredQueen) {
            this.queenCovered = true;
            result.pointsEarned += this.coinManager.scores.queen;
            result.message = 'Queen covered! +50 points';
        }
        
        // Handle striker foul
        if (result.strikerFoul) {
            result.pointsEarned = 0;
            result.message = 'Foul! Striker pocketed.';
            this.foulStreak[this.currentPlayer]++;
            
            // Return queen if pocketed but not covered
            if (this.queenPocketedBy === this.currentPlayer && !this.queenCovered) {
                this.coinManager.returnQueen();
                this.queenPocketedBy = null;
            }
            
            // Penalty for 3 consecutive fouls
            if (this.foulStreak[this.currentPlayer] >= 3) {
                this.scores[this.currentPlayer] = Math.max(0, this.scores[this.currentPlayer] - 10);
                this.foulStreak[this.currentPlayer] = 0;
                result.message = 'Three fouls! -10 points penalty.';
            }
            
            result.switchTurn = true;
        } else {
            this.foulStreak[this.currentPlayer] = 0;
            
            // Keep turn if scored own color
            if (result.scoredOwn && !result.scoredOpponent) {
                result.switchTurn = false;
            }
            
            // Check if queen needs covering
            if (this.queenPocketedBy === this.currentPlayer && !this.queenCovered && !result.scoredOwn) {
                // Failed to cover - return queen
                this.coinManager.returnQueen();
                this.queenPocketedBy = null;
                result.message = 'Failed to cover queen!';
            }
        }
        
        // Handle pocketing opponent's coins
        if (result.scoredOpponent && !result.strikerFoul) {
            result.switchTurn = true;
        }
        
        return result;
    }

    applyTurnResult(result) {
        // Add points
        if (result.pointsEarned > 0) {
            this.scores[this.currentPlayer] += result.pointsEarned;
            this.ui.updateScores(this.scores[1], this.scores[2]);
        }
        
        // Show message
        if (result.message) {
            this.ui.showMessage(result.message);
        }
        
        // Remove striker
        this.striker.remove();
    }

    handleTurnTransition(result) {
        setTimeout(() => {
            if (result.switchTurn) {
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                this.ui.setActivePlayer(this.currentPlayer);
            }
            
            this.startTurn();
        }, result.message ? 1500 : 500);
    }

    checkGameOver() {
        const blackRemaining = this.coinManager.hasCoinsRemaining('black');
        const whiteRemaining = this.coinManager.hasCoinsRemaining('white');
        
        // Game ends when one color is completely cleared
        if (!blackRemaining || !whiteRemaining) {
            // Determine winner
            let winner;
            if (this.scores[1] > this.scores[2]) {
                winner = this.gameMode === 'single' ? 'Player' : 'Player 1';
            } else if (this.scores[2] > this.scores[1]) {
                winner = this.gameMode === 'single' ? 'Bot' : 'Player 2';
            } else {
                winner = null; // Tie
            }
            
            setTimeout(() => {
                this.gameActive = false;
                this.controls.disable();
                this.physics.stop();
                this.ui.showGameOver(
                    winner,
                    this.scores[1],
                    this.scores[2],
                    winner === null
                );
            }, 1000);
            
            return true;
        }
        
        return false;
    }

    handleCollision(event) {
        // Sound effects or visual feedback could go here
    }

    pauseGame() {
        this.ui.showScreen('pause');
        this.controls.disable();
    }

    resumeGame() {
        this.ui.showScreen('game');
        if (!this.isProcessingTurn && 
            !(this.gameMode === 'single' && this.currentPlayer === 2)) {
            this.controls.enable();
        }
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
    }

    handleResize() {
        // Recalculate and rebuild for responsive design
        this.calculateBoardSize();
        // Would need to reposition all elements - simplified for this implementation
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        if (this.gameActive) {
            this.update();
            this.render();
        }
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.boardSize, this.boardSize);
        
        // Draw board
        this.board.render(this.ctx);
        
        // Draw coins
        this.coinManager.render(this.ctx);
        
        // Draw striker
        this.striker.render(this.ctx);
        
        // Draw aim line
        this.controls.renderAimLine(this.ctx);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new CarromGame();
});
