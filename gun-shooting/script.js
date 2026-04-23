// ========================================
// GUN SHOOTING GAME - FINAL FIXED VERSION
// MORE SHOTS THAN TARGETS | MULTI-TARGET HITS
// NO HANGING AT ANY LEVEL
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
    shotsLeft: 0,
    targetsHit: 0,
    targetsNeeded: 0,
    gameActive: true,
    levelTransition: false,
    totalShotsFired: 0
};

// Arrays for game objects
let targets = [];
let bullets = [];

// Mouse position
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// Animation ID
let animationId = null;
let hitEffects = [];

// Level configurations - MORE SHOTS THAN TARGETS
const levels = {
    1: { targetCount: 5, speed: 1.2, size: 42, points: 10, shots: 12, color: '#ff4444' },
    2: { targetCount: 6, speed: 1.5, size: 40, points: 10, shots: 14, color: '#ff5555' },
    3: { targetCount: 7, speed: 1.8, size: 38, points: 15, shots: 16, color: '#ff6666' },
    4: { targetCount: 8, speed: 2.1, size: 36, points: 15, shots: 18, color: '#ff7777' },
    5: { targetCount: 9, speed: 2.5, size: 34, points: 20, shots: 20, color: '#ff8888' },
    6: { targetCount: 10, speed: 2.8, size: 32, points: 20, shots: 22, color: '#ff9999' },
    7: { targetCount: 11, speed: 3.2, size: 30, points: 25, shots: 24, color: '#ffaaaa' },
    8: { targetCount: 12, speed: 3.6, size: 28, points: 25, shots: 26, color: '#ffbbbb' },
    9: { targetCount: 13, speed: 4.0, size: 26, points: 30, shots: 28, color: '#ffcccc' },
    10: { targetCount: 15, speed: 4.5, size: 24, points: 50, shots: 32, color: '#ff0000' }
};

// ========================================
// TARGET CLASS
// ========================================
class Target {
    constructor(x, y, size, speed, color, id) {
        this.id = id;
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
    constructor(fromX, fromY, toX, toY, bulletId) {
        this.id = bulletId;
        this.x = fromX;
        this.y = fromY;
        this.active = true;
        this.hitTargets = []; // Track already hit targets
        this.startX = fromX;
        this.startY = fromY;
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
            this.vx = (dx / length) * 14;
            this.vy = (dy / length) * 14;
        } else {
            this.vx = 0;
            this.vy = -14;
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
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();
        
        // Inner core
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
    
    hasHitTarget(targetId) {
        return this.hitTargets.includes(targetId);
    }
    
    addHitTarget(targetId) {
        this.hitTargets.push(targetId);
    }
}

// ========================================
// HIT EFFECT CLASS
// ========================================
class HitEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.active = true;
        this.life = 20;
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 20,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    update() {
        this.life--;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        
        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }
    }
    
