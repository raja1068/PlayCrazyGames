// ========================================
// CARROM BOARD GAME - COMPLETE VERSION
// ========================================

const canvas = document.getElementById('carromCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const width = 600, height = 600;
const pocketRadius = 20;
const strikerRadius = 12;
const coinRadius = 10;
const friction = 0.98;
const pocketThreshold = 15;

// Pocket positions (corners and centers of edges)
const pockets = [
    {x: 30, y: 30}, {x: width/2, y: 30}, {x: width-30, y: 30},
    {x: 30, y: height-30}, {x: width/2, y: height-30}, {x: width-30, y: height-30}
];

// Game objects
let striker = {
    x: width/2,
    y: height - 100,
    radius: strikerRadius,
    vx: 0,
    vy: 0,
    moving: false
};

let coins = [];
let currentPlayer = 1;
let player1Score = 0;
let player2Score = 0;
let gameActive = true;
let aiming = false;
let aimStart = null;
let power = 0;
let animationId = null;
let winner = null;

// Colors for coins
const coinColors = {
    red: '#ff4444',
    green: '#44ff44',
    blue: '#4444ff',
    yellow: '#ffff44',
    black: '#333333'
};

// Initialize coins
function initCoins() {
    coins = [];
    
    // Center circle of coins (Carrom setup)
    const centerX = width/2;
    const centerY = height/2;
    
    // Outer ring (9 coins)
    const positions = [
        // Red coin (Queen) in center
        {x: centerX, y: centerY, color: 'red', points: 50, isQueen: true},
        // Green coins (4 corners around center)
        {x: centerX - 30, y: centerY - 30, color: 'green', points: 10, isQueen: false},
        {x: centerX + 30, y: centerY - 30, color: 'green', points: 10, isQueen: false},
        {x: centerX - 30, y: centerY + 30, color: 'green', points: 10, isQueen: false},
        {x: centerX + 30, y: centerY + 30, color: 'green', points: 10, isQueen: false},
        // Blue coins (outer positions)
        {x: centerX - 50, y: centerY, color: 'blue', points: 10, isQueen: false},
        {x: centerX + 50, y: centerY, color: 'blue', points: 10, isQueen: false},
        {x: centerX, y: centerY - 50, color: 'blue', points: 10, isQueen: false},
        {x: centerX, y: centerY + 50, color: 'blue', points: 10, isQueen: false}
    ];
    
    positions.forEach(pos => {
        coins.push({
            x: pos.x,
            y: pos.y,
            radius: coinRadius,
            color: pos.color,
            points: pos.points,
            isQueen: pos.isQueen,
            vx: 0,
            vy: 0,
            pocketed: false
        });
    });
}

// Draw the Carrom board
function drawBoard() {
    // Draw wooden board background
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, width-20, height-20);
    
    // Draw inner lines
    ctx.beginPath();
    ctx.moveTo(width/2, 20);
    ctx.lineTo(width/2, height-20);
    ctx.moveTo(20, height/2);
    ctx.lineTo(width-20, height/2);
    ctx.stroke();
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(width/2, height/2, 80, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw center star/diamond
    ctx.beginPath();
    ctx.moveTo(width/2, height/2 - 30);
    ctx.lineTo(width/2 + 20, height/2);
    ctx.lineTo(width/2, height/2 + 30);
    ctx.lineTo(width/2 - 20, height/2);
    ctx.closePath();
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.stroke();
    
    // Draw pockets
    pockets.forEach(pocket => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner pocket
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pocketRadius/2, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
    });
    
    // Draw foul lines
    ctx.beginPath();
    ctx.rect(70, 70, width-140, height-140);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Draw coins
function drawCoins() {
    coins.forEach(coin => {
        if (!coin.pocketed) {
            // Draw shadow
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            
            // Draw coin
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
            
            // Gradient for 3D effect
            const gradient = ctx.createRadialGradient(
                coin.x - 3, coin.y - 3, 3,
                coin.x, coin.y, coin.radius
            );
            
            if (coin.isQueen) {
                gradient.addColorStop(0, '#ff6666');
                gradient.addColorStop(1, '#cc0000');
                ctx.fillStyle = gradient;
            } else {
                gradient.addColorStop(0, coin.color);
                gradient.addColorStop(1, darkenColor(coin.color));
                ctx.fillStyle = gradient;
            }
            
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw queen crown mark
            if (coin.isQueen) {
                ctx.font = `${coin.radius}px Arial`;
                ctx.fillStyle = '#ffd700';
                ctx.shadowBlur = 0;
                ctx.fillText('👑', coin.x - 8, coin.y + 5);
            }
            
            // Draw points on coin
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            ctx.fillText(coin.points, coin.x - 6, coin.y + 5);
            
            ctx.shadowBlur = 0;
        }
    });
}

// Darken color helper
function darkenColor(color) {
    if (color === '#ff4444') return '#cc0000';
    if (color === '#44ff44') return '#00cc00';
    if (color === '#4444ff') return '#0000cc';
    if (color === '#ffff44') return '#cccc00';
    return '#333333';
}

// Draw striker
function drawStriker() {
    // Draw shadow
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    
    ctx.beginPath();
    ctx.arc(striker.x, striker.y, striker.radius, 0, Math.PI * 2);
    
    // Gradient for 3D effect
    const gradient = ctx.createRadialGradient(
        striker.x - 4, striker.y - 4, 4,
        striker.x, striker.y, striker.radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#cccccc');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw aim line
    if (aiming && aimStart && power > 0) {
        ctx.beginPath();
        ctx.moveTo(striker.x, striker.y);
        const angle = Math.atan2(striker.y - aimStart.y, striker.x - aimStart.x);
        const powerX = Math.cos(angle) * power * 3;
        const powerY = Math.sin(angle) * power * 3;
        ctx.lineTo(striker.x - powerX, striker.y - powerY);
        ctx.strokeStyle = `rgba(255, 0, 0, ${power/100})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw power circle
        ctx.beginPath();
        ctx.arc(striker.x - powerX, striker.y - powerY, power/5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 0, ${power/150})`;
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
}

// Update game physics
function updatePhysics() {
    // Update striker
    if (striker.moving) {
        striker.x += striker.vx;
        striker.y += striker.vy;
        striker.vx *= friction;
        striker.vy *= friction;
        
        // Check collision with walls
        if (striker.x - striker.radius < 20 || striker.x + striker.radius > width - 20) {
            striker.vx = -striker.vx * 0.8;
            striker.x = Math.max(striker.radius + 20, Math.min(width - striker.radius - 20, striker.x));
        }
        if (striker.y - striker.radius < 20 || striker.y + striker.radius > height - 20) {
            striker.vy = -striker.vy * 0.8;
            striker.y = Math.max(striker.radius + 20, Math.min(height - striker.radius - 20, striker.y));
        }
        
        // Check if striker stopped
        if (Math.abs(striker.vx) < 0.1 && Math.abs(striker.vy) < 0.1) {
            striker.moving = false;
            striker.vx = 0;
            striker.vy = 0;
            checkTurnEnd();
        }
        
        // Check if striker fell into pocket
        pockets.forEach(pocket => {
            const dx = striker.x - pocket.x;
            const dy = striker.y - pocket.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pocketRadius) {
                // Striker pocketed - foul!
                striker.x = width/2;
                striker.y = height - 100;
                striker.vx = 0;
                striker.vy = 0;
                striker.moving = false;
                showMessage('FOUL! Striker pocketed! Turn changes.');
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                updateScores();
            }
        });
    }
    
    // Update coins
    let anyMoving = striker.moving;
    coins.forEach(coin => {
        if (!coin.pocketed) {
            coin.x += coin.vx;
            coin.y += coin.vy;
            coin.vx *= friction;
            coin.vy *= friction;
            
            if (Math.abs(coin.vx) > 0.01 || Math.abs(coin.vy) > 0.01) {
                anyMoving = true;
            } else {
                coin.vx = 0;
                coin.vy = 0;
            }
            
            // Check collision with walls
            if (coin.x - coin.radius < 20 || coin.x + coin.radius > width - 20) {
                coin.vx = -coin.vx * 0.8;
                coin.x = Math.max(coin.radius + 20, Math.min(width - coin.radius - 20, coin.x));
            }
            if (coin.y - coin.radius < 20 || coin.y + coin.radius > height - 20) {
                coin.vy = -coin.vy * 0.8;
                coin.y = Math.max(coin.radius + 20, Math.min(height - coin.radius - 20, coin.y));
            }
            
            // Check if coin fell into pocket
            pockets.forEach(pocket => {
                const dx = coin.x - pocket.x;
                const dy = coin.y - pocket.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < pocketRadius && !coin.pocketed) {
                    coin.pocketed = true;
                    if (currentPlayer === 1) {
                        player1Score += coin.points;
                    } else {
                        player2Score += coin.points;
                    }
                    updateScores();
                    showMessage(`Player ${currentPlayer} scored ${coin.points} points!`);
                    
                    // Check for queen (red coin) special rule
                    if (coin.isQueen) {
                        showMessage(`🎉 QUEEN POCKETED! +50 points! 🎉`);
                    }
                }
            });
            
            // Check collision with striker
            if (striker.moving) {
                const dx = coin.x - striker.x;
                const dy = coin.y - striker.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < striker.radius + coin.radius) {
                    const angle = Math.atan2(dy, dx);
                    const force = Math.sqrt(striker.vx * striker.vx + striker.vy * striker.vy);
                    coin.vx = Math.cos(angle) * force * 1.2;
                    coin.vy = Math.sin(angle) * force * 1.2;
                }
            }
        }
    });
    
    // Check collision between coins
    for (let i = 0; i < coins.length; i++) {
        for (let j = i + 1; j < coins.length; j++) {
            if (!coins[i].pocketed && !coins[j].pocketed) {
                const dx = coins[i].x - coins[j].x;
                const dy = coins[i].y - coins[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < coins[i].radius + coins[j].radius) {
                    const angle = Math.atan2(dy, dx);
                    const overlap = coins[i].radius + coins[j].radius - dist;
                    const moveX = Math.cos(angle) * overlap / 2;
                    const moveY = Math.sin(angle) * overlap / 2;
                    coins[i].x += moveX;
                    coins[i].y += moveY;
                    coins[j].x -= moveX;
                    coins[j].y -= moveY;
                    
                    // Exchange velocities
                    const tempVx = coins[i].vx;
                    const tempVy = coins[i].vy;
                    coins[i].vx = coins[j].vx;
                    coins[i].vy = coins[j].vy;
                    coins[j].vx = tempVx;
                    coins[j].vy = tempVy;
                }
            }
        }
    }
    
    if (!anyMoving && striker.moving === false) {
        checkGameComplete();
    }
}

