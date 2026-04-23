// ========================================
// GUN SHOOTING GAME - REAL GUN WITH ROTATING NOZZLE
// Gun rotates to aim at mouse | Realistic design
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

// Gun angle (in radians)
let gunAngle = 0;

// Animation ID
let animationId = null;
let hitEffects = [];
let muzzleFlash = { active: false, timer: 0 };

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
        
        let angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        if (Math.abs(this.vx) < 0.5) this.vx = this.vx > 0 ? 0.8 : -0.8;
        if (Math.abs(this.vy) < 0.5) this.vy = this.vy > 0 ? 0.8 : -0.8;
    }

    update() {
        if (!this.active) return;
        
        this.x += this.vx;
        this.y += this.vy;
        
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
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Target crosshair
        ctx.beginPath();
        ctx.moveTo(this.x - this.size * 0.7, this.y);
        ctx.lineTo(this.x - this.size * 0.3, this.y);
        ctx.moveTo(this.x + this.size * 0.3, this.y);
        ctx.lineTo(this.x + this.size * 0.7, this.y);
        ctx.moveTo(this.x, this.y - this.size * 0.7);
        ctx.lineTo(this.x, this.y - this.size * 0.3);
        ctx.moveTo(this.x, this.y + this.size * 0.3);
        ctx.lineTo(this.x, this.y + this.size * 0.7);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
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
    constructor(fromX, fromY, toX, toY, bulletId, angle) {
        this.id = bulletId;
        this.x = fromX;
        this.y = fromY;
        this.active = true;
        this.hitTargets = [];
        this.angle = angle;
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
            this.vx = (dx / length) * 16;
            this.vy = (dy / length) * 16;
        } else {
            this.vx = 0;
            this.vy = -16;
        }
    }

    update() {
        if (!this.active) return false;
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < -100 || this.x > canvas.width + 100 ||
            this.y < -100 || this.y > canvas.height + 100) {
            this.active = false;
            return false;
        }
        
        return true;
    }

    draw() {
        if (!this.active) return;
        
        // Bullet trail
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.lineTo(this.x - this.vx * 4, this.y - this.vy * 4);
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Bullet
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcc00';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
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
        
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 25,
                size: Math.random() * 5 + 2,
                color: `hsl(${Math.random() * 60 + 20}, 100%, 50%)`
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
            p.vy += 0.3; // Gravity
        }
    }
    
    draw() {
        for (let p of this.particles) {
            if (p.life > 0) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${p.life / 25})`;
                ctx.fill();
            }
        }
    }
}

// ========================================
// REALISTIC GUN DRAWING FUNCTION
// ========================================
function drawRealisticGun() {
    const gunX = canvas.width / 2;
    const gunY = canvas.height - 55;
    
    // Calculate angle to mouse
    const dx = mouseX - gunX;
    const dy = mouseY - gunY;
    gunAngle = Math.atan2(dy, dx);
    
    ctx.save();
    ctx.translate(gunX, gunY);
    ctx.rotate(gunAngle);
    
    // Gun shadow
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // ===== GUN BODY =====
    // Main body
    ctx.fillStyle = '#2c2c2c';
    ctx.beginPath();
    ctx.rect(-25, -12, 50, 24);
    ctx.fill();
    
    // Metal slide (top)
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.rect(-22, -14, 44, 6);
    ctx.fill();
    
    // Slide serrations
    ctx.fillStyle = '#666';
    for (let i = -15; i <= 15; i += 4) {
        ctx.fillRect(i, -13, 2, 4);
    }
    
    // ===== GUN BARREL =====
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.rect(20, -8, 45, 16);
    ctx.fill();
    
    // Barrel shine
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.rect(20, -7, 45, 4);
    ctx.fill();
    
    // Barrel tip
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.rect(62, -9, 8, 18);
    ctx.fill();
    
    // Barrel hole
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.rect(66, -4, 4, 8);
    ctx.fill();
    
    // ===== MUZZLE FLASH =====
    if (muzzleFlash.active) {
        ctx.fillStyle = `rgba(255, ${150 + Math.random() * 105}, 0, ${muzzleFlash.timer / 5})`;
        ctx.beginPath();
        ctx.rect(68, -12, 20 + Math.random() * 15, 24 + Math.random() * 10);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 255, ${100 + Math.random() * 155}, 0.8)`;
        ctx.beginPath();
        ctx.rect(70, -8, 15 + Math.random() * 10, 16 + Math.random() * 8);
        ctx.fill();
        
        muzzleFlash.timer--;
        if (muzzleFlash.timer <= 0) {
            muzzleFlash.active = false;
        }
    }
    
    // ===== FRONT SIGHT =====
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.rect(55, -15, 4, 6);
    ctx.fill();
    
    // ===== REAR SIGHT =====
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.rect(-5, -16, 12, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(0, -17, 2, 6);
    ctx.fill();
    
    // ===== GRIP/HANDLE =====
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(-20, 12);
    ctx.lineTo(-15, 32);
    ctx.lineTo(10, 32);
    ctx.lineTo(18, 12);
    ctx.fill();
    
    // Grip texture
    ctx.fillStyle = '#7a5a3a';
    for (let i = -12; i <= 12; i += 6) {
        ctx.fillRect(i, 16, 3, 3);
        ctx.fillRect(i, 22, 3, 3);
        ctx.fillRect(i, 28, 3, 3);
    }
    
    // ===== TRIGGER GUARD =====
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // ===== TRIGGER =====
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.rect(6, 6, 3, 8);
    ctx.fill();
    
    // ===== HAMMER =====
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.rect(-15, -8, 5, 8);
    ctx.fill();
    
    // ===== EJECTION PORT =====
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.rect(10, -10, 15, 5);
    ctx.fill();
    
    // ===== RAIL (bottom accessory) =====
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.rect(-10, 11, 20, 3);
    ctx.fill();
    
    // Gun highlight/glare
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.lineTo(55, -10);
    ctx.stroke();
    
    ctx.restore();
    
    // Draw laser sight dot (where gun is aiming)
    const laserEndX = gunX + Math.cos(gunAngle) * 200;
    const laserEndY = gunY + Math.sin(gunAngle) * 200;
    
    ctx.beginPath();
    ctx.moveTo(gunX + Math.cos(gunAngle) * 70, gunY + Math.sin(gunAngle) * 70);
    ctx.lineTo(laserEndX, laserEndY);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Laser dot on target
    ctx.beginPath();
    ctx.arc(laserEndX, laserEndY, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(laserEndX, laserEndY, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 100, 0, 0.9)';
    ctx.fill();
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
    
    targets = [];
    bullets = [];
    hitEffects = [];
    
    nextTargetId = 1;
    nextBulletId = 1;
    
    const margin = config.size + 50;
    const attempts = 100;
    
    for (let i = 0; i < config.targetCount; i++) {
        let placed = false;
        let tryCount = 0;
        
        while (!placed && tryCount < attempts) {
            const x = Math.random() * (canvas.width - margin * 2) + margin;
            const y = Math.random() * (canvas.height - margin * 2 - 100) + margin;
            
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
    msgDiv.style.color = isError ? '#ff6666' : '#ff9800';
    setTimeout(() => {
        if (msgDiv.textContent === msg) msgDiv.textContent = '';
    }, 2000);
}

function shoot() {
    if (!gameState.gameActive) return;
    if (gameState.levelTransition) return;
    if (gameState.shotsLeft <= 0) {
        showMessage('❌ OUT OF AMMO! Game Over!', true);
        gameOver();
        return;
    }
    
    gameState.shotsLeft--;
    gameState.totalShotsFired++;
    
    // Muzzle flash effect
    muzzleFlash.active = true;
    muzzleFlash.timer = 5;
    
    const gunX = canvas.width / 2;
    const gunY = canvas.height - 55;
    
    // Calculate bullet direction (same as gun angle)
    const bulletEndX = gunX + Math.cos(gunAngle) * 500;
    const bulletEndY = gunY + Math.sin(gunAngle) * 500;
    
    const bullet = new Bullet(gunX, gunY, bulletEndX, bulletEndY, nextBulletId++, gunAngle);
    bullets.push(bullet);
    
    updateUI();
    
    // Recoil animation (visual only)
    const gunBody = document.getElementById('gunBody');
    if (gunBody) {
        gunBody.style.transform = 'translateY(3px)';
        setTimeout(() => {
            if (gunBody) gunBody.style.transform = '';
        }, 50);
    }
    
    setTimeout(() => checkBulletHits(bullet.id), 30);
    
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
    
    const bullet = bullets.find(b => b.id === bulletId);
    if (!bullet || !bullet.active) return;
    
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
    
    if (hitCount > 0) {
        let totalPoints = 0;
        
        for (const target of hitTargets) {
            target.active = false;
            gameState.targetsHit++;
            const points = levels[gameState.level].points;
            totalPoints += points;
            gameState.score += points;
            hitEffects.push(new HitEffect(target.x, target.y));
            
            const index = targets.indexOf(target);
            if (index > -1) targets.splice(index, 1);
        }
        
        updateUI();
        
        if (hitCount === 1) {
            showMessage(`💥 HIT! +${totalPoints} points!`);
        } else {
            showMessage(`💥💥 MULTI-HIT! ${hitCount} targets! +${totalPoints} points! 💥💥`);
        }
        
        if (gameState.targetsHit >= gameState.targetsNeeded && !gameState.levelTransition) {
            levelComplete();
        }
    }
    
    if (bullet.active && gameState.gameActive && !gameState.levelTransition) {
        setTimeout(() => checkBulletHits(bulletId), 25);
    }
}

function levelComplete() {
    if (gameState.levelTransition) return;
    gameState.levelTransition = true;
    
    if (gameState.level < 10) {
        gameState.level++;
        showMessage(`🎉 LEVEL COMPLETE! Moving to Level ${gameState.level} 🎉`);
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
    
    targets = [];
    bullets = [];
    hitEffects = [];
    
    nextTargetId = 1;
    nextBulletId = 1;
    
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
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
        if (Math.random() > 0.99) {
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * (canvas.height - 100), 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Ground
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
    
    // Platform details
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, canvas.height - 75, canvas.width, 10);
    
    // Platform shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, canvas.height - 65, canvas.width, 5);
}

function drawCrosshair() {
    // Outer ring
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Cross lines
    ctx.beginPath();
    ctx.moveTo(mouseX - 20, mouseY);
    ctx.lineTo(mouseX - 6, mouseY);
    ctx.moveTo(mouseX + 6, mouseY);
    ctx.lineTo(mouseX + 20, mouseY);
    ctx.moveTo(mouseX, mouseY - 20);
    ctx.lineTo(mouseX, mouseY - 6);
    ctx.moveTo(mouseX, mouseY + 6);
    ctx.lineTo(mouseX, mouseY + 20);
    ctx.stroke();
    
    // Center dot
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();
    
    // Inner ring
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,0,0,0.5)';
    ctx.stroke();
}

// ========================================
// ANIMATION LOOP
// ========================================

function animate() {
    for (const target of targets) target.update();
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (!bullets[i].active) bullets.splice(i, 1);
    }
    
    for (let i = hitEffects.length - 1; i >= 0; i--) {
        hitEffects[i].update();
        if (!hitEffects[i].active) hitEffects.splice(i, 1);
    }
    
    drawBackground();
    
    for (const target of targets) target.draw();
    for (const bullet of bullets) bullet.draw();
    for (const effect of hitEffects) effect.draw();
    
    drawRealisticGun();
    drawCrosshair();
    
    animationId = requestAnimationFrame(animate);
}

// ========================================
// EVENT LISTENERS
// ========================================

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
    
    mouseX = Math.max(15, Math.min(canvas.width - 15, mouseX));
    mouseY = Math.max(15, Math.min(canvas.height - 15, mouseY));
});

canvas.addEventListener('click', (e) => {
    e.preventDefault();
    shoot();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        shoot();
    }
});

const shootBtn = document.getElementById('shootBtn');
const resetBtn = document.getElementById('resetBtn');
const backBtn = document.getElementById('backBtn');

if (shootBtn) shootBtn.addEventListener('click', () => shoot());
if (resetBtn) resetBtn.addEventListener('click', () => resetGame());
if (backBtn) backBtn.addEventListener('click', () => {
    window.location.href = '../index.html';
});

canvas.style.cursor = 'none';

initLevel();
animate();

console.log('🔫 Gun Shooting Game Ready! Realistic rotating gun with laser sight!');
