/**
 * Striker management
 */
class Striker {
    constructor(physics, boardSize) {
        this.physics = physics;
        this.boardSize = boardSize;
        this.radius = boardSize * 0.035;
        this.body = null;
        this.isActive = false;
        this.hasBeenShot = false;
    }

    create(x, y) {
        if (this.body) {
            this.physics.removeBody(this.body);
        }
        
        this.body = Matter.Bodies.circle(x, y, this.radius, {
            restitution: 0.8,
            friction: 0.03,
            frictionAir: 0.015,
            density: 0.003,
            label: 'striker',
            render: {
                fillStyle: '#f4d03f',
                strokeStyle: '#d4a830',
                lineWidth: 2
            }
        });
        
        this.physics.addBody(this.body);
        this.isActive = true;
        this.hasBeenShot = false;
    }

    setPosition(x, y) {
        if (this.body && !this.hasBeenShot) {
            Matter.Body.setPosition(this.body, { x, y });
        }
    }

    shoot(velocityX, velocityY) {
        if (this.body && this.isActive) {
            Matter.Body.setVelocity(this.body, { x: velocityX, y: velocityY });
            this.hasBeenShot = true;
        }
    }

    isStopped() {
        if (!this.body) return true;
        const speed = Math.sqrt(
            this.body.velocity.x ** 2 + this.body.velocity.y ** 2
        );
        return speed < 0.1;
    }

    isInPocket(board) {
        if (!this.body) return false;
        return board.isInPocket(this.body.position.x, this.body.position.y);
    }

    remove() {
        if (this.body) {
            this.physics.removeBody(this.body);
            this.body = null;
        }
        this.isActive = false;
        this.hasBeenShot = false;
    }

    getPosition() {
        return this.body ? this.body.position : null;
    }

    render(ctx) {
        if (!this.body || !this.isActive) return;
        
        const { x, y } = this.body.position;
        
        ctx.save();
        
        // Shadow
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // Gradient for 3D effect
        const gradient = ctx.createRadialGradient(
            x - this.radius * 0.3, y - this.radius * 0.3, 0,
            x, y, this.radius
        );
        gradient.addColorStop(0, '#fff5cc');
        gradient.addColorStop(0.5, '#f4d03f');
        gradient.addColorStop(1, '#c4a030');
        
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Rim
        ctx.strokeStyle = '#a48020';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner rings
        ctx.beginPath();
        ctx.arc(x, y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = '#d4b030';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}