// Check if turn should end
function checkTurnEnd() {
    let anyCoinMoving = false;
    coins.forEach(coin => {
        if (!coin.pocketed && (Math.abs(coin.vx) > 0.1 || Math.abs(coin.vy) > 0.1)) {
            anyCoinMoving = true;
        }
    });
    
    if (!anyCoinMoving) {
        // Switch player
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateScores();
        showMessage(`Player ${currentPlayer}'s turn`);
        
        // Reset striker position
        striker.x = width/2;
        striker.y = height - 100;
        striker.vx = 0;
        striker.vy = 0;
        striker.moving = false;
    }
}

// Check if game is complete
function checkGameComplete() {
    const activeCoins = coins.filter(coin => !coin.pocketed && !coin.isQueen);
    if (activeCoins.length === 0 || player1Score >= 100 || player2Score >= 100) {
        gameActive = false;
        if (animationId) cancelAnimationFrame(animationId);
        
        if (player1Score > player2Score) {
            winner = 1;
            showMessage(`🏆 PLAYER 1 WINS! Final Score: ${player1Score} - ${player2Score} 🏆`);
        } else if (player2Score > player1Score) {
            winner = 2;
            showMessage(`🏆 PLAYER 2 WINS! Final Score: ${player2Score} - ${player1Score} 🏆`);
        } else {
            showMessage(`🤝 DRAW! Final Score: ${player1Score} - ${player2Score} 🤝`);
        }
    }
}

