/**
 * Main Game Controller - Carrom Game
 * Handles game state, turn management, scoring, and game flow
 */

class CarromGame {
    constructor() {
        // Get canvas and calculate size
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.calculateBoardSize();
        
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
        this.hasExtraTurn = false;
        this.boardSize = 550;
        
        // Will be initialized in startGame
        this.physics = null;
        this.board = null;
        this.coinManager = null;
        this.striker = null;
        this.controls = null;
        this.ui = null;
        this.bot = null;
        
        // Bind methods
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        // Initialize UI and Bot
        this.ui = new UIManager();
        this.bot = new BotPlayer(this.boardSize);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start render loop
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop);
    }

    calculateBoardSize() {
        const container = document.getElementById('canvas-container');
        if (container) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            this.boardSize = Math.min(containerWidth, containerHeight, 550);
        } else {
            this.boardSize = 550;
        }
        
        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.boardSize * dpr;
        this.canvas.height = this.boardSize * dpr;
        this.canvas.style.width = `${this.boardSize}px`;
        this.canvas.style.height = `${this.boardSize}px`;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }

    setupEventListeners() {
        // Menu buttons
        if (this.ui.btnSinglePlayer) {
            this.ui.btnSinglePlayer.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Single Player mode selected');
                this.startGame('single');
            });
        }
        
        if (this.ui.btnTwoPlayer) {
            this.ui.btnTwoPlayer.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Two Player mode selected');
                this.startGame('two');
            });
        }
        
        // Pause menu
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
        
        // Game over buttons
        if (this.ui.btnPlayAgain) {
            this.ui.btnPlayAgain.addEventListener('click', () => this.restartGame());
        }
        if (this.ui.btnBackMenu) {
            this.ui.btnBackMenu.addEventListener('click', () => this.goToMainMenu());
        }
        
        // Striker slider
        if (this.ui.strikerSlider) {
            this.ui.strikerSlider.addEventListener('input', () => this.updateStrikerPosition());
        }
        
        // Window resize
        if (window.Utils && Utils.debounce) {
            window.addEventListener('resize', Utils.debounce(() => {
                if (this.gameActive) {
                    this.handleResize();
                }
            }, 250));
        } else {
            window.addEventListener('resize', () => {
                if (this.gameActive) {
                    this.handleResize();
                }
            });
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
        this.hasExtraTurn = false;
        this.gameActive = true;
        this.isProcessingTurn = false;
        
        // Setup player names
        if (mode === 'single') {
            this.ui.setPlayerNames('Player', 'Bot');
        } else {
            this.ui.setPlayerNames('Player 1', 'Player 2');
        }
        
        // Initialize physics engine
        this.calculateBoardSize();
        this.physics = new PhysicsEngine();
        this.physics.init(this.canvas, this.boardSize, this.boardSize);
        
        // Create game components
        this.board = new CarromBoard(this.physics, this.boardSize);
        this.coinManager = new CoinManager(this.physics, this.boardSize);
        this.striker = new Striker(this.physics, this.boardSize);
        this.controls = new Controls(this.canvas, this.striker, this.board);
        
        // Set up shoot callback
        this.controls.onShoot = (vx, vy) => this.onStrikerShot(vx, vy);
        
        // Create coins
        this.coinManager.createCoins();
        
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
        if (!this.gameActive) return;
        
        this.isProcessingTurn = false;
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
            setTimeout(() => this.executeBotTurn(), 500);
        } else {
            // Human's turn
            this.ui.enableSlider();
            this.controls.enable();
            const playerName = this.gameMode === 'single' ? 'Player' : `Player ${this.currentPlayer}`;
            this.ui.updateTurnIndicator(playerName);
            this.ui.showMessage(`${playerName}'s turn - Drag on board to aim and shoot!`, 1500);
        }
    }

    async executeBotTurn() {
        if (!this.gameActive || this.currentPlayer !== 2) return;
        
        // Wait a bit for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!this.gameActive) return;
        
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
        
        if (!this.gameActive) return;
        
        // Calculate and execute shot
        const shot = await this.bot.calculateMove(
            this.striker,
            this.coinManager.coins,
            this.board,
            this.playerColors[2]
        );
        
        if (shot && this.gameActive && this.striker.body && !this.striker.hasBeenShot) {
            this.striker.shoot(shot.velocityX, shot.velocityY);
            this.onStrikerShot(shot.velocityX, shot.velocityY);
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
        this.isProcessingTurn = true;
    }

    update() {
        if (!this.gameActive || !this.isProcessingTurn) return;
        
        // Check if all pieces have stopped
        const allCoins = this.coinManager.getActiveCoinBodies();
        const strikerBody = this.striker.body;
        const allBodies = strikerBody && strikerBody.active ? [...allCoins, strikerBody] : allCoins;
        
        // Use global Utils if available, otherwise check manually
        let allStopped = true;
        for (let body of allBodies) {
            if (body && body.active && (Math.abs(body.vx) > 0.2 || Math.abs(body.vy) > 0.2)) {
                allStopped = false;
                break;
            }
        }
        
        if (allStopped) {
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
        
        for (let coin of pocketed) {
            if (coin.type === ownColor) {
                result.scoredOwn = true;
                result.pointsEarned += coin.score;
            } else if (coin.type === opponentColor) {
                result.scoredOpponent = true;
            } else if (coin.type === 'queen') {
                result.scoredQueen = true;
                result.pointsEarned += coin.score;
            }
        }
        
        // Handle queen logic
        if (result.scoredQueen) {
            if (this.queenPocketedBy === null) {
                this.queenPocketedBy = this.currentPlayer;
                result.message = '👑 Queen pocketed! Cover it next turn.';
            }
        }
        
        // Check if queen was covered
        if (this.queenPocketedBy === this.currentPlayer && result.scoredOwn && !result.scoredQueen) {
            this.queenCovered = true;
            result.pointsEarned += 50;
            result.message = '✨ Queen covered! +50 points! ✨';
        }
        
        // Handle striker foul
        if (result.strikerFoul) {
            result.pointsEarned = 0;
            result.message = '❌ Foul! Striker pocketed. -1 point';
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
                result.message = '⚠️ Three fouls! -10 points penalty.';
            }
            
            result.switchTurn = true;
        } else {
            this.foulStreak[this.currentPlayer] = 0;
            
            // Keep turn if scored own color
            if (result.scoredOwn && !result.scoredOpponent) {
                result.switchTurn = false;
                this.hasExtraTurn = true;
            }
            
            // Check if queen needs covering
            if (this.queenPocketedBy === this.currentPlayer && !this.queenCovered && !result.scoredOwn && pocketed.length > 0) {
                // Failed to cover - return queen
                this.coinManager.returnQueen();
                this.queenPocketedBy = null;
                result.message = 'Queen returned! Failed to cover.';
            }
        }
        
        // Handle pocketing opponent's coins
        if (result.scoredOpponent && !result.strikerFoul) {
            result.switchTurn = true;
        }
        
        return result;
    }

    applyTurnResult(result) {
        // Deduct points for foul
        if (result.strikerFoul) {
            this.scores[this.currentPlayer] = Math.max(0, this.scores[this.currentPlayer] - 1);
            this.ui.updateScores(this.scores[1], this.scores[2]);
        }
        
        // Add points
        if (result.pointsEarned > 0) {
            this.scores[this.currentPlayer] += result.pointsEarned;
            this.ui.updateScores(this.scores[1], this.scores[2]);
            if (result.pointsEarned >= 10) {
                this.ui.showMessage(`🎯 +${result.pointsEarned} points!`);
            }
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
                const playerName = this.gameMode === 'single' && this.currentPlayer === 2 ? 'Bot' : `Player ${this.currentPlayer}`;
                this.ui.showMessage(`${playerName}'s turn`);
            } else if (this.hasExtraTurn) {
                this.ui.showMessage('🎯 Extra turn! Keep shooting!');
                this.hasExtraTurn = false;
            }
            
            this.startTurn();
        }, result.message ? 1500 : 500);
    }

    checkGameOver() {
        const blackRemaining = this.coinManager.hasCoinsRemaining('black');
        const whiteRemaining = this.coinManager.hasCoinsRemaining('white');
        
        // Check win condition - score reaches 100 or all coins of one color pocketed
        if (this.scores[1] >= 100 || this.scores[2] >= 100 || !blackRemaining || !whiteRemaining) {
            let winner = null;
            if (this.scores[1] >= 100 || (!whiteRemaining && this.scores[1] >= this.scores[2])) {
                winner = this.gameMode === 'single' ? 'Player' : 'Player 1';
            } else if (this.scores[2] >= 100 || (!blackRemaining && this.scores[2] >= this.scores[1])) {
                winner = this.gameMode === 'single' ? 'Bot' : 'Player 2';
            } else if (this.scores[1] > this.scores[2]) {
                winner = this.gameMode === 'single' ? 'Player' : 'Player 1';
            } else if (this.scores[2] > this.scores[1]) {
                winner = this.gameMode === 'single' ? 'Bot' : 'Player 2';
            }
            
            setTimeout(() => {
                this.gameActive = false;
                if (this.controls) this.controls.disable();
                if (this.physics) this.physics.stop();
                this.ui.showGameOver(winner, this.scores[1], this.scores[2], winner === null);
            }, 500);
            
            return true;
        }
        
        return false;
    }

    handleCollision(event) {
        // Collision handling - can be used for sound effects
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
        if (this.gameMode) {
            this.startGame(this.gameMode);
        }
    }

    goToMainMenu() {
        this.gameActive = false;
        if (this.physics) {
            this.physics.stop();
            this.physics.clear();
        }
        if (this.controls) this.controls.disable();
        this.ui.showScreen('menu');
    }

    handleResize() {
        this.calculateBoardSize();
        if (this.gameActive) {
            this.ui.showMessage('Screen resized', 1000);
        }
    }

    gameLoop(timestamp) {
        if (this.gameActive) {
            this.update();
            this.render();
        }
        requestAnimationFrame(this.gameLoop);
    }

    render() {
        if (!this.ctx || !this.board) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.boardSize, this.boardSize);
        
        // Draw board
        this.board.render(this.ctx);
        
        // Draw coins
        if (this.coinManager) this.coinManager.render(this.ctx);
        
        // Draw striker
        if (this.striker) this.striker.render(this.ctx);
        
        // Draw aim line
        if (this.controls) this.controls.renderAimLine(this.ctx);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CarromGame...');
    window.game = new CarromGame();
});
