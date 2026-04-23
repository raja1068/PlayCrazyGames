const canvas = document.getElementById('ludoCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;

let currentPlayer = 'red';
let diceValue = 0;
let gameActive = true;
let players = {
    red: { tokens: [0,0,0,0], home: 0, color: '#ff4444' },
    green: { tokens: [0,0,0,0], home: 0, color: '#44ff44' },
    yellow: { tokens: [0,0,0,0], home: 0, color: '#ffff44' },
    blue: { tokens: [0,0,0,0], home: 0, color: '#4444ff' }
};

const playerOrder = ['red', 'green', 'yellow', 'blue'];

function drawBoard() {
    // Draw outer border
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw colored corners
    const cornerSize = 200;
    // Red corner (bottom-right)
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(canvas.width - cornerSize, canvas.height - cornerSize, cornerSize, cornerSize);
    
    // Green corner (bottom-left)
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(0, canvas.height - cornerSize, cornerSize, cornerSize);
    
    // Yellow corner (top-right)
    ctx.fillStyle = '#ffff44';
    ctx.fillRect(canvas.width - cornerSize, 0, cornerSize, cornerSize);
    
    // Blue corner (top-left)
    ctx.fillStyle = '#4444ff';
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    
    // Draw paths
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    
    // Draw token positions
    drawTokens();
}

function drawTokens() {
    // Draw tokens based on positions
    const tokenRadius = 15;
    const startX = canvas.width / 2;
    const startY = canvas.height / 2;
    
    for (const [player, data] of Object.entries(players)) {
        for (let i = 0; i < data.tokens.length; i++) {
            const pos = data.tokens[i];
            if (pos > 0) {
                // Calculate position on board (simplified)
                let x = startX + (pos % 10) * 30;
                let y = startY + Math.floor(pos / 10) * 30;
                
                ctx.beginPath();
                ctx.arc(x, y, tokenRadius, 0, Math.PI * 2);
                ctx.fillStyle = data.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(i + 1, x - 5, y + 6);
            }
        }
    }
}

function rollDice() {
    if (!gameActive) return;
    
    diceValue = Math.floor(Math.random() * 6) + 1;
    document.getElementById('dice').textContent = diceValue;
    document.getElementById('message').textContent = `${currentPlayer.toUpperCase()} rolled ${diceValue}!`;
    
    // Check if can move any token
    let canMove = false;
    const playerTokens = players[currentPlayer].tokens;
    
    if (diceValue === 6) {
        // Check if any token is at home (0)
        const hasTokenAtHome = playerTokens.some(pos => pos === 0);
        if (hasTokenAtHome) {
            canMove = true;
        }
    }
    
    // Find movable tokens
    const movableTokens = [];
    playerTokens.forEach((pos, index) => {
        if (pos > 0 && pos + diceValue <= 57) {
            movableTokens.push(index);
        } else if (diceValue === 6 && pos === 0) {
            movableTokens.push(index);
        }
    });
    
    if (movableTokens.length === 0) {
        document.getElementById('message').textContent = `${currentPlayer.toUpperCase()} cannot move! Turn skipped.`;
        setTimeout(() => switchTurn(), 1500);
    } else {
        // Auto-move first movable token for simplicity
        moveToken(movableTokens[0], diceValue);
    }
}

function moveToken(tokenIndex, steps) {
    const tokenPos = players[currentPlayer].tokens[tokenIndex];
    let newPos = tokenPos + steps;
    
    if (tokenPos === 0 && steps === 6) {
        newPos = 1;
    }
    
    if (newPos === 57) {
        // Token reached home
        players[currentPlayer].tokens[tokenIndex] = 57;
        players[currentPlayer].home++;
        updateScores();
        document.getElementById('message').textContent = `${currentPlayer.toUpperCase()} got a token HOME! 🎉`;
        
        if (players[currentPlayer].home === 4) {
            gameWin();
            return;
        }
    } else {
        players[currentPlayer].tokens[tokenIndex] = newPos;
        document.getElementById('message').textContent = `${currentPlayer.toUpperCase()} moved token ${tokenIndex + 1} to position ${newPos}`;
    }
    
    drawBoard();
    
    if (steps !== 6) {
        switchTurn();
    } else {
        document.getElementById('message').textContent += ` Extra turn!`;
    }
}

function switchTurn() {
    const currentIndex = playerOrder.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % playerOrder.length;
    currentPlayer = playerOrder[nextIndex];
    document.getElementById('turnIndicator').innerHTML = `🎲 ${currentPlayer.toUpperCase()}'s Turn`;
    document.getElementById('turnIndicator').style.color = players[currentPlayer].color;
}

function updateScores() {
    document.getElementById('redScore').textContent = players.red.home;
    document.getElementById('greenScore').textContent = players.green.home;
    document.getElementById('yellowScore').textContent = players.yellow.home;
    document.getElementById('blueScore').textContent = players.blue.home;
}

function gameWin() {
    gameActive = false;
    document.getElementById('message').innerHTML = `🎉 ${currentPlayer.toUpperCase()} WINS THE GAME! 🎉`;
    document.getElementById('rollBtn').disabled = true;
}

function resetGame() {
    players = {
        red: { tokens: [0,0,0,0], home: 0, color: '#ff4444' },
        green: { tokens: [0,0,0,0], home: 0, color: '#44ff44' },
        yellow: { tokens: [0,0,0,0], home: 0, color: '#ffff44' },
        blue: { tokens: [0,0,0,0], home: 0, color: '#4444ff' }
    };
    currentPlayer = 'red';
    diceValue = 0;
    gameActive = true;
    document.getElementById('dice').textContent = '🎲';
    document.getElementById('rollBtn').disabled = false;
    document.getElementById('turnIndicator').innerHTML = "🎲 Red's Turn";
    document.getElementById('turnIndicator').style.color = '#ff4444';
    document.getElementById('message').innerHTML = '';
    updateScores();
    drawBoard();
}

document.getElementById('rollBtn').addEventListener('click', rollDice);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

drawBoard();