// Update score display
function updateScores() {
    document.getElementById('score1').textContent = player1Score;
    document.getElementById('score2').textContent = player2Score;
    document.getElementById('turn').textContent = `Player ${currentPlayer}`;
}

// Show message
let messageTimeout;
function showMessage(msg) {
    const messageDiv = document.getElementById('message') || createMessageDiv();
    messageDiv.textContent = msg;
    messageDiv.style.display = 'block';
    messageDiv.style.animation = 'pulse 0.5s ease';
    
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

function createMessageDiv() {
    let messageDiv = document.getElementById('message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '15px 30px';
        messageDiv.style.borderRadius = '10px';
        messageDiv.style.fontWeight = 'bold';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.display = 'none';
        document.querySelector('.game-container').appendChild(messageDiv);
    }
    return messageDiv;
}

// Handle shooting
function shoot(power, angle) {
    if (striker.moving || !gameActive) return false;
    
    striker.vx = Math.cos(angle) * power * 0.8;
    striker.vy = Math.sin(angle) * power * 0.8;
    striker.moving = true;
    
    return true;
}

// Mouse events for aiming
let mouseDown = false;
let startPoint = null;

canvas.addEventListener('mousedown', (e) => {
    if (striker.moving || !gameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    // Check if clicked on striker
    const dx = mouseX - striker.x;
    const dy = mouseY - striker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < striker.radius) {
        mouseDown = true;
        startPoint = {x: mouseX, y: mouseY};
        aiming = true;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!mouseDown || !aiming) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    const dx = startPoint.x - mouseX;
    const dy = startPoint.y - mouseY;
    power = Math.min(100, Math.sqrt(dx * dx + dy * dy) * 1.5);
    
    document.getElementById('powerValue').textContent = Math.floor(power);
    document.getElementById('power').value = power;
});

canvas.addEventListener('mouseup', (e) => {
    if (!mouseDown || !aiming) return;
    
    mouseDown = false;
    aiming = false;
    
    if (power > 5) {
        const dx = startPoint.x - striker.x;
        const dy = startPoint.y - striker.y;
        const angle = Math.atan2(dy, dx);
        shoot(power, angle);
        power = 0;
        document.getElementById('powerValue').textContent = '0';
        document.getElementById('power').value = '0';
    }
    
    canvas.style.cursor = 'crosshair';
    startPoint = null;
});

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (striker.moving || !gameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
    const touchY = (e.touches[0].clientY - rect.top) * scaleY;
    
    const dx = touchX - striker.x;
    const dy = touchY - striker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < striker.radius) {
        mouseDown = true;
        startPoint = {x: touchX, y: touchY};
        aiming = true;
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!mouseDown || !aiming) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touchX = (e.touches[0].clientX - rect.left) * scaleX;
    const touchY = (e.touches[0].clientY - rect.top) * scaleY;
    
    const dx = startPoint.x - touchX;
    const dy = startPoint.y - touchY;
    power = Math.min(100, Math.sqrt(dx * dx + dy * dy) * 1.5);
    
    document.getElementById('powerValue').textContent = Math.floor(power);
    document.getElementById('power').value = power;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!mouseDown || !aiming) return;
    
    mouseDown = false;
    aiming = false;
    
    if (power > 5) {
        const dx = startPoint.x - striker.x;
        const dy = startPoint.y - striker.y;
        const angle = Math.atan2(dy, dx);
        shoot(power, angle);
        power = 0;
        document.getElementById('powerValue').textContent = '0';
        document.getElementById('power').value = '0';
    }
    
    startPoint = null;
});

