// ========================================
// COMPLETE CARROM BOARD GAME
// Bot Opponent | Power Slider | Movable Striker
// ========================================

const canvas = document.getElementById('carromCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;

// Game Mode
let gameMode = 'bot'; // 'bot' or 'twoPlayer'
let isBotThinking = false;

// Game State
let currentPlayer = 1; // 1 = Player 1 (Bottom), 2 = Player 2 (Top)
let player1Score = 0;
let player2Score = 0;
let gameActive = true;
let winner = null;

// Physics
let friction = 0.98;
let pocketRadius = 22;
let striker = {
    x: 300,
    y: 550,
    radius: 12,
    vx: 0,
    vy: 0,
    moving: false
};

let coins = [];
let power = 0;
let aimAngle = -Math.PI / 2; // Default aim up

// Pocket positions
const pockets = [
    {x: 30, y: 30}, {x: 300, y: 30}, {x: 570, y: 30},
    {x: 30, y: 570}, {x: 300, y: 570}, {x: 570, y: 570}
];

// Coin colors and points
const coinTypes = [
    {color: '#44ff44', points: 10, name: 'Green'},
    {color: '#ff4444', points: 50, name: 'Red (Queen)', isQueen: true},
    {color: '#4444ff', points: 10, name: 'Blue'},
    {color: '#ffff44', points: 10, name: 'Yellow'},
    {color: '#ff8844', points: 10, name: 'Orange'},
    {color: '#ff44ff', points: 10, name: 'Pink'},
    {color: '#44ffff', points: 10, name: 'Cyan'},
    {color: '#88ff88', points: 10, name: 'Light Green'},
    {color: '#ff8888', points: 10, name: 'Light Red'}
];

// Initialize coins
function initCoins() {
    coins = [];
    const centerX = 300;
    const centerY = 300;
    
    // Red Queen in center
    coins.push({
        x: centerX, y: centerY, radius: 11,
        color: '#ff4444', points: 50, isQueen: true,
        vx: 0, vy: 0, pocketed: false
    });
    
    // Inner ring (6 coins)
    const innerPositions = [
        {x: centerX, y: centerY - 30, color: '#44ff44', points: 10},
        {x: centerX + 26, y: centerY - 15, color: '#4444ff', points: 10},
        {x: centerX + 26, y: centerY + 15, color: '#ffff44', points: 10},
        {x: centerX, y: centerY + 30, color: '#ff8844', points: 10},
        {x: centerX - 26, y: centerY + 15, color: '#ff44ff', points: 10},
        {x: centerX - 26, y: centerY - 15, color: '#44ffff', points: 10}
    ];
    
    innerPositions.forEach(pos => {
        coins.push({
            x: pos.x, y: pos.y, radius: 10,
            color: pos.color, points: pos.points, isQueen: false,
            vx: 0, vy: 0, pocketed: false
        });
    });
    
    // Outer ring (9 coins)
    const outerPositions = [
        {x: centerX - 55, y: centerY - 35, color: '#88ff88', points: 10},
        {x: centerX, y: centerY - 60, color: '#ff8888', points: 10},
        {x: centerX + 55, y: centerY - 35, color: '#88ff88', points: 10},
        {x: centerX + 60, y: centerY, color: '#ff8888', points: 10},
        {x: centerX + 55, y: centerY + 35, color: '#88ff88', points: 10},
        {x: centerX, y: centerY + 60, color: '#ff8888', points: 10},
        {x: centerX - 55, y: centerY + 35, color: '#88ff88', points: 10},
        {x: centerX - 60, y: centerY, color: '#ff8888', points: 10},
        {x: centerX - 30, y: centerY - 50, color: '#88ff88', points: 10}
    ];
    
    outerPositions.forEach(pos => {
        coins.push({
            x: pos.x, y: pos.y, radius: 9,
            color: pos.color, points: pos.points, isQueen: false,
            vx: 0, vy: 0, pocketed: false
        });
    });
}

// Draw Carrom Board
function drawBoard() {
    // Wooden background
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Inner playing surface
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(15, 15, canvas.width - 30, canvas.height - 30);
    
    // Border lines
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    
    // Inner border
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);
    
    // Center circle
    ctx.beginPath();
    ctx.arc(300, 300, 80, 0, Math.PI * 2);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Center star/red circle
    ctx.beginPath();
    ctx.arc(300, 300, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('★', 293, 306);
    
    // Lines from center
    ctx.beginPath();
    ctx.moveTo(300, 220);
    ctx.lineTo(300, 380);
    ctx.moveTo(220, 300);
    ctx.lineTo(380, 300);
    ctx.moveTo(243, 243);
    ctx.lineTo(357, 357);
    ctx.moveTo(243, 357);
    ctx.lineTo(357, 243);
    ctx.stroke();
    
    // Draw pockets
    pockets.forEach(pocket => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pocketRadius - 5, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
    });
    
    // Foul lines
    ctx.beginPath();
    ctx.rect(45, 45, canvas.width - 90, canvas.height - 90);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Draw coins
function drawCoins() {
    for (let coin of coins) {
        if (!coin.pocketed) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
            
            const gradient = ctx.createRadialGradient(
                coin.x - 3, coin.y - 3, 3,
                coin.x, coin.y, coin.radius
            );
            gradient.addColorStop(0, coin.color);
            gradient.addColorStop(1, darkenColor(coin.color));
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            if (coin.isQueen) {
                ctx.font = `${coin.radius}px Arial`;
                ctx.fillStyle = '#ffd700';
                ctx.fillText('👑', coin.x - 7, coin.y + 5);
            } else {
                ctx.font = 'bold 10px Arial';
                ctx.fillStyle = '#fff';
                ctx.fillText(coin.points, coin.x - 5, coin.y + 4);
            }
            
            ctx.shadowBlur = 0;
        }
    }
}

