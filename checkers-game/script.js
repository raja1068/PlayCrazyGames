const canvas = document.getElementById('checkersCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 560;
canvas.height = 560;

const squareSize = 70;
let board = [];
let currentPlayer = 'red';
let selectedPiece = null;
let validMoves = [];
let gameActive = true;
let redPieces = 12;
let blackPieces = 12;

// Initialize board
function initBoard() {
    board = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place black pieces (top 3 rows)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = { type: 'black', king: false };
            }
        }
    }
    
    // Place red pieces (bottom 3 rows)
    for (let row = 5; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = { type: 'red', king: false };
            }
        }
    }
}

function drawBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            // Draw square
            ctx.fillStyle = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
            ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
            
            // Draw piece
            const piece = board[row][col];
            if (piece) {
                // Draw piece circle
                const gradient = ctx.createRadialGradient(
                    col * squareSize + squareSize/3,
                    row * squareSize + squareSize/3,
                    5,
                    col * squareSize + squareSize/2,
                    row * squareSize + squareSize/2,
                    squareSize/2
                );
                
                if (piece.type === 'red') {
                    gradient.addColorStop(0, '#ff6666');
                    gradient.addColorStop(1, '#cc0000');
                } else {
                    gradient.addColorStop(0, '#666666');
                    gradient.addColorStop(1, '#222222');
                }
                
                ctx.beginPath();
                ctx.arc(col * squareSize + squareSize/2, row * squareSize + squareSize/2, squareSize/2.5, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw king crown
                if (piece.king) {
                    ctx.font = `${squareSize/2}px Arial`;
                    ctx.fillStyle = '#ffd700';
                    ctx.fillText('👑', col * squareSize + squareSize/3, row * squareSize + squareSize/1.5);
                }
            }
        }
    }
    
    // Highlight selected piece
    if (selectedPiece) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.strokeRect(selectedPiece.col * squareSize, selectedPiece.row * squareSize, squareSize, squareSize);
    }
    
    // Highlight valid moves
    validMoves.forEach(move => {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(move.col * squareSize, move.row * squareSize, squareSize, squareSize);
    });
}

function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece || piece.type !== currentPlayer) return [];
    
    const moves = [];
    const directions = piece.king ? [-1, 1] : (piece.type === 'red' ? [-1] : [1]);
    
    for (const dRow of directions) {
        for (const dCol of [-1, 1]) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                if (!board[newRow][newCol]) {
                    moves.push({ row: newRow, col: newCol, capture: null });
                } else if (board[newRow][newCol].type !== currentPlayer) {
                    // Check capture move
                    const jumpRow = newRow + dRow;
                    const jumpCol = newCol + dCol;
                    if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && !board[jumpRow][jumpCol]) {
                        moves.push({ row: jumpRow, col: jumpCol, capture: { row: newRow, col: newCol } });
                    }
                }
            }
        }
    }
    
    return moves;
}

function makeMove(fromRow, fromCol, toRow, toCol, capture) {
    const piece = board[fromRow][fromCol];
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    
    if (capture) {
        board[capture.row][capture.col] = null;
        if (piece.type === 'red') {
            blackPieces--;
            document.getElementById('blackPieces').textContent = blackPieces;
        } else {
            redPieces--;
            document.getElementById('redPieces').textContent = redPieces;
        }
    }
    
    // King promotion
    if ((piece.type === 'red' && toRow === 0) || (piece.type === 'black' && toRow === 7)) {
        piece.king = true;
        document.getElementById('message').textContent = `${piece.type.toUpperCase()} got a KING! 👑`;
        setTimeout(() => document.getElementById('message').textContent = '', 2000);
    }
    
    drawBoard();
    
    // Check win
    if (redPieces === 0) {
        document.getElementById('message').textContent = '🏆 BLACK WINS THE GAME! 🏆';
        gameActive = false;
        return;
    } else if (blackPieces === 0) {
        document.getElementById('message').textContent = '🏆 RED WINS THE GAME! 🏆';
        gameActive = false;
        return;
    }
    
    // Switch player
    currentPlayer = currentPlayer === 'red' ? 'black' : 'red';
    document.getElementById('turnIndicator').innerHTML = currentPlayer === 'red' ? '🔴 Red\'s Turn' : '⚫ Black\'s Turn';
    selectedPiece = null;
    validMoves = [];
    drawBoard();
}

function handleCanvasClick(e) {
    if (!gameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX / squareSize);
    const row = Math.floor((e.clientY - rect.top) * scaleY / squareSize);
    
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return;
    
    // Check if clicked on a valid move
    const move = validMoves.find(m => m.row === row && m.col === col);
    if (move && selectedPiece) {
        makeMove(selectedPiece.row, selectedPiece.col, move.row, move.col, move.capture);
        return;
    }
    
    // Select a piece
    const piece = board[row][col];
    if (piece && piece.type === currentPlayer) {
        selectedPiece = { row, col };
        validMoves = getValidMoves(row, col);
        drawBoard();
    } else {
        selectedPiece = null;
        validMoves = [];
        drawBoard();
    }
}

function resetGame() {
    initBoard();
    currentPlayer = 'red';
    selectedPiece = null;
    validMoves = [];
    gameActive = true;
    redPieces = 12;
    blackPieces = 12;
    document.getElementById('redPieces').textContent = redPieces;
    document.getElementById('blackPieces').textContent = blackPieces;
    document.getElementById('turnIndicator').innerHTML = '🔴 Red\'s Turn';
    document.getElementById('message').textContent = '';
    drawBoard();
}

canvas.addEventListener('click', handleCanvasClick);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

initBoard();
drawBoard();
