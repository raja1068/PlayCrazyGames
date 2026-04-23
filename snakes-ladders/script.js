// Snakes and Ladders positions
const snakes = {
    16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78
};

const ladders = {
    1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100
};

let player1Pos = 1;
let player2Pos = 1;
let currentPlayer = 1;
let gameActive = true;
let diceValue = 0;

function createBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    
    for (let i = 100; i >= 1; i--) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = i;
        
        if (snakes[i]) {
            cell.classList.add('snake');
            cell.title = `Snake! Go to ${snakes[i]}`;
        }
        if (ladders[i]) {
            cell.classList.add('ladder');
            cell.title = `Ladder! Climb to ${ladders[i]}`;
        }
        
        // Add player markers
        if (player1Pos === i) {
            const marker1 = document.createElement('div');
            marker1.className = 'player1-marker';
            cell.appendChild(marker1);
        }
        if (player2Pos === i) {
            const marker2 = document.createElement('div');
            marker2.className = 'player2-marker';
            cell.appendChild(marker2);
        }
        
        board.appendChild(cell);
    }
}

function rollDice() {
    if (!gameActive) return;
    
    diceValue = Math.floor(Math.random() * 6) + 1;
    document.getElementById('dice').textContent = diceValue;
    
    movePlayer(currentPlayer, diceValue);
}

function movePlayer(player, steps) {
    let oldPos = player === 1 ? player1Pos : player2Pos;
    let newPos = oldPos + steps;
    
    if (newPos > 100) {
        showMessage(`Player ${player} needs exactly ${100 - oldPos} to win!`);
        switchTurn();
        return;
    }
    
    // Check for snakes or ladders
    let message = `Player ${player} rolled ${steps}. Moved from ${oldPos} to ${newPos}`;
    
    if (snakes[newPos]) {
        message += ` 🐍 Snake! Down to ${snakes[newPos]}`;
        newPos = snakes[newPos];
    } else if (ladders[newPos]) {
        message += ` 🪜 Ladder! Up to ${ladders[newPos]}`;
        newPos = ladders[newPos];
    }
    
    // Update position
    if (player === 1) {
        player1Pos = newPos;
        document.getElementById('player1Pos').textContent = player1Pos;
    } else {
        player2Pos = newPos;
        document.getElementById('player2Pos').textContent = player2Pos;
    }
    
    showMessage(message);
    
    // Check win condition
    if (newPos === 100) {
        showMessage(`🎉 Player ${player} wins the game! 🎉`);
        gameActive = false;
        document.getElementById('rollBtn').disabled = true;
        return;
    }
    
    // Switch turns
    switchTurn();
    createBoard();
}

function switchTurn() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    document.getElementById('turnIndicator').textContent = `Player ${currentPlayer}'s Turn`;
    document.getElementById('turnIndicator').style.color = currentPlayer === 1 ? '#ff4444' : '#4444ff';
}

function showMessage(msg) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = msg;
    setTimeout(() => {
        if (messageDiv.textContent === msg) {
            messageDiv.textContent = '';
        }
    }, 3000);
}

function resetGame() {
    player1Pos = 1;
    player2Pos = 1;
    currentPlayer = 1;
    gameActive = true;
    diceValue = 0;
    document.getElementById('dice').textContent = '🎲';
    document.getElementById('rollBtn').disabled = false;
    document.getElementById('player1Pos').textContent = '1';
    document.getElementById('player2Pos').textContent = '1';
    document.getElementById('turnIndicator').textContent = "Player 1's Turn";
    document.getElementById('turnIndicator').style.color = '#ff4444';
    document.getElementById('message').textContent = '';
    createBoard();
}

document.getElementById('rollBtn').addEventListener('click', rollDice);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

createBoard();
