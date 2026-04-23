const board = document.getElementById('board');
const statusDiv = document.getElementById('status');
let currentPlayer = 'X';
let gameActive = true;
let gameState = ['', '', '', '', '', '', '', '', ''];

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// Create board
function createBoard() {
    board.innerHTML = '';
    for(let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', () => handleCellClick(i));
        board.appendChild(cell);
    }
}

function handleCellClick(index) {
    if(gameState[index] !== '' || !gameActive) return;
    
    gameState[index] = currentPlayer;
    updateCellDisplay(index);
    
    checkResult();
}

function updateCellDisplay(index) {
    const cells = document.querySelectorAll('.cell');
    cells[index].textContent = currentPlayer;
    cells[index].classList.add(currentPlayer.toLowerCase());
}

function checkResult() {
    let roundWon = false;
    
    for(let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if(gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            roundWon = true;
            break;
        }
    }
    
    if(roundWon) {
        statusDiv.textContent = `Player ${currentPlayer} wins! 🎉`;
        gameActive = false;
        return;
    }
    
    if(!gameState.includes('')) {
        statusDiv.textContent = "It's a draw! 🤝";
        gameActive = false;
        return;
    }
    
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusDiv.textContent = `Player ${currentPlayer}'s turn`;
}

function resetGame() {
    currentPlayer = 'X';
    gameActive = true;
    gameState = ['', '', '', '', '', '', '', '', ''];
    statusDiv.textContent = "Player X's turn";
    
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });
}

document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

createBoard();
