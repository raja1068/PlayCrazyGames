/**
 * Carrom Board setup and rendering
 */
class CarromBoard {
    constructor(physics, size) {
        this.physics = physics;
        this.size = size;
        this.padding = size * 0.05;
        this.pocketRadius = size * 0.045;
        this.playArea = size - (this.padding * 2);
        this.walls = [];
        this.pockets = [];
        
        // Board dimensions
        this.bounds = {
            left: this.padding,
            right: size - this.padding,
            top: this.padding,
            bottom: size - this.padding
        };
        
        // Baseline positions (where striker can be placed)
        this.baselineOffset = size * 0.18;
        this.baselines = {
            bottom: size - this.padding - this.baselineOffset,
            top: this.padding + this.baselineOffset
        };
        
        // Baseline width constraints
        this.baselineWidth = this.playArea * 0.5;
        this.baselineStart = size / 2 - this.baselineWidth / 2;
        this.baselineEnd = size / 2 + this.baselineWidth / 2;
    }

    create() {
        this.createWalls();
        this.createPockets();
    }

    createWalls() {
        const wallThickness = this.size * 0.03;
        const wallOptions = {
            isStatic: true,
            restitution: 0.7,
            friction: 0.1,
            render: {
                fillStyle: '#5d3a1a',
                strokeStyle: '#3d2510',
                lineWidth: 2
            }
        };

        // Calculate wall segments (with gaps for pockets)
        const pocketGap = this.pocketRadius * 2.2;
        const segmentLength = (this.playArea - pocketGap * 2) / 2;

        // Top wall segments
        this.walls.push(
            Matter.Bodies.rectangle(
                this.padding + pocketGap / 2 + segmentLength / 2,
                this.padding - wallThickness / 2,
                segmentLength,
                wallThickness,
                wallOptions
            ),
            Matter.Bodies.rectangle(
                this.size - this.padding - pocketGap / 2 - segmentLength / 2,
                this.padding - wallThickness / 2,
                segmentLength,
                wallThickness,
                wallOptions
            )
        );

        // Bottom wall segments
        this.walls.push(
            Matter.Bodies.rectangle(
                this.padding + pocketGap / 2 + segmentLength / 2,
                this.size - this.padding + wallThickness / 2,
                segmentLength,
                wallThickness,
                wallOptions
            ),
            Matter.Bodies.rectangle(
                this.size - this.padding - pocketGap / 2 - segmentLength / 2,
                this.size - this.padding + wallThickness / 2,
                segmentLength,
                wallThickness,
                wallOptions
            )
        );

        // Left wall segments
        this.walls.push(
            Matter.Bodies.rectangle(
                this.padding - wallThickness / 2,
                this.padding + pocketGap / 2 + segmentLength / 2,
                wallThickness,
                segmentLength,
                wallOptions
            ),
            Matter.Bodies.rectangle(
                this.padding - wallThickness / 2,
                this.size - this.padding - pocketGap / 2 - segmentLength / 2,
                wallThickness,
                segmentLength,
                wallOptions
            )
        );

        // Right wall segments
        this.walls.push(
            Matter.Bodies.rectangle(
                this.size - this.padding + wallThickness / 2,
                this.padding + pocketGap / 2 + segmentLength / 2,
                wallThickness,
                segmentLength,
                wallOptions
            ),
            Matter.Bodies.rectangle(
                this.size - this.padding + wallThickness / 2,
                this.size - this.padding - pocketGap / 2 - segmentLength / 2,
                wallThickness,
                segmentLength,
                wallOptions
            )
        );

        // Add all walls to physics world
        this.walls.forEach(wall => this.physics.addBody(wall));
    }

    createPockets() {
        // Corner pocket positions
        const positions = [
            { x: this.padding, y: this.padding },           // Top-left
            { x: this.size - this.padding, y: this.padding }, // Top-right
            { x: this.padding, y: this.size - this.padding }, // Bottom-left
            { x: this.size - this.padding, y: this.size - this.padding }  // Bottom-right
        ];

        positions.forEach(pos => {
            this.pockets.push({
                x: pos.x,
                y: pos.y,
                radius: this.pocketRadius
            });
        });
    }

