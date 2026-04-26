/**
 * Input controls for aiming and shooting
 */
class Controls {
    constructor(canvas, striker, board) {
        this.canvas = canvas;
        this.striker = striker;
        this.board = board;
        
        this.isDragging = false;
        this.dragStart = null;
        this.dragCurrent = null;
        this.maxDragDistance = 150;
        this.powerMultiplier = 0.15;
        
        this.enabled = true;
        this.onShoot = null;
        
        this.boundHandleStart = this.handleStart.bind(this);
        this.boundHandleMove = this.handleMove.bind(this);
        this.boundHandleEnd = this.handleEnd.bind(this);
    }

    enable() {
        this.enabled = true;
        this.canvas.addEventListener('mousedown', this.boundHandleStart);
        this.canvas.addEventListener('mousemove', this.boundHandleMove);
        this.canvas.addEventListener('mouseup', this.boundHandleEnd);
        this.canvas.addEventListener('mouseleave', this.boundHandleEnd);
        
        this.canvas.addEventListener('touchstart', this.boundHandleStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.boundHandleMove, { passive: false });
        this.canvas.addEventListener('touchend', this.boundHandleEnd);
        this.canvas.addEventListener('touchcancel', this.boundHandleEnd);
    }

    disable() {
        this.enabled = false;
        this.isDragging = false;
        this.dragStart = null;
        this.dragCurrent = null;
        
        this.canvas.removeEventListener('mousedown', this.boundHandleStart);
        this.canvas.removeEventListener('mousemove', this.boundHandleMove);
        this.canvas.removeEventListener('mouseup', this.boundHandleEnd);
        this.canvas.removeEventListener('mouseleave', this.boundHandleEnd);
        
        this.canvas.removeEventListener('touchstart', this.boundHandleStart);
        this.canvas.removeEventListener('touchmove', this.boundHandleMove);
        this.canvas.removeEventListener('touchend', this.boundHandleEnd);
        this.canvas.removeEventListener('touchcancel', this.boundHandleEnd);
    }

    getEventPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: (clientX - rect.left) * scaleX / (window.devicePixelRatio || 1),
            y: (clientY - rect.top) * scaleY / (window.devicePixelRatio || 1)
        };
    }

    handleStart(e) {
        if (!this.enabled || !this.striker.isActive || this.striker.hasBeenShot) return;
        e.preventDefault();
        
        const pos = this.getEventPosition(e);
        const strikerPos = this.striker.getPosition();
        
        if (!strikerPos) return;
        
        // Check if click is near striker
        const dist = Utils.distance(pos.x, pos.y, strikerPos.x, strikerPos.y);
        if (dist < this.striker.radius * 3) {
            this.isDragging = true;
            this.dragStart = { ...strikerPos };
            this.dragCurrent = pos;
        }
    }

    handleMove(e) {
        if (!this.isDragging || !this.enabled) return;
        e.preventDefault();
        
        this.dragCurrent = this.getEventPosition(e);
    }

    handleEnd(e) {
        if (!this.isDragging || !this.enabled) return;
        e.preventDefault();
        
        const strikerPos = this.striker.getPosition();
        if (!strikerPos || !this.dragCurrent) {
            this.resetDrag();
            return;
        }
        
        // Calculate drag distance and direction
        const dx = this.dragStart.x - this.dragCurrent.x;
        const dy = this.dragStart.y - this.dragCurrent.y;
        const dragDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (dragDistance > 10) {
            // Calculate velocity (opposite direction of drag, capped)
            const clampedDistance = Math.min(dragDistance, this.maxDragDistance);
            const power = clampedDistance * this.powerMultiplier;
            const normalized = Utils.normalize(dx, dy);
            
            const velocityX = normalized.x * power;
            const velocityY = normalized.y * power;
            
            this.striker.shoot(velocityX, velocityY);
            
            if (this.onShoot) {
                this.onShoot();
            }
        }
        
        this.resetDrag();
    }

    resetDrag() {
        this.isDragging = false;
        this.dragStart = null;
        this.dragCurrent = null;
    }

    renderAimLine(ctx) {
        if (!this.isDragging || !this.dragStart || !this.dragCurrent) return;
        
        const strikerPos = this.striker.getPosition();
        if (!strikerPos) return;
        
        const dx = this.dragStart.x - this.dragCurrent.x;
        const dy = this.dragStart.y - this.dragCurrent.y;
        const dragDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (dragDistance < 10) return;
        
        const clampedDistance = Math.min(dragDistance, this.maxDragDistance);
        const power = clampedDistance / this.maxDragDistance;
        const normalized = Utils.normalize(dx, dy);
        
        // Draw trajectory line
        const trajectoryLength = this.board.playArea * 0.4 * power;
        const endX = strikerPos.x + normalized.x * trajectoryLength;
        const endY = strikerPos.y + normalized.y * trajectoryLength;
        
        ctx.save();
        
        // Trajectory line with gradient
        const gradient = ctx.createLinearGradient(
            strikerPos.x, strikerPos.y, endX, endY
        );
        gradient.addColorStop(0, 'rgba(244, 208, 63, 0.9)');
        gradient.addColorStop(1, 'rgba(244, 208, 63, 0.1)');
        
        ctx.beginPath();
        ctx.moveTo(strikerPos.x, strikerPos.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Arrow head
        const arrowSize = 12;
        const angle = Math.atan2(dy, dx) + Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.strokeStyle = 'rgba(244, 208, 63, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Power indicator
        const indicatorRadius = this.striker.radius + 5 + (power * 15);
        ctx.beginPath();
        ctx.arc(strikerPos.x, strikerPos.y, indicatorRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244, 208, 63, ${0.3 + power * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Power text
        ctx.fillStyle = '#f4d03f';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${Math.round(power * 100)}%`,
            strikerPos.x,
            strikerPos.y - this.striker.radius - 20
        );
        
        ctx.restore();
    }
}
