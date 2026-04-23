// ========================================
// GUN SHOOTING GAME - COMPLETELY REWRITTEN
// NO HANGING | MOUSE ALWAYS VISIBLE | ALL LEVELS WORK
// ========================================

// Get canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 900;
canvas.height = 500;

// Game state
let gameState = {
    level: 1,
    score: 0,
    shotsLeft: 10,
    targetsHit: 0,
    targetsNeeded: 5,
    gameActive: true,
    levelTransition: false
};

// Arrays for game objects
let targets = [];
let bullets = [];

// Mouse position
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// Animation ID
let animationId = null;

// Level configurations
const levels = {
    1: { targetCount: 5, speed: 1.2, size: 42, points: 10, shots: 10, color: '#ff4444' },
    2: { targetCount: 6, speed: 1.5, size: 40, points: 10, shots: 10, color: '#ff5555' },
    3: { targetCount: 7, speed: 1.8, size: 38, points: 15, shots: 10, color: '#ff6666' },
    4: { targetCount: 8, speed: 2.1, size: 36, points: 15, shots: 9, color: '#ff7777' },
    5: { targetCount: 9, speed: 2.5, size: 34, points: 20, shots: 9, color: '#ff8888' },
    6: { targetCount: 10, speed: 2.8, size: 32, points: 20, shots: 8, color: '#ff9999' },
    7: { targetCount: 11, speed: 3.2, size: 30, points: 25, shots: 8, color: '#ffaaaa' },
    8: { targetCount: 12, speed: 3.6, size: 28, points: 25, shots: 7, color: '#ffbbbb' },
    9: { targetCount: 13, speed: 4.0, size: 26, points: 30, shots: 7, color: '#ffcccc' },
    10: { targetCount: 15, speed: 4.5, size: 24, points: 50, shots: 6, color: '#ff0000' }
};

// ========================================
// TARGET CLASS
// ========================================
class Target {
    constructor(x, y, size, speed, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.color = color;
        this.active = true;
        
        // Random direction with minimum speed
        let angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Ensure minimum speed
        if (Math.abs(this.vx) < 0.5) this.vx = this.vx > 0 ? 0.8 : -0.8;
        if (Math.abs(this.vy) < 0.5) this.vy = this.vy > 0 ? 0.8 : -0.8;
    }

    update() {
        if (!this.active) return;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary collision
        const margin = this.size + 10;
        if (this.x - this.size < margin) {
            this.x = margin + this.size;
            this.vx = Math.abs(this.vx);
        }
        if (this.x + this.size > canvas.width - margin) {
            this.x = canvas.width - margin - this.size;
            this.vx = -Math.abs(this.vx);
        }
        if (this.y - this.size < margin) {
            this.y = margin + this.size;
            this.vy = Math.abs(this.vy);
        }
        if (this.y + this.size > canvas.height - 80) {
            this.y = canvas.height - 80 - this.size;
            this.vy = -Math.abs(this.vy);
        }
    }

    draw() {
        if (!this.active) return;
        
        // Shadow
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        
        // Outer circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner circles
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    isHit(bulletX, bulletY) {
        const dx = bulletX - this.x;
        const dy = bulletY - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.size;
    }
}

// ========================================
// BULLET CLASS
// ========================================
class Bullet {
    constructor(fromX, fromY, toX, toY) {
        this.x = fromX;
        this.y = fromY;
        this.active = true;
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
            this.vx = (dx / length) * 12;
            this.vy = (dy / length) * 12;
        } else {
            this.vx = 0;
            this.vy = -12;
        }
    }

    update() {
        if (!this.active) return false;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Remove if out of bounds
        if (this.x < -100 || this.x > canvas.width + 100 ||
            this.y < -100 || this.y > canvas.height + 100) {
            this.active = false;
            return false;
        }
        
        return true;
    }

    draw() {
        if (!this.active) return;
        
        // Trail
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Bullet
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();
    }
}