    isInPocket(x, y) {
        for (const pocket of this.pockets) {
            const dist = Utils.distance(x, y, pocket.x, pocket.y);
            if (dist < pocket.radius * 1.1) {
                return true;
            }
        }
        return false;
    }

    getStrikerPosition(sliderValue, player) {
        // Map slider (0-100) to baseline position
        const x = Utils.map(sliderValue, 0, 100, this.baselineStart, this.baselineEnd);
        const y = player === 1 ? this.baselines.bottom : this.baselines.top;
        return { x, y };
    }

    render(ctx) {
        const center = this.size / 2;
        
        // Draw main board (wooden texture simulation)
        ctx.save();
        
        // Board base
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, this.size * 0.7);
        gradient.addColorStop(0, '#d4a574');
        gradient.addColorStop(0.5, '#c49464');
        gradient.addColorStop(1, '#a67c52');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.size, this.size);
        
        // Wood grain effect
        ctx.strokeStyle = 'rgba(139, 90, 43, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.size; i += 8) {
            ctx.beginPath();
            ctx.moveTo(0, i + Math.sin(i * 0.1) * 3);
            ctx.lineTo(this.size, i + Math.sin(i * 0.1 + 2) * 3);
            ctx.stroke();
        }
        
        // Play area
        ctx.fillStyle = '#e8d4b8';
        ctx.fillRect(this.padding, this.padding, this.playArea, this.playArea);
        
        // Inner play area border
        ctx.strokeStyle = '#5d3a1a';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.padding, this.padding, this.playArea, this.playArea);
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(center, center, this.size * 0.08, 0, Math.PI * 2);
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw inner center circle
        ctx.beginPath();
        ctx.arc(center, center, this.size * 0.025, 0, Math.PI * 2);
        ctx.fillStyle = '#c41e3a';
        ctx.fill();
        
        // Draw arrow patterns pointing to pockets
        this.drawArrowPattern(ctx);
        
        // Draw baselines
        this.drawBaselines(ctx);
        
        // Draw pockets
        this.pockets.forEach(pocket => {
            // Pocket shadow
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, pocket.radius * 1.15, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fill();
            
            // Pocket hole
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#1a1a1a';
            ctx.fill();
            
            // Pocket rim
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#3d2510';
            ctx.lineWidth = 3;
            ctx.stroke();
        });
        
        ctx.restore();
    }

    drawArrowPattern(ctx) {
        const center = this.size / 2;
        const arrowDist = this.size * 0.12;
        
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1.5;
        
        // Diagonal lines to corners
        const corners = [
            { x: this.padding, y: this.padding },
            { x: this.size - this.padding, y: this.padding },
            { x: this.padding, y: this.size - this.padding },
            { x: this.size - this.padding, y: this.size - this.padding }
        ];
        
        corners.forEach(corner => {
            const angle = Utils.angle(center, center, corner.x, corner.y);
            const startX = center + Math.cos(angle) * arrowDist;
            const startY = center + Math.sin(angle) * arrowDist;
            const endX = corner.x - Math.cos(angle) * this.pocketRadius * 2;
            const endY = corner.y - Math.sin(angle) * this.pocketRadius * 2;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        });
    }

    drawBaselines(ctx) {
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        
        // Bottom baseline (Player 1)
        ctx.beginPath();
        ctx.moveTo(this.baselineStart, this.baselines.bottom);
        ctx.lineTo(this.baselineEnd, this.baselines.bottom);
        ctx.stroke();
        
        // Bottom baseline circles
        ctx.beginPath();
        ctx.arc(this.baselineStart, this.baselines.bottom, this.size * 0.015, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.baselineEnd, this.baselines.bottom, this.size * 0.015, 0, Math.PI * 2);
        ctx.stroke();
        
        // Top baseline (Player 2)
        ctx.beginPath();
        ctx.moveTo(this.baselineStart, this.baselines.top);
        ctx.lineTo(this.baselineEnd, this.baselines.top);
        ctx.stroke();
        
        // Top baseline circles
        ctx.beginPath();
        ctx.arc(this.baselineStart, this.baselines.top, this.size * 0.015, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.baselineEnd, this.baselines.top, this.size * 0.015, 0, Math.PI * 2);
        ctx.stroke();
    }
}
