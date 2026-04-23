// ========================================
// GUN SHOOTING GAME - COMPLETE VERSION
// 10 WORKING LEVELS | GUN ON PLATFORM | BULLETS
// ========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 500;

// Game Variables
let level = 1;
let score = 0;
let shotsLeft = 10;
let targetsHit = 0;
let targetsNeeded = 5;
let gameActive = true;
let animationId;
let targets = [];
let bullets = [];
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

// Level Configurations
const levelConfig = {
    1: { targetCount: 5, speed: 1, size: 45, points: 10, shots: 10, color: '#ff4444' },
    2: { targetCount: 6, speed: 1.5, size: 42, points: 10, shots: 10, color: '#ff6666' },
    3: { targetCount: 7, speed: 2, size: 40, points: 15, shots: 10, color: '#ff8888' },
    4: { targetCount: 8, speed: 2.5, size: 38, points: 15, shots: 9, color: '#ffaaaa' },
    5: { targetCount: 9, speed: 3, size: 35, points: 20, shots: 9, color: '#ffcccc' },
    6: { targetCount: 10, speed: 3.5, size: 32, points: 20, shots: 8, color: '#ff6666' },
    7: { targetCount: 11, speed: 4, size: 30, points: 25, shots: 8, color: '#ff4444' },
    8: { targetCount: 12, speed: 4.5, size: 28, points: 25, shots: 7, color: '#ff8888' },
    9: { targetCount: 13, speed: 5, size: 26, points: 30, shots: 7, color: '#ffaaaa' },
    10: { targetCount: 15, speed: 6, size: 24, points: 50, shots: 6, color: '#ff0000' }
};

// Target Class
class Target {
    constructor(x, y, size, speed, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.color = color;
        this.dx = (Math.random() - 0.5) * speed * 2;
        this.dy = (Math.random() - 0.5) * speed * 2;
        this.hit = false;
    }

    draw() {
        if (this.hit) return;
        
        // 3D Shadow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        
        // Outer circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner circle (bullseye)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        
        // Center dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Rings for 3D effect
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.75, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    update() {
        if (this.hit) return;
        
        this.x += this.dx;
        this.y += this.dy;
        
        // Bounce off walls
        if (this.x - this.size < 20 || this.x + this.size > canvas.width - 20) {
            this.dx = -this.dx;
            this.x = Math.max(this.size + 20, Math.min(canvas.width - this.size - 20, this.x));
        }
        if (this.y - this.size < 20 || this.y + this.size > canvas.height - 60) {
            this.dy = -this.dy;
            this.y = Math.max(this.size + 20, Math.min(canvas.height - this.size - 60, this.y));
        }
    }

    isHit(bulletX, bulletY) {
        const dx = bulletX - this.x;
        const dy = bulletY - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.size;
    }
}

// Bullet Class
class Bullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.progress = 0;
        this.active = true;
        
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.speed = 15;
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
    }

    update() {
        if (!this.active) return;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Check if bullet reached target area
        const dx = this.x - this.targetX;
        const dy = this.y - this.targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 20 || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.active = false;
            return true; // Hit
        }
        return false;
    }

    draw() {
        if (!this.active) return;
        
        // Draw bullet trail
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw bullet
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6600';
        ctx.fill();
    }
}

// Initialize Level
function initLevel() {
    const config = levelConfig[level];
    targetsNeeded = config.targetCount;
    shotsLeft = config.shots;
    targets = [];
    bullets = [];
    targetsHit = 0;
    
    for (let i = 0; i < config.targetCount; i++) {
        const size = config.size;
        const x = Math.random() * (canvas.width - size * 2 - 40) + size + 20;
        const y = Math.random() * (canvas.height - size * 2 - 100) + size + 30;
        targets.push(new Target(x, y, size, config.speed, config.color));
    }
    
    updateUI();
    showLevelMessage(`🔫 LEVEL ${level} START! Hit ${targetsNeeded} targets!`);
}

// Update UI
function updateUI() {
    document.getElementById('level').textContent = level;
    document.getElementById('score').textContent = score;
    document.getElementById('shotsLeft').textContent = shotsLeft;
    document.getElementById('targetsHit').textContent = targetsHit;
    document.getElementById('targetsNeeded').textContent = targetsNeeded;
}

// Show Message
function showLevelMessage(msg) {
    const msgDiv = document.getElementById('levelMessage');
    msgDiv.textContent = msg;
    setTimeout(() => {
        if (msgDiv.textContent === msg) {
            msgDiv.textContent = '';
        }
    }, 2000);
}

// Shoot Function
function shoot() {
    if (!gameActive) return false;
    if (shotsLeft <= 0) {
        showLevelMessage('❌ OUT OF AMMO! Game Over!');
        gameOver();
        return false;
    }
    
    // Animate gun
    const gunBody = document.getElementById('gunBody');
    gunBody.classList.add('recoil');
    setTimeout(() => gunBody.classList.remove('recoil'), 100);
    
    // Muzzle flash
    const muzzleFlash = document.getElementById('muzzleFlash');
    muzzleFlash.classList.add('active');
    setTimeout(() => muzzleFlash.classList.remove('active'), 100);
    
    shotsLeft--;
    
    // Find closest target to aim at
    let closestTarget = null;
    let closestDistance = Infinity;
    
    for (const target of targets) {
        if (!target.hit) {
            const dx = target.x - mouseX;
            const dy = target.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = target;
            }
        }
    }
    
    if (closestTarget && closestDistance < 100) {
        // Create bullet aimed at target
        const gunX = canvas.width / 2;
        const gunY = canvas.height - 60;
        bullets.push(new Bullet(gunX, gunY, closestTarget.x, closestTarget.y));
        
        // Check hit after bullet travel
        setTimeout(() => checkHit(closestTarget), 50);
    } else {
        // Miss - shoot random direction
        const gunX = canvas.width / 2;
        const gunY = canvas.height - 60;
        bullets.push(new Bullet(gunX, gunY, mouseX, mouseY));
    }
    
    updateUI();
    
    if (shotsLeft === 0 && targetsHit < targetsNeeded) {
        gameOver();
    }
    
    return true;
}

