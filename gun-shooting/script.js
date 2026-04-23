const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;

let level = 1;
let score = 0;
let shotsLeft = 10;
let targetsHit = 0;
let targetsNeeded = 5;
let gameActive = true;
let animationId;
let targets = [];
let crosshair = { x: canvas.width/2, y: canvas.height/2 };

// Level configurations
const levelConfig = {
    1: { targetCount: 5, speed: 1, size: 40, points: 10, timeLimit: 60 },
    2: { targetCount: 6, speed: 1.5, size: 38, points: 10, timeLimit: 55 },
    3: { targetCount: 7, speed: 2, size: 36, points: 15, timeLimit: 50 },
    4: { targetCount: 8, speed: 2.5, size: 34, points: 15, timeLimit: 45 },
    5: { targetCount: 9, speed: 3, size: 32, points: 20, timeLimit: 40 },
    6: { targetCount: 10, speed: 3.5, size: 30, points: 20, timeLimit: 35 },
    7: { targetCount: 11, speed: 4, size: 28, points: 25, timeLimit: 30 },
    8: { targetCount: 12, speed: 4.5, size: 26, points: 25, timeLimit: 25 },
    9: { targetCount: 13, speed: 5, size: 24, points: 30, timeLimit: 20 },
    10: { targetCount: 15, speed: 6, size: 22, points: 50, timeLimit: 15 }
};

class Target {
    constructor(x, y, size, speed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.dx = (Math.random() - 0.5) * speed * 2;
        this.dy = (Math.random() - 0.5) * speed * 2;
    }

    draw() {
        // Draw target circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw bullseye
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size/4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        
        // Bounce off walls
        if (this.x - this.size < 0 || this.x + this.size > canvas.width) {
            this.dx = -this.dx;
        }
        if (this.y - this.size < 0 || this.y + this.size > canvas.height) {
            this.dy = -this.dy;
        }
    }

    isClicked(mouseX, mouseY) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.size;
    }
}

function initLevel() {
    const config = levelConfig[level];
    targetsNeeded = config.targetCount;
    targets = [];
    
    for (let i = 0; i < config.targetCount; i++) {
        const size = config.size;
        const x = Math.random() * (canvas.width - size * 2) + size;
        const y = Math.random() * (canvas.height - size * 2) + size;
        targets.push(new Target(x, y, size, config.speed));
    }
    
    document.getElementById('targetsNeeded').textContent = targetsNeeded;
    document.getElementById('level').textContent = level;
    document.getElementById('shotsLeft').textContent = shotsLeft;
    document.getElementById('targetsHit').textContent = targetsHit;
    
    showLevelMessage(`Level ${level} - ${config.targetCount} targets!`);
}

function drawCrosshair() {
    ctx.beginPath();
    ctx.moveTo(crosshair.x - 15, crosshair.y);
    ctx.lineTo(crosshair.x - 5, crosshair.y);
    ctx.moveTo(crosshair.x + 5, crosshair.y);
    ctx.lineTo(crosshair.x + 15, crosshair.y);
    ctx.moveTo(crosshair.x, crosshair.y - 15);
    ctx.lineTo(crosshair.x, crosshair.y - 5);
    ctx.moveTo(crosshair.x, crosshair.y + 5);
    ctx.lineTo(crosshair.x, crosshair.y + 15);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(crosshair.x, crosshair.y, 8, 0, Math.PI * 2);
    ctx.stroke();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw targets
    targets.forEach(target => target.draw());
    drawCrosshair();
}

function update() {
    if (!gameActive) return;
    targets.forEach(target => target.update());
    draw();
    animationId = requestAnimationFrame(update);
}

function shoot(e) {
    if (!gameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    shotsLeft--;
    document.getElementById('shotsLeft').textContent = shotsLeft;
    
    let hit = false;
    for (let i = 0; i < targets.length; i++) {
        if (targets[i].isClicked(mouseX, mouseY)) {
            targets.splice(i, 1);
            targetsHit++;
            score += levelConfig[level].points;
            hit = true;
            break;
        }
    }
    
    if (hit) {
        document.getElementById('score').textContent = score;
        document.getElementById('targetsHit').textContent = targetsHit;
        
        // Check level completion
        if (targetsHit >= targetsNeeded) {
            if (level < 10) {
                level++;
                targetsHit = 0;
                shotsLeft = 10;
                initLevel();
            } else {
                gameWon();
            }
        }
    }
    
    if (shotsLeft <= 0 && targetsHit < targetsNeeded) {
        gameOver();
    }
}

function gameWon() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    showLevelMessage('🎉 CONGRATULATIONS! YOU COMPLETED ALL 10 LEVELS! 🎉');
    document.getElementById('levelMessage').style.color = '#4CAF50';
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    showLevelMessage(`💀 GAME OVER! You reached Level ${level} with ${score} points! 💀`);
}

function showLevelMessage(msg) {
    const msgDiv = document.getElementById('levelMessage');
    msgDiv.textContent = msg;
    setTimeout(() => {
        if (msgDiv.textContent === msg) {
            msgDiv.textContent = '';
        }
    }, 3000);
}

function resetGame() {
    level = 1;
    score = 0;
    shotsLeft = 10;
    targetsHit = 0;
    gameActive = true;
    initLevel();
    document.getElementById('score').textContent = score;
    document.getElementById('levelMessage').style.color = '#ff4444';
    if (animationId) cancelAnimationFrame(animationId);
    update();
}

canvas.addEventListener('click', shoot);
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    crosshair.x = (e.clientX - rect.left) * scaleX;
    crosshair.y = (e.clientY - rect.top) * scaleY;
});

document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

initLevel();
update();