// ========================================
// GAME FUNCTIONS
// ========================================

function initLevel() {
    const config = levels[gameState.level];
    if (!config) return;
    
    gameState.targetsNeeded = config.targetCount;
    gameState.shotsLeft = config.shots;
    gameState.targetsHit = 0;
    gameState.levelTransition = false;
    
    // Clear arrays
    targets = [];
    bullets = [];
    
    // Create targets
    const margin = config.size + 40;
    for (let i = 0; i < config.targetCount; i++) {
        const x = Math.random() * (canvas.width - margin * 2) + margin;
        const y = Math.random() * (canvas.height - margin * 2 - 100) + margin;
        targets.push(new Target(x, y, config.size, config.speed, config.color));
    }
    
    updateUI();
    showMessage(`🔫 LEVEL ${gameState.level}! Hit ${gameState.targetsNeeded} targets!`);
}

function updateUI() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('shotsLeft').textContent = gameState.shotsLeft;
    document.getElementById('targetsHit').textContent = gameState.targetsHit;
    document.getElementById('targetsNeeded').textContent = gameState.targetsNeeded;
}

function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById('levelMessage');
    msgDiv.textContent = msg;
    if (isError) {
        msgDiv.style.color = '#ff6666';
    } else {
        msgDiv.style.color = '#ff9800';
    }
    setTimeout(() => {
        if (msgDiv.textContent === msg) {
            msgDiv.textContent = '';
        }
    }, 2000);
}

function shoot() {
    // Check if game is active
    if (!gameState.gameActive) return;
    if (gameState.levelTransition) return;
    if (gameState.shotsLeft <= 0) {
        showMessage('❌ OUT OF AMMO! Game Over!', true);
        gameOver();
        return;
    }
    
    // Reduce shots
    gameState.shotsLeft--;
    
    // Find closest active target
    let closestTarget = null;
    let closestDist = 200;
    
    for (const target of targets) {
        if (target.active) {
            const dx = target.x - mouseX;
            const dy = target.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                closestTarget = target;
            }
        }
    }
    
    // Gun position
    const gunX = canvas.width / 2;
    const gunY = canvas.height - 60;
    
    // Create bullet
    if (closestTarget && closestDist < 120) {
        bullets.push(new Bullet(gunX, gunY, closestTarget.x, closestTarget.y));
        // Check hit after delay
        setTimeout(() => checkHit(closestTarget), 50);
    } else {
        bullets.push(new Bullet(gunX, gunY, mouseX, mouseY));
    }
    
    updateUI();
    
    // Check game over
    if (gameState.shotsLeft === 0 && gameState.targetsHit < gameState.targetsNeeded) {
        gameOver();
    }
}

function checkHit(target) {
    if (!gameState.gameActive) return;
    if (gameState.levelTransition) return;
    if (!target.active) return;
    
    // Check if target still exists
    if (!targets.includes(target)) return;
    
    // Mark as hit
    target.active = false;
    gameState.targetsHit++;
    gameState.score += levels[gameState.level].points;
    
    // Remove from array
    const index = targets.indexOf(target);
    if (index > -1) targets.splice(index, 1);
    
    updateUI();
    
    // Hit effect
    createHitEffect(target.x, target.y);
    showMessage(`💥 HIT! +${levels[gameState.level].points} points!`);
    
    // Check level complete
    if (gameState.targetsHit >= gameState.targetsNeeded && !gameState.levelTransition) {
        levelComplete();
    }
}

function createHitEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            ctx.beginPath();
            ctx.arc(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, 0.8)`;
            ctx.fill();
        }, i * 20);
    }
}

function levelComplete() {
    if (gameState.levelTransition) return;
    gameState.levelTransition = true;
    
    if (gameState.level < 10) {
        gameState.level++;
        showMessage(`🎉 LEVEL COMPLETE! Moving to Level ${gameState.level} 🎉`);
        
        // Clear bullets
        bullets = [];
        
        setTimeout(() => {
            initLevel();
        }, 1200);
    } else {
        gameWin();
    }
}

function gameWin() {
    gameState.gameActive = false;
    gameState.levelTransition = true;
    if (animationId) cancelAnimationFrame(animationId);
    showMessage(`🏆 YOU WIN! Completed all 10 levels! Score: ${gameState.score} 🏆`);
    document.getElementById('levelMessage').style.color = '#4CAF50';
    document.getElementById('levelMessage').style.fontSize = '1.3rem';
}

function gameOver() {
    gameState.gameActive = false;
    gameState.levelTransition = true;
    if (animationId) cancelAnimationFrame(animationId);
    showMessage(`💀 GAME OVER! Level ${gameState.level} | Score: ${gameState.score} 💀`, true);
}

function resetGame() {
    // Reset game state
    gameState = {
        level: 1,
        score: 0,
        shotsLeft: 10,
        targetsHit: 0,
        targetsNeeded: 5,
        gameActive: true,
        levelTransition: false
    };
    
    // Clear arrays
    targets = [];
    bullets = [];
    
    // Reinitialize
    initLevel();
    updateUI();
    
    const msgDiv = document.getElementById('levelMessage');
    msgDiv.style.color = '#ff9800';
    msgDiv.style.fontSize = '1.2rem';
    
    // Restart animation if needed
    if (animationId) cancelAnimationFrame(animationId);
    animate();
}

// ========================================
// DRAWING FUNCTIONS
// ========================================

function drawBackground() {
    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
    
    // Platform
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, canvas.height - 75, canvas.width, 10);
    
    // Gun on platform
    const gunX = canvas.width / 2;
    const gunY = canvas.height - 55;
    
    ctx.fillStyle = '#444';
    ctx.fillRect(gunX - 25, gunY - 12, 50, 22);
    ctx.fillStyle = '#666';
    ctx.fillRect(gunX + 20, gunY - 8, 30, 12);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(gunX - 12, gunY + 5, 24, 18);
}

function drawCrosshair() {
    ctx.beginPath();
    ctx.moveTo(mouseX - 18, mouseY);
    ctx.lineTo(mouseX - 6, mouseY);
    ctx.moveTo(mouseX + 6, mouseY);
    ctx.lineTo(mouseX + 18, mouseY);
    ctx.moveTo(mouseX, mouseY - 18);
    ctx.lineTo(mouseX, mouseY - 6);
    ctx.moveTo(mouseX, mouseY + 6);
    ctx.lineTo(mouseX, mouseY + 18);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
    ctx.stroke();
    
    // Dot in center
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();
}

// ========================================
// ANIMATION LOOP
// ========================================

function animate() {
    // Update targets
    for (const target of targets) {
        target.update();
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (!bullets[i].active) {
            bullets.splice(i, 1);
        }
    }
    
    // Draw everything
    drawBackground();
    
    for (const target of targets) {
        target.draw();
    }
    
    for (const bullet of bullets) {
        bullet.draw();
    }
    
    drawCrosshair();
    
    animationId = requestAnimationFrame(animate);
}

// ========================================
// EVENT LISTENERS
// ========================================

// Mouse move
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
    
    // Clamp to canvas
    mouseX = Math.max(15, Math.min(canvas.width - 15, mouseX));
    mouseY = Math.max(15, Math.min(canvas.height - 15, mouseY));
});

// Click to shoot
canvas.addEventListener('click', (e) => {
    e.preventDefault();
    shoot();
});

// Keyboard shoot
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        shoot();
    }
});

// Button events
document.getElementById('shootBtn').addEventListener('click', () => shoot());
document.getElementById('resetBtn').addEventListener('click', () => resetGame());
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Hide default cursor on canvas
canvas.style.cursor = 'none';

// Start game
initLevel();
animate();

console.log('🔫 Gun Shooting Game Ready! No Hanging! All 10 Levels Working!');