    draw() {
        for (let p of this.particles) {
            if (p.life > 0) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${p.life / 20})`;
                ctx.fill();
            }
        }
    }
}

// ========================================
// GAME FUNCTIONS
// ========================================

let nextTargetId = 1;
let nextBulletId = 1;

function initLevel() {
    const config = levels[gameState.level];
    if (!config) return;
    
    gameState.targetsNeeded = config.targetCount;
    gameState.shotsLeft = config.shots;
    gameState.targetsHit = 0;
    gameState.levelTransition = false;
    gameState.gameActive = true;
    
    // Clear arrays
    targets = [];
    bullets = [];
    hitEffects = [];
    
    // Reset IDs
    nextTargetId = 1;
    nextBulletId = 1;
    
    // Create targets - spread them out to avoid too much overlap
    const margin = config.size + 50;
    const attempts = 100;
    
    for (let i = 0; i < config.targetCount; i++) {
        let placed = false;
        let tryCount = 0;
        
        while (!placed && tryCount < attempts) {
            const x = Math.random() * (canvas.width - margin * 2) + margin;
            const y = Math.random() * (canvas.height - margin * 2 - 100) + margin;
            
            // Check overlap with existing targets (minimum distance between centers)
            let overlap = false;
            for (const existing of targets) {
                const dx = existing.x - x;
                const dy = existing.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < config.size * 1.5) {
                    overlap = true;
                    break;
                }
            }
            
            if (!overlap) {
                targets.push(new Target(x, y, config.size, config.speed, config.color, nextTargetId++));
                placed = true;
            }
            tryCount++;
        }
        
        // If can't place without overlap, place anyway
        if (!placed) {
            const x = Math.random() * (canvas.width - margin * 2) + margin;
            const y = Math.random() * (canvas.height - margin * 2 - 100) + margin;
            targets.push(new Target(x, y, config.size, config.speed, config.color, nextTargetId++));
        }
    }
    
    updateUI();
    showMessage(`🔫 LEVEL ${gameState.level}! ${gameState.targetsNeeded} targets | ${gameState.shotsLeft} bullets!`);
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
    gameState.totalShotsFired++;
    
    // Gun position
    const gunX = canvas.width / 2;
    const gunY = canvas.height - 60;
    
    // Create bullet aimed at mouse position
    const bullet = new Bullet(gunX, gunY, mouseX, mouseY, nextBulletId++);
    bullets.push(bullet);
    
    updateUI();
    
    // Check for hits after bullet travels
    setTimeout(() => checkBulletHits(bullet.id), 30);
    
    // Check game over
    if (gameState.shotsLeft === 0 && gameState.targetsHit < gameState.targetsNeeded) {
        setTimeout(() => {
            if (gameState.targetsHit < gameState.targetsNeeded && !gameState.levelTransition) {
                gameOver();
            }
        }, 500);
    }
}

function checkBulletHits(bulletId) {
    if (!gameState.gameActive) return;
    if (gameState.levelTransition) return;
    
    // Find the bullet
    const bullet = bullets.find(b => b.id === bulletId);
    if (!bullet || !bullet.active) return;
    
    // Find all targets hit by this bullet
    let hitCount = 0;
    const hitTargets = [];
    
    for (const target of targets) {
        if (target.active && !bullet.hasHitTarget(target.id)) {
            if (target.isHit(bullet.x, bullet.y)) {
                hitTargets.push(target);
                bullet.addHitTarget(target.id);
                hitCount++;
            }
        }
    }
    
    // Process hits
    if (hitCount > 0) {
        let totalPoints = 0;
        
        for (const target of hitTargets) {
            target.active = false;
            gameState.targetsHit++;
            const points = levels[gameState.level].points;
            totalPoints += points;
            gameState.score += points;
            
            // Add hit effect
            hitEffects.push(new HitEffect(target.x, target.y));
            
            // Remove from array
            const index = targets.indexOf(target);
            if (index > -1) targets.splice(index, 1);
        }
        
        updateUI();
        
        if (hitCount === 1) {
            showMessage(`💥 HIT! +${totalPoints} points!`);
        } else {
            showMessage(`💥💥 MULTI-HIT! ${hitCount} targets destroyed! +${totalPoints} points! 💥💥`);
        }
        
        // Check level complete
        if (gameState.targetsHit >= gameState.targetsNeeded && !gameState.levelTransition) {
            levelComplete();
        }
    }
    
    // Continue checking while bullet is active
    if (bullet.active && gameState.gameActive && !gameState.levelTransition) {
        setTimeout(() => checkBulletHits(bulletId), 30);
    }
}

function levelComplete() {
    if (gameState.levelTransition) return;
    gameState.levelTransition = true;
    
    if (gameState.level < 10) {
        gameState.level++;
        showMessage(`🎉 LEVEL COMPLETE! Moving to Level ${gameState.level} 🎉`);
        
        // Clear bullets and effects
        bullets = [];
        hitEffects = [];
        
        setTimeout(() => {
            initLevel();
        }, 1500);
    } else {
        gameWin();
    }
}

function gameWin() {
    gameState.gameActive = false;
    gameState.levelTransition = true;
    showMessage(`🏆 YOU WIN! Completed all 10 levels! Score: ${gameState.score} 🏆`);
    document.getElementById('levelMessage').style.color = '#4CAF50';
    document.getElementById('levelMessage').style.fontSize = '1.3rem';
}

function gameOver() {
    if (!gameState.gameActive) return;
    gameState.gameActive = false;
    gameState.levelTransition = true;
    showMessage(`💀 GAME OVER! Level ${gameState.level} | Score: ${gameState.score} 💀`, true);
}

function resetGame() {
    // Reset game state
    gameState = {
        level: 1,
        score: 0,
        shotsLeft: 0,
        targetsHit: 0,
        targetsNeeded: 0,
        gameActive: true,
        levelTransition: false,
        totalShotsFired: 0
    };
    
    // Clear arrays
    targets = [];
    bullets = [];
    hitEffects = [];
    
    // Reset IDs
    nextTargetId = 1;
    nextBulletId = 1;
    
    // Reinitialize
    initLevel();
    updateUI();
    
    const msgDiv = document.getElementById('levelMessage');
    msgDiv.style.color = '#ff9800';
    msgDiv.style.fontSize = '1.2rem';
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
    
    // Update hit effects
    for (let i = hitEffects.length - 1; i >= 0; i--) {
        hitEffects[i].update();
        if (!hitEffects[i].active) {
            hitEffects.splice(i, 1);
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
    
    for (const effect of hitEffects) {
        effect.draw();
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
const shootBtn = document.getElementById('shootBtn');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');

if (shootBtn) shootBtn.addEventListener('click', () => shoot());
if (resetBtn) resetBtn.addEventListener('click', () => resetGame());
if (backBtn) backBtn.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Hide default cursor on canvas
canvas.style.cursor = 'none';

// Start game
initLevel();
animate();

console.log('🔫 Gun Shooting Game Ready! More shots than targets | Multi-hit enabled!');
