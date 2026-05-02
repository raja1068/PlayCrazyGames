/**
 * PLAYER MODULE
 * Defines Token and Player classes with movement and collision logic
 */

// Token class representing a single game piece
class Token {
    constructor(color, id) {
        this.color = color;      // 'red', 'green', 'yellow', 'blue'
        this.id = id;            // 0-3 for token identification
        this.inYard = true;      // Starting in yard
        this.completed = false;  // Reached home
        this.pathIndex = -1;     // Position on main path (0-51)
        this.homeStep = -1;      // Position in home stretch (0-5)
    }
    
    // Get current position type
    getPosition() {
        if (this.completed) return { type: 'home' };
        if (this.inYard) return { type: 'yard', color: this.color, tokenId: this.id };
        if (this.homeStep >= 0) return { type: 'homeStretch', step: this.homeStep, color: this.color };
        return { type: 'path', index: this.pathIndex, color: this.color };
    }
    
    // Reset token for new game
    reset() {
        this.inYard = true;
        this.completed = false;
        this.pathIndex = -1;
        this.homeStep = -1;
    }
}

// Player class managing 4 tokens
class Player {
    constructor(color) {
        this.color = color;
        this.tokens = [];
        this.completedTokens = 0;
        
        // Create 4 tokens
        for (let i = 0; i < 4; i++) {
            this.tokens.push(new Token(color, i));
        }
    }
    
    // Check if any token can move with given dice value
    hasValidMove(diceValue) {
        for (const token of this.tokens) {
            if (this.canMoveToken(token, diceValue)) {
                return true;
            }
        }
        return false;
    }
    
    // Check if a specific token can move
    canMoveToken(token, diceValue) {
        if (token.completed) return false;
        
        // Token in yard - needs exactly 6
        if (token.inYard) {
            return diceValue === 6;
        }
        
        // Token in home stretch
        if (token.homeStep >= 0) {
            const newStep = token.homeStep + diceValue;
            return newStep === 6 || newStep < 6;
        }
        
        // Token on main path
        const newIndex = token.pathIndex + diceValue;
        
        // Check if entering home stretch
        if (newIndex >= Board.MAIN_PATH_LENGTH) {
            const overshoot = newIndex - Board.MAIN_PATH_LENGTH;
            return overshoot >= 0 && overshoot <= 5;
        }
        
        return true;
    }
    
    // Move token and handle collisions
    moveToken(token, diceValue, gameInstance) {
        if (!this.canMoveToken(token, diceValue)) return false;
        
        // Handle yard exit
        if (token.inYard && diceValue === 6) {
            token.inYard = false;
            token.pathIndex = Board.START_INDEX[this.color];
            this.checkCollision(token, gameInstance);
            return true;
        }
        
        // Handle home stretch movement
        if (token.homeStep >= 0) {
            const newStep = token.homeStep + diceValue;
            if (newStep === 6) {
                // Reached home!
                token.completed = true;
                token.homeStep = -1;
                this.completedTokens++;
                gameInstance.addMessage(`🎉 ${this.getEmoji()} token reached HOME!`);
                return true;
            } else if (newStep < 6) {
                token.homeStep = newStep;
                return true;
            }
            return false;
        }
        
        // Handle main path movement
        let newIndex = token.pathIndex + diceValue;
        
        // Check if entering home stretch
        if (newIndex >= Board.MAIN_PATH_LENGTH) {
            const homeEnterStep = newIndex - Board.MAIN_PATH_LENGTH;
            if (homeEnterStep >= 0 && homeEnterStep <= 5) {
                token.pathIndex = -1;
                token.homeStep = homeEnterStep;
                return true;
            }
            return false;
        }
        
        // Normal path movement
        token.pathIndex = newIndex;
        this.checkCollision(token, gameInstance);
        return true;
    }
    
    // Check and handle collision with opponent tokens
    checkCollision(token, gameInstance) {
        // No collision in safe zones or home stretch
        if (token.homeStep >= 0 || Board.isSafeZone(token.pathIndex)) {
            return;
        }
        
        const currentIndex = token.pathIndex;
        
        // Check all opponents
        for (const player of gameInstance.players) {
            if (player.color === this.color) continue;
            
            for (const oppToken of player.tokens) {
                if (!oppToken.inYard && !oppToken.completed && oppToken.homeStep === -1) {
                    if (oppToken.pathIndex === currentIndex) {
                        // Send opponent token back to yard
                        oppToken.inYard = true;
                        oppToken.pathIndex = -1;
                        oppToken.homeStep = -1;
                        gameInstance.addMessage(`💥 ${this.getEmoji()} captured ${player.getEmoji()} token! + Extra turn!`);
                        gameInstance.extraTurn = true;
                    }
                }
            }
        }
    }
    
    // Get color emoji
    getEmoji() {
        const emojis = { red: '🔴', green: '🟢', yellow: '🟡', blue: '🔵' };
        return emojis[this.color];
    }
    
    // Reset all tokens
    reset() {
        this.completedTokens = 0;
        for (const token of this.tokens) {
            token.reset();
        }
    }
}
