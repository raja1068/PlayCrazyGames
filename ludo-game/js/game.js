/**
 * GAME MODULE
 * Manages game state, turn order, dice logic, and win conditions
 */

class LudoGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.diceValue = 0;
        this.extraTurn = false;
        this.consecutiveSixes = 0;
        this.waitingForMove = false;
        this.gameActive = true;
        this.winner = null;
        this.rolledValue = 0;
        this.selectedToken = null;
        
        // DOM elements
        this.boardElement = document.getElementById('ludoBoard');
        this.diceFace = document.getElementById('diceFace');
        this.rollBtn = document.getElementById('rollBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.turnPlayer = document.getElementById('turnPlayer');
        this.gameStatus = document.getElementById('gameStatus');
    }
    
    // Initialize game with 4 players
    init() {
        const colors = ['red', 'green', 'yellow', 'blue'];
        this.players = [];
        for (const color of colors) {
            this.players.push(new Player(color));
        }
        this.currentPlayerIndex = 0;
        this.extraTurn = false;
        this.consecutiveSixes = 0;
        this.waitingForMove = false;
        this.gameActive = true;
        this.winner = null;
        this.selectedToken = null;
        
        this.updateUI();
        this.renderTokens();
        this.addMessage(`🎲 Game started! ${this.getCurrentPlayer().getEmoji()} to play`);
    }
    
    // Get current player
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    // Roll dice animation and logic
    rollDice() {
        if (this.waitingForMove) {
            this.addMessage("⚠️ Move a token before rolling again!");
            return;
        }
        
        if (!this.gameActive || this.winner) {
            this.addMessage("Game over! Press New Game to play again.");
            return;
        }
        
        // Animate dice roll
        this.animateDiceRoll();
        
        // Generate random dice value (1-6)
        setTimeout(() => {
            const dice = Math.floor(Math.random() * 6) + 1;
            this.rolledValue = dice;
            this.updateDiceFace(dice);
            
            const currentPlayer = this.getCurrentPlayer();
            this.addMessage(`${currentPlayer.getEmoji()} rolled ${dice}`);
            
            // Check for three consecutive sixes
            if (dice === 6) {
                this.consecutiveSixes++;
                if (this.consecutiveSixes === 3) {
                    this.addMessage(`❌ Three 6's in a row! Turn cancelled!`);
                    this.consecutiveSixes = 0;
                    this.extraTurn = false;
                    this.nextTurn();
                    return;
                }
                this.extraTurn = true;
            } else {
                this.consecutiveSixes = 0;
                this.extraTurn = false;
            }
            
            // Check if player has any valid moves
            if (!currentPlayer.hasValidMove(dice)) {
                this.addMessage(`😞 No valid moves! Turn ends.`);
                this.nextTurn();
                return;
            }
            
            // Enable token selection
            this.waitingForMove = true;
            this.addMessage(`🎲 Rolled ${dice}. Click a token to move!`);
            this.highlightPossibleMoves(currentPlayer, dice);
            
        }, 200);
    }
    
    // Animate dice rolling
    animateDiceRoll() {
        const diceElement = document.getElementById('dice');
        diceElement.classList.add('dice-rolling');
        
        // Random face changes during animation
        let rollCount = 0;
        const interval = setInterval(() => {
            const fakeRoll = Math.floor(Math.random() * 6) + 1;
            const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            this.diceFace.textContent = faces[fakeRoll - 1];
            rollCount++;
            if (rollCount > 8) {
                clearInterval(interval);
                diceElement.classList.remove('dice-rolling');
            }
        }, 50);
    }
    
    // Handle token move selection
    handleTokenMove(token) {
        if (!this.waitingForMove) {
            this.addMessage("🎲 Roll the dice first!");
            return false;
        }
        
        const currentPlayer = this.getCurrentPlayer();
        
        // Verify token belongs to current player
        if (token.color !== currentPlayer.color) {
            this.addMessage(`❌ That's not your token! ${currentPlayer.getEmoji()} is playing.`);
            return false;
        }
        
        // Check if move is valid
        if (!currentPlayer.canMoveToken(token, this.rolledValue)) {
            this.addMessage(`❌ Cannot move this token with a ${this.rolledValue}!`);
            return false;
        }
        
        // Remove highlights
        this.clearHighlights();
        
        // Execute move
        const moved = currentPlayer.moveToken(token, this.rolledValue, this);
        
        if (moved) {
            this.renderTokens();
            
            // Check for win condition
            if (currentPlayer.completedTokens === 4) {
                this.gameActive = false;
                this.winner = currentPlayer.color;
                this.showVictory(`${currentPlayer.getEmoji()} WINS THE GAME! 🏆`);
                return true;
            }
            
            // Handle next turn or extra turn
            this.waitingForMove = false;
            
            if (this.extraTurn && this.rolledValue === 6) {
                this.addMessage(`✨ Extra turn! ${currentPlayer.getEmoji()} rolls again! ✨`);
                this.updateUI();
            } else {
                this.nextTurn();
            }
            
            this.renderTokens();
            return true;
        }
        
        return false;
    }
    
    // Highlight tokens that can move
    highlightPossibleMoves(player, diceValue) {
        this.clearHighlights();
        
        for (const token of player.tokens) {
            if (player.canMoveToken(token, diceValue)) {
                const tokenElement = this.findTokenElement(token.color, token.id);
                if (tokenElement) {
                    tokenElement.classList.add('highlight-move');
                }
            }
        }
    }
    
    // Find token DOM element
    findTokenElement(color, tokenId) {
        const tokens = document.querySelectorAll(`.token-${color}`);
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].dataset.tokenId == tokenId) {
                return tokens[i];
            }
        }
        return null;
    }
    
    // Clear all highlights
    clearHighlights() {
        document.querySelectorAll('.highlight-move').forEach(el => {
            el.classList.remove('highlight-move');
        });
    }
    
    // Move to next player
    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.extraTurn = false;
        this.waitingForMove = false;
        this.rolledValue = 0;
        this.consecutiveSixes = 0;
        this.selectedToken = null;
        this.clearHighlights();
        this.updateUI();
        this.addMessage(`${this.getCurrentPlayer().getEmoji()}'s turn. Roll the dice!`);
        this.renderTokens();
    }
    
    // Render all tokens on board
    renderTokens() {
        // Remove existing token elements
        document.querySelectorAll('.token').forEach(el => el.remove());
        
        for (const player of this.players) {
            for (const token of player.tokens) {
                const position = token.getPosition();
                let parentCell = null;
                
                if (position.type === 'yard') {
                    const [row, col] = Board.getYardPosition(position.color, position.tokenId);
                    parentCell = Board.getCell(row, col);
                } 
                else if (position.type === 'path') {
                    const [row, col] = Board.getPathCoordinate(position.index);
                    parentCell = Board.getCell(row, col);
                }
                else if (position.type === 'homeStretch') {
                    const [row, col] = Board.getHomeStretchCoordinate(position.color, position.step);
                    parentCell = Board.getCell(row, col);
                }
                else if (position.type === 'home') {
                    const [row, col] = Board.getHomeTrianglePosition(token.color);
                    parentCell = Board.getCell(row, col);
                }
                
                if (parentCell) {
                    const tokenDiv = document.createElement('div');
                    tokenDiv.className = `token token-${token.color}`;
                    tokenDiv.dataset.tokenId = token.id;
                    tokenDiv.dataset.color = token.color;
                    
                    // Add click handler
                    tokenDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.handleTokenMove(token);
                    });
                    
                    parentCell.appendChild(tokenDiv);
                }
            }
        }
    }
    
    // Update dice face display
    updateDiceFace(value) {
        const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        this.diceFace.textContent = faces[value - 1];
    }
    
    // Update UI elements
    updateUI() {
        if (this.winner) return;
        const player = this.getCurrentPlayer();
        const colorNames = { red: '🔴 Red', green: '🟢 Green', yellow: '🟡 Yellow', blue: '🔵 Blue' };
        this.turnPlayer.innerHTML = colorNames[player.color];
        this.turnPlayer.style.color = player.color === 'yellow' ? '#8B6914' : 
                                       player.color === 'red' ? '#ff4444' :
                                       player.color === 'green' ? '#44ff44' : '#4488ff';
    }
    
    // Add status message
    addMessage(msg) {
        this.gameStatus.textContent = msg;
        setTimeout(() => {
            if (this.gameActive && !this.winner && !this.waitingForMove) {
                this.gameStatus.textContent = `🎲 ${this.getCurrentPlayer().getEmoji()}'s turn - Roll dice!`;
            }
        }, 2000);
    }
    
    // Show victory modal
    showVictory(message) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🏆 ${message} 🏆</h2>
                <button onclick="location.reload()">Play Again</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Reset game
    resetGame() {
        this.init();
        this.renderTokens();
        this.updateUI();
        this.addMessage("Game restarted! Good luck!");
        this.rollBtn.disabled = false;
    }
    
    // Enable/disable roll button
    setRollButtonEnabled(enabled) {
        this.rollBtn.disabled = !enabled;
    }
}