// Draw Striker
function drawStriker() {
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    
    ctx.beginPath();
    ctx.arc(striker.x, striker.y, striker.radius, 0, Math.PI * 2);
    
    const gradient = ctx.createRadialGradient(
        striker.x - 4, striker.y - 4, 4,
        striker.x, striker.y, striker.radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#cccccc');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#999';
    ctx.stroke();
    
    // Aim line when not moving
    if (!striker.moving && gameActive) {
        const endX = striker.x + Math.cos(aimAngle) * 100;
        const endY = striker.y + Math.sin(aimAngle) * 100;
        
        ctx.beginPath();
        ctx.moveTo(striker.x, striker.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(255, 100, 0, ${power / 50})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Power indicator
        const powerLength = power / 2;
        ctx.beginPath();
        ctx.moveTo(striker.x, striker.y);
        ctx.lineTo(striker.x + Math.cos(aimAngle) * powerLength, striker.y + Math.sin(aimAngle) * powerLength);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
}

function darkenColor(color) {
    const colors = {
        '#44ff44': '#00cc00',
        '#ff4444': '#cc0000',
        '#4444ff': '#0000cc',
        '#ffff44': '#cccc00',
        '#ff8844': '#cc6600',
        '#ff44ff': '#cc00cc',
        '#44ffff': '#00cccc',
        '#88ff88': '#44cc44',
        '#ff8888': '#cc4444'
    };
    return colors[color] || '#666';
}

// Update physics
function updatePhysics() {
    let anyMoving = striker.moving;
    
    // Update striker
    if (striker.moving) {
        striker.x += striker.vx;
        striker.y += striker.vy;
        striker.vx *= friction;
        striker.vy *= friction;
        
        // Wall collision
        if (striker.x - striker.radius < 45 || striker.x + striker.radius > canvas.width - 45) {
            striker.vx = -striker.vx * 0.7;
            striker.x = Math.max(striker.radius + 45, Math.min(canvas.width - striker.radius - 45, striker.x));
        }
        if (striker.y - striker.radius < 45 || striker.y + striker.radius > canvas.height - 45) {
            striker.vy = -striker.vy * 0.7;
            striker.y = Math.max(striker.radius + 45, Math.min(canvas.height - striker.radius - 45, striker.y));
        }
        
        if (Math.abs(striker.vx) < 0.2 && Math.abs(striker.vy) < 0.2) {
            striker.moving = false;
            striker.vx = 0;
            striker.vy = 0;
            checkTurnEnd();
        }
        
        // Check striker pocketed
        for (let pocket of pockets) {
            const dx = striker.x - pocket.x;
            const dy = striker.y - pocket.y;
            if (Math.sqrt(dx * dx + dy * dy) < pocketRadius) {
                striker.moving = false;
                striker.vx = 0;
                striker.vy = 0;
                resetStrikerPosition();
                showMessage('FOUL! Striker pocketed! Turn changes.', true);
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                updateUI();
                break;
            }
        }
    }
    
    // Update coins
    for (let coin of coins) {
        if (!coin.pocketed) {
            coin.x += coin.vx;
            coin.y += coin.vy;
            coin.vx *= friction;
            coin.vy *= friction;
            
            if (Math.abs(coin.vx) > 0.01 || Math.abs(coin.vy) > 0.01) {
                anyMoving = true;
            }
            
            // Wall collision
            if (coin.x - coin.radius < 45 || coin.x + coin.radius > canvas.width - 45) {
                coin.vx = -coin.vx * 0.7;
                coin.x = Math.max(coin.radius + 45, Math.min(canvas.width - coin.radius - 45, coin.x));
            }
            if (coin.y - coin.radius < 45 || coin.y + coin.radius > canvas.height - 45) {
                coin.vy = -coin.vy * 0.7;
                coin.y = Math.max(coin.radius + 45, Math.min(canvas.height - coin.radius - 45, coin.y));
            }
            
            // Check pocketed
            for (let pocket of pockets) {
                const dx = coin.x - pocket.x;
                const dy = coin.y - pocket.y;
                if (Math.sqrt(dx * dx + dy * dy) < pocketRadius - 5) {
                    coin.pocketed = true;
                    if (currentPlayer === 1) {
                        player1Score += coin.points;
                    } else {
                        player2Score += coin.points;
                    }
                    updateUI();
                    showMessage(`${currentPlayer === 1 ? 'Player 1' : (gameMode === 'bot' ? 'Bot' : 'Player 2')} scored ${coin.points} points!`);
                    
                    if (coin.isQueen) {
                        showMessage('👑 QUEEN POCKETED! +50 points! 👑');
                    }
                    break;
                }
            }
            
            // Collision with striker
            if (striker.moving && !coin.pocketed) {
                const dx = coin.x - striker.x;
                const dy = coin.y - striker.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < striker.radius + coin.radius) {
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.sqrt(striker.vx * striker.vx + striker.vy * striker.vy);
                    coin.vx = Math.cos(angle) * speed * 1.2;
                    coin.vy = Math.sin(angle) * speed * 1.2;
                }
            }
        }
    }
    
    // Coin to coin collision
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
    
    if (!anyMoving && !striker.moving) {
        checkGameComplete();
    }
}

function checkTurnEnd() {
    let anyMoving = false;
    for (let coin of coins) {
        if (!coin.pocketed && (Math.abs(coin.vx) > 0.1 || Math.abs(coin.vy) > 0.1)) {
            anyMoving = true;
            break;
        }
    }
    
    if (!anyMoving && gameActive) {
        if (gameMode === 'bot' && currentPlayer === 2) {
            setTimeout(() => botMove(), 500);
        } else {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updateUI();
            showMessage(`${currentPlayer === 1 ? 'Player 1' : (gameMode === 'bot' ? 'Bot' : 'Player 2')}'s turn`);
        }
        resetStrikerPosition();
    }
}

function resetStrikerPosition() {
    striker.x = 300;
    
    if (currentPlayer === 1) {
        striker.y = 540;
    } else {
        striker.y = 60;
    }
    
    striker.vx = 0;
    striker.vy = 0;
    striker.moving = false;
}

function botMove() {
    if (gameMode !== 'bot' || currentPlayer !== 2 || !gameActive || isBotThinking) return;
    
    isBotThinking = true;
    showMessage('🤖 Bot is aiming...');
    
    setTimeout(() => {
        // Find best aim
        const activeCoins = coins.filter(c => !c.pocketed);
        if (activeCoins.length > 0) {
            const target = activeCoins[0];
            const dx = target.x - striker.x;
            const dy = target.y - striker.y;
            aimAngle = Math.atan2(dy, dx);
            
            // Adjust power based on distance
            const distance = Math.sqrt(dx * dx + dy * dy);
            power = Math.min(80, Math.max(30, distance / 5));
            document.getElementById('powerSlider').value = power;
            document.getElementById('powerValue').textContent = Math.floor(power);
        } else {
            power = 50;
        }
        
        setTimeout(() => {
            shoot();
            isBotThinking = false;
        }, 500);
    }, 500);
}

function shoot() {
    if (!gameActive) return;
    if (striker.moving) return;
    if (power < 5) {
        showMessage('Increase power to shoot!', true);
        return;
    }
    
    striker.vx = Math.cos(aimAngle) * power / 3;
    striker.vy = Math.sin(aimAngle) * power / 3;
    striker.moving = true;
    
    showMessage(`Shot with ${Math.floor(power)}% power!`);
    
    power = 0;
    document.getElementById('powerSlider').value = 0;
    document.getElementById('powerValue').textContent = '0';
}

function checkGameComplete() {
    const activeCoins = coins.filter(c => !c.pocketed && !c.isQueen);
    if (activeCoins.length === 0 || player1Score >= 100 || player2Score >= 100) {
        gameActive = false;
        let winnerMsg = '';
        if (player1Score > player2Score) {
            winnerMsg = `🏆 PLAYER 1 WINS! Score: ${player1Score} - ${player2Score} 🏆`;
        } else if (player2Score > player1Score) {
            winnerMsg = `🏆 ${gameMode === 'bot' ? 'BOT' : 'PLAYER 2'} WINS! Score: ${player2Score} - ${player1Score} 🏆`;
        } else {
            winnerMsg = `🤝 DRAW! Score: ${player1Score} - ${player2Score} 🤝`;
        }
        showMessage(winnerMsg);
        document.getElementById('status').innerHTML = winnerMsg;
    }
}

function updateUI() {
    document.getElementById('player1Score').textContent = player1Score;
    document.getElementById('player2Score').textContent = player2Score;
    
    const turnText = currentPlayer === 1 ? '🎯 Player 1' : (gameMode === 'bot' ? '🤖 Bot' : '🎯 Player 2');
    document.getElementById('turnIndicator').innerHTML = `${turnText}'s Turn`;
}

let messageTimeout;
function showMessage(msg, isError = false) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = msg;
    statusDiv.style.color = isError ? '#ff6666' : '#ffcc80';
    
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        if (document.getElementById('status').textContent === msg) {
            document.getElementById('status').textContent = '';
        }
    }, 2000);
}

// Reset game
function resetGame() {
    initCoins();
    player1Score = 0;
    player2Score = 0;
    currentPlayer = 1;
    gameActive = true;
    power = 0;
    aimAngle = currentPlayer === 1 ? -Math.PI / 2 : Math.PI / 2;
    
    resetStriker