// Check Hit
function checkHit(target) {
    if (!target.hit && targets.includes(target)) {
        target.hit = true;
        targetsHit++;
        score += levelConfig[level].points;
        
        // Remove from array
        const index = targets.indexOf(target);
        if (index > -1) targets.splice(index, 1);
        
        updateUI();
        
        // Hit effect on canvas
        createHitEffect(target.x, target.y);
        
        showLevelMessage(`💥 HIT! +${levelConfig[level].points} points!`);
        
        // Check level complete
        if (targetsHit >= targetsNeeded) {
            levelComplete();
        }
    }
}

// Create Hit Effect
function createHitEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            ctx.beginPath();
            ctx.arc(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, 0.8)`;
            ctx.fill();
        }, i * 10);
    }
}

// Level Complete
function levelComplete() {
    if (level < 10) {
        level++;
        showLevelMessage(`🎉 LEVEL COMPLETE! Moving to Level ${level} 🎉`);
        
        // Celebration effect
        const container = document.querySelector('.game-container');
        container.classList.add('level-complete');
        setTimeout(() => container.classList.remove('level-complete'), 500);
        
        initLevel();
    } else {
        gameWin();
    }
}

// Game Win
function gameWin() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    showLevelMessage(`🏆 CONGRATULATIONS! YOU COMPLETED ALL 10 LEVELS! Score: ${score} 🏆`);
    document.getElementById('levelMessage').style.color = '#4CAF50';
    document.getElementById('levelMessage').style.fontSize = '1.3rem';
}

// Game Over
function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    showLevelMessage(`💀 GAME OVER! You reached Level ${level} with ${score} points! 💀`);
}

// Reset Game
function resetGame() {
    level = 1;
    score = 0;
    gameActive = true;
    targets = [];
    bullets = [];
    
    initLevel();
    updateUI();
    document.getElementById('levelMessage').style.color = '#ff9800';
    document.getElementById('levelMessage').style.fontSize = '1.2rem';
    
    if (animationId) cancelAnimationFrame(animationId);
    animate();
}

// Draw Background
function drawBackground() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#1a1a2e');
    skyGradient.addColorStop(0.5, '#16213e');
    skyGradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground/platform
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, canvas.height - 85, canvas.width, 10);
    
    // Draw grass on ground
    ctx.fillStyle = '#27ae60';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, canvas.height - 85, 5, 15);
    }
}

// Draw Crosshair
function drawCrosshair() {
    ctx.beginPath();
    ctx.moveTo(mouseX - 15, mouseY);
    ctx.lineTo(mouseX - 5, mouseY);
    ctx.moveTo(mouseX + 5, mouseY);
    ctx.lineTo(mouseX + 15, mouseY);
    ctx.moveTo(mouseX, mouseY - 15);
    ctx.lineTo(mouseX, mouseY - 5);
    ctx.moveTo(mouseX, mouseY + 5);
    ctx.lineTo(mouseX, mouseY + 15);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw Gun on Canvas (additional visual)
function drawGunOnCanvas() {
    const gunX = canvas.width / 2;
    const gunY = canvas.height - 60;
    
    // Gun shadow
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    
    // Gun body
    ctx.fillStyle = '#333';
    ctx.fillRect(gunX - 30, gunY - 15, 60, 25);
    
    // Gun barrel
    ctx.fillStyle = '#555';
    ctx.fillRect(gunX + 25, gunY - 10, 35, 15);
    
    // Gun handle
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(gunX - 15, gunY + 5, 30, 20);
    
    // Trigger
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(gunX - 5, gunY + 2, 5, 8);
    
    // Muzzle
    ctx.fillStyle = '#777';
    ctx.fillRect(gunX + 55, gunY - 8, 10, 11);
    
    ctx.shadowBlur = 0;
}

// Animation Loop
function animate() {
    if (!gameActive) {
        drawBackground();
        drawGunOnCanvas();
        drawCrosshair();
        requestAnimationFrame(animate);
        return;
    }
    
    // Update targets
    for (const target of targets) {
        target.update();
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const hit = bullets[i].update();
        if (hit) {
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
    
    drawGunOnCanvas();
    drawCrosshair();
    
    animationId = requestAnimationFrame(animate);
}

// Mouse move tracking
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
    
    // Limit to canvas bounds
    mouseX = Math.max(20, Math.min(canvas.width - 20, mouseX));
    mouseY = Math.max(20, Math.min(canvas.height - 20, mouseY));
    
    // Move crosshair div
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        crosshair.style.left = e.clientX + 'px';
        crosshair.style.top = e.clientY + 'px';
    }
});

// Shoot on click
canvas.addEventListener('click', (e) => {
    e.preventDefault();
    shoot();
});

// Keyboard shoot (spacebar)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'KeyF') {
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

// Hide default cursor
canvas.style.cursor = 'none';

// Start game
initLevel();
animate();

console.log('🔫 Gun Shooting Game Loaded! 10 Levels Ready!');
