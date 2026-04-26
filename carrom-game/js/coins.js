/**
 * Carrom Coins (Pucks) management
 */
class CoinManager {
    constructor(physics, boardSize) {
        this.physics = physics;
        this.boardSize = boardSize;
        this.coins = [];
        this.pocketed = [];
        
        // Coin properties
        this.coinRadius = boardSize * 0.025;
        this.queenRadius = boardSize * 0.022;
        
        // Scoring
        this.scores = {
            black: 10,
            white: 20,
            queen: 50
        };
    }

    createCoins() {
        this.coins = [];
        this.pocketed = [];
        
        const center = this.boardSize / 2;
        const ringRadius = this.boardSize * 0.055;
        
        // Create queen (red) at center
        this.createCoin(center, center, 'queen');
        
        // Create inner ring (6 coins alternating)
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = center + Math.cos(angle) * ringRadius;
            const y = center + Math.sin(angle) * ringRadius;
            const type = i % 2 === 0 ? 'white' : 'black';
            this.createCoin(x, y, type);
        }
        
        // Create outer ring (12 coins alternating)
        const outerRadius = ringRadius * 2;
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12 + Math.PI / 12;
            const x = center + Math.cos(angle) * outerRadius;
            const y = center + Math.sin(angle) * outerRadius;
            const type = i % 2 === 0 ? 'black' : 'white';
            this.createCoin(x, y, type);
        }
    }

    createCoin(x, y, type) {
        const radius = type === 'queen' ? this.queenRadius : this.coinRadius;
        
        let fillColor, strokeColor;
        switch (type) {
            case 'black':
                fillColor = '#1a1a1a';
                strokeColor = '#333';
                break;
            case 'white':
                fillColor = '#f5f5dc';
                strokeColor = '#d4d4aa';
                break;
            case 'queen':
                fillColor = '#c41e3a';
                strokeColor = '#8b0000';
                break;
        }
        
        const coin = Matter.Bodies.circle(x, y, radius, {
            restitution: 0.6,
            friction: 0.05,
            frictionAir: 0.02,
            density: 0.002,
            label: type,
            render: {
                fillStyle: fillColor,
                strokeStyle: strokeColor,
                lineWidth: 2
            }
        });
        
        coin.coinType = type;
        this.coins.push(coin);
        this.physics.addBody(coin);
    }

    checkPocketed(board) {
        const pocketedThisTurn = [];
        
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (board.isInPocket(coin.position.x, coin.position.y)) {
                pocketedThisTurn.push({
                    type: coin.coinType,
                    score: this.scores[coin.coinType]
                });
                this.pocketed.push(coin);
                this.physics.removeBody(coin);
                this.coins.splice(i, 1);
            }
        }
        
        return pocketedThisTurn;
    }

    getActiveCoinBodies() {
        return this.coins.map(c => c);
    }

    hasCoinsRemaining(type) {
        return this.coins.some(c => c.coinType === type);
    }

    getQueenStatus() {
        return {
            inPlay: this.coins.some(c => c.coinType === 'queen'),
            pocketed: this.pocketed.some(c => c.coinType === 'queen')
        };
    }

    returnQueen() {
        // Find and return the queen to center
        const queenIndex = this.pocketed.findIndex(c => c.coinType === 'queen');
        if (queenIndex !== -1) {
            const queen = this.pocketed.splice(queenIndex, 1)[0];
            const center = this.boardSize / 2;
            Matter.Body.setPosition(queen, { x: center, y: center });
            Matter.Body.setVelocity(queen, { x: 0, y: 0 });
            this.coins.push(queen);
            this.physics.addBody(queen);
        }
    }

    reset() {
        // Remove all existing coins
        this.coins.forEach(coin => this.physics.removeBody(coin));
        this.coins = [];
        this.pocketed = [];
    }

    render(ctx) {
        // Custom rendering for coins with 3D effect
        this.coins.forEach(coin => {
            const { x, y } = coin.position;
            const radius = coin.coinType === 'queen' ? this.queenRadius : this.coinRadius;
            
            ctx.save();
            
            // Shadow
            ctx.beginPath();
            ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
            
            // Base color
            let baseColor, darkColor, lightColor;
            switch (coin.coinType) {
                case 'black':
                    baseColor = '#2a2a2a';
                    darkColor = '#1a1a1a';
                    lightColor = '#4a4a4a';
                    break;
                case 'white':
                    baseColor = '#f5f5dc';
                    darkColor = '#d4d4aa';
                    lightColor = '#fffff5';
                    break;
                case 'queen':
                    baseColor = '#c41e3a';
                    darkColor = '#8b0000';
                    lightColor = '#ff4444';
                    break;
            }
            
            // Gradient for 3D effect
            const gradient = ctx.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, 0,
                x, y, radius
            );
            gradient.addColorStop(0, lightColor);
            gradient.addColorStop(0.7, baseColor);
            gradient.addColorStop(1, darkColor);
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Rim
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Inner circle detail
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = coin.coinType === 'white' ? '#c4c494' : 
                              coin.coinType === 'queen' ? '#ff6666' : '#3a3a3a';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        });
    }
}
