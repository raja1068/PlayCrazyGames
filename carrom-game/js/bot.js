/**
 * Bot AI for single player mode
 */
class BotPlayer {
    constructor(boardSize) {
        this.boardSize = boardSize;
        this.difficulty = 0.7; // 0-1, higher = better
        this.thinkingTime = 800;
    }

    async calculateMove(striker, coins, board, targetColor) {
        // Simulate "thinking" time
        await new Promise(resolve => setTimeout(resolve, this.thinkingTime));
        
        const strikerPos = striker.getPosition();
        if (!strikerPos) return null;
        
        // Find best target
        const targets = this.findTargets(strikerPos, coins, board, targetColor);
        
        if (targets.length === 0) {
            // No good targets, make a defensive shot
            return this.makeDefensiveShot(strikerPos, board);
        }
        
        // Select best target with some randomness based on difficulty
        const targetIndex = Math.random() < this.difficulty ? 0 : 
                           Math.floor(Math.random() * Math.min(3, targets.length));
        const target = targets[targetIndex];
        
        // Add some inaccuracy based on difficulty
        const inaccuracy = (1 - this.difficulty) * 0.2;
        const angleOffset = (Math.random() - 0.5) * inaccuracy;
        
        // Calculate shot
        const dx = target.aimPoint.x - strikerPos.x;
        const dy = target.aimPoint.y - strikerPos.y;
        const angle = Math.atan2(dy, dx) + angleOffset;
        
        // Calculate power based on distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        const basePower = Utils.map(distance, 0, board.playArea, 8, 18);
        const power = basePower * (0.9 + Math.random() * 0.2);
        
        return {
            velocityX: Math.cos(angle) * power,
            velocityY: Math.sin(angle) * power
        };
    }

    findTargets(strikerPos, coins, board, targetColor) {
        const targets = [];
        const pockets = board.pockets;
        
        coins.forEach(coin => {
            // Prioritize own color coins and queen
            const isPriority = coin.coinType === targetColor || coin.coinType === 'queen';
            
            pockets.forEach(pocket => {
                // Calculate aim point (point on coin opposite to pocket)
                const coinToPocket = Utils.normalize(
                    pocket.x - coin.position.x,
                    pocket.y - coin.position.y
                );
                
                const aimPoint = {
                    x: coin.position.x - coinToPocket.x * (coin.circleRadius || this.boardSize * 0.025) * 2,
                    y: coin.position.y - coinToPocket.y * (coin.circleRadius || this.boardSize * 0.025) * 2
                };
                
                // Check if shot is viable
                const shotAngle = this.evaluateShot(strikerPos, aimPoint, coin, pocket, coins);
                
                if (shotAngle > 0) {
                    targets.push({
                        coin: coin,
                        pocket: pocket,
                        aimPoint: aimPoint,
                        score: shotAngle * (isPriority ? 2 : 1) * (coin.coinType === 'queen' ? 1.5 : 1)
                    });
                }
            });
        });
        
        // Sort by score (descending)
        targets.sort((a, b) => b.score - a.score);
        return targets;
    }

    evaluateShot(strikerPos, aimPoint, coin, pocket, allCoins) {
        // Check distance - prefer closer shots
        const distToAim = Utils.distance(strikerPos.x, strikerPos.y, aimPoint.x, aimPoint.y);
        const distCoinToPocket = Utils.distance(coin.position.x, coin.position.y, pocket.x, pocket.y);
        
        // Check angle - prefer straighter shots
        const strikerToAim = Utils.angle(strikerPos.x, strikerPos.y, aimPoint.x, aimPoint.y);
        const coinToPocket = Utils.angle(coin.position.x, coin.position.y, pocket.x, pocket.y);
        const angleDiff = Math.abs(strikerToAim - coinToPocket);
        
        // Normalize angle difference
        const normalizedAngle = angleDiff > Math.PI ? Math.PI * 2 - angleDiff : angleDiff;
        
        // Score based on various factors
        let score = 100;
        
        // Penalize long shots
        score -= distToAim * 0.1;
        score -= distCoinToPocket * 0.05;
        
        // Penalize angled shots
        score -= normalizedAngle * 20;
        
        // Check for obstructions (simplified)
        const obstructions = this.countObstructions(strikerPos, aimPoint, allCoins, coin);
        score -= obstructions * 30;
        
        return Math.max(0, score);
    }

    countObstructions(start, end, coins, excludeCoin) {
        let count = 0;
        const margin = this.boardSize * 0.03;
        
        coins.forEach(coin => {
            if (coin === excludeCoin) return;
            
            // Check if coin is near the line from start to end
            const dist = this.pointToLineDistance(
                coin.position.x, coin.position.y,
                start.x, start.y,
                end.x, end.y
            );
            
            if (dist < margin) count++;
        });
        
        return count;
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        return Utils.distance(px, py, xx, yy);
    }

    makeDefensiveShot(strikerPos, board) {
        // Just hit towards center with medium power
        const center = this.boardSize / 2;
        const dx = center - strikerPos.x;
        const dy = center - strikerPos.y;
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
        const power = 10 + Math.random() * 5;
        
        return {
            velocityX: Math.cos(angle) * power,
            velocityY: Math.sin(angle) * power
        };
    }

    selectStrikerPosition(board, coins, targetColor) {
        // Analyze board and choose optimal striker position
        let bestPosition = 50;
        let bestScore = -Infinity;
        
        for (let pos = 10; pos <= 90; pos += 10) {
            const strikerPos = board.getStrikerPosition(pos, 2);
            let score = 0;
            
            // Evaluate potential shots from this position
            coins.forEach(coin => {
                if (coin.coinType === targetColor || coin.coinType === 'queen') {
                    const dist = Utils.distance(
                        strikerPos.x, strikerPos.y,
                        coin.position.x, coin.position.y
                    );
                    // Prefer positions with clear shots to own coins
                    score += 100 / (dist + 1);
                }
            });
            
            if (score > bestScore) {
                bestScore = score;
                bestPosition = pos;
            }
        }
        
        // Add some randomness
        bestPosition += (Math.random() - 0.5) * 15;
        return Utils.clamp(bestPosition, 5, 95);
    }
}