// Power slider control
document.getElementById('power').addEventListener('input', (e) => {
    power = parseInt(e.target.value);
    document.getElementById('powerValue').textContent = power;
});

document.getElementById('shootBtn').addEventListener('click', () => {
    if (striker.moving || !gameActive || power <= 0) return;
    
    // Shoot in direction away from center
    const angle = Math.atan2(striker.y - height/2, striker.x - width/2);
    shoot(power, angle);
    power = 0;
    document.getElementById('powerValue').textContent = '0';
    document.getElementById('power').value = '0';
});

// Reset game
function resetGame() {
    cancelAnimationFrame(animationId);
    initCoins();
    striker = {
        x: width/2,
        y: height - 100,
        radius: strikerRadius,
        vx: 0,
        vy: 0,
        moving: false
    };
    currentPlayer = 1;
    player1Score = 0;
    player2Score = 0;
    gameActive = true;
    winner = null;
    power = 0;
    aiming = false;
    mouseDown = false;
    startPoint = null;
    
    updateScores();
    showMessage('Game Reset! Player 1 starts');
    
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Game loop
function gameLoop() {
    updatePhysics();
    
    drawBoard();
    drawCoins();
    drawStriker();
    
    animationId = requestAnimationFrame(gameLoop);
}

// Initialize and start game
initCoins();
gameLoop();
