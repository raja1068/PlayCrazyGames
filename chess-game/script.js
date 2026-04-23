// ========================================
// COMPLETE CHESS GAME - ENLARGED PIECES
// Bigger Board | Larger Chessmen | Full Logic
// ========================================

// Chess Board Initial Setup
const initialBoard = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

let board = JSON.parse(JSON.stringify(initialBoard));
let currentPlayer = 'white';
let selectedSquare = null;
let gameActive = true;
let whiteCaptured = [];
let blackCaptured = [];

// Helper functions
function isWhitePiece(piece) {
    return piece && '♙♖♘♗♕♔'.includes(piece);
}

function isBlackPiece(piece) {
    return piece && '♟♜♞♝♛♚'.includes(piece);
}

// Piece movement rules
function isValidMove(piece, fromRow, fromCol, toRow, toCol, board) {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const targetPiece = board[toRow][toCol];
    
    // Can't capture own piece
    if (targetPiece && ((currentPlayer === 'white' && isWhitePiece(targetPiece)) ||
                       (currentPlayer === 'black' && isBlackPiece(targetPiece)))) {
        return false;
    }
    
    // Pawn moves
    if (piece === '♙' || piece === '♟') {
        const direction = piece === '♙' ? -1 : 1;
        const startRow = piece === '♙' ? 6 : 1;
        
        if (colDiff === 0 && !targetPiece) {
            if (rowDiff === direction) return true;
            if (rowDiff === 2 * direction && fromRow === startRow && !board[fromRow + direction][fromCol]) return true;
        }
        else if (Math.abs(colDiff) === 1 && rowDiff === direction && targetPiece) {
            return true;
        }
        return false;
    }
    
    // Rook moves
    if (piece === '♖' || piece === '♜') {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return isClearPath(fromRow, fromCol, toRow, toCol, board);
    }
    
    // Knight moves
    if (piece === '♘' || piece === '♞') {
        return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
               (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
    }
    
    // Bishop moves
    if (piece === '♗' || piece === '♝') {
        if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;
        return isClearPath(fromRow, fromCol, toRow, toCol, board);
    }
    
    // Queen moves
    if (piece === '♕' || piece === '♛') {
        if (fromRow === toRow || fromCol === toCol) {
            return isClearPath(fromRow, fromCol, toRow, toCol, board);
        }
        if (Math.abs(rowDiff) === Math.abs(colDiff)) {
            return isClearPath(fromRow, fromCol, toRow, toCol, board);
        }
        return false;
    }
    
    // King moves
    if (piece === '♔' || piece === '♚') {
        return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
    }
    
    return false;
}

function isClearPath(fromRow, fromCol, toRow, toCol, board) {
    const rowStep = Math.sign(toRow - fromRow);
    const colStep = Math.sign(toCol - fromCol);
    let row = fromRow + rowStep;
    let col = fromCol + colStep;
    
    while (row !== toRow || col !== toCol) {
        if (board[row][col]) return false;
        row += rowStep;
        col += colStep;
    }
    return true;
}

function isKingInCheck(board, player) {
    const king = player === 'white' ? '♔' : '♚';
    let kingPos = null;
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] === king) {
                kingPos = {row: i, col: j};
                break;
            }
        }
    }
    
    if (!kingPos) return false;
    
    const opponent = player === 'white' ? 'black' : 'white';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && ((opponent === 'white' && isWhitePiece(piece)) ||
                         (opponent === 'black' && isBlackPiece(piece)))) {
                if (isValidMove(piece, i, j, kingPos.row, kingPos.col, board)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];
    
    if (targetPiece) {
        if (currentPlayer === 'white') {
            whiteCaptured.push(targetPiece);
        } else {
            blackCaptured.push(targetPiece);
        }
        updateCapturedDisplay();
    }
    
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = '';
    
    if (isKingInCheck(board, currentPlayer)) {
        board[fromRow][fromCol] = piece;
        board[toRow][toCol] = targetPiece;
        if (targetPiece) {
            if (currentPlayer === 'white') {
                whiteCaptured.pop();
            } else {
                blackCaptured.pop();
            }
            updateCapturedDisplay();
        }
        return false;
    }
    
    return true;
}

function updateCapturedDisplay() {
    document.getElementById('whiteCaptured').textContent = whiteCaptured.length;
    document.getElementById('blackCaptured').textContent = blackCaptured.length;
}

function renderBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = document.createElement('div');
            const isLight = (i + j) % 2 === 0;
            square.className = `square ${isLight ? 'light' : 'dark'}`;
            square.textContent = board[i][j];
            square.dataset.row = i;
            square.dataset.col = j;
            
            if (selectedSquare && selectedSquare.row === i && selectedSquare.col === j) {
                square.classList.add('selected');
            }
            
            if (board[i][j] === '♔' && currentPlayer === 'white' && isKingInCheck(board, 'white')) {
                square.classList.add('check');
            }
            if (board[i][j] === '♚' && currentPlayer === 'black' && isKingInCheck(board, 'black')) {
                square.classList.add('check');
            }
            
            square.addEventListener('click', () => handleSquareClick(i, j));
            chessboard.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (!gameActive) return;
    
    const piece = board[row][col];
    
    if (selectedSquare === null) {
        if (piece && ((currentPlayer === 'white' && isWhitePiece(piece)) ||
                     (currentPlayer === 'black' && isBlackPiece(piece)))) {
            selectedSquare = {row, col};
            renderBoard();
            showValidMoves(row, col);
        }
    } else {
        const fromRow = selectedSquare.row;
        const fromCol = selectedSquare.col;
        const piece = board[fromRow][fromCol];
        
        if (isValidMove(piece, fromRow, fromCol, row, col, board)) {
            if (makeMove(fromRow, fromCol, row, col)) {
                currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
                document.getElementById('turnIndicator').innerHTML = 
                    currentPlayer === 'white' ? '<span>⚪</span> White\'s Turn' : '<span>⚫</span> Black\'s Turn';
                
                if (isCheckmate()) {
                    const winner = currentPlayer === 'white' ? 'Black' : 'White';
                    document.getElementById('status').innerHTML = `🏆 CHECKMATE! ${winner} wins! 🏆`;
                    gameActive = false;
                } else if (isKingInCheck(board, currentPlayer)) {
                    document.getElementById('status').innerHTML = '⚠️ CHECK! ⚠️';
                    setTimeout(() => {
                        if (document.getElementById('status').innerHTML === '⚠️ CHECK! ⚠️') {
                            document.getElementById('status').innerHTML = '';
                        }
                    }, 1500);
                } else {
                    document.getElementById('status').innerHTML = '';
                }
            }
        }
        selectedSquare = null;
        renderBoard();
    }
}

function showValidMoves(row, col) {
    const piece = board[row][col];
    const squares = document.querySelectorAll('.square');
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(piece, row, col, i, j, board)) {
                const index = i * 8 + j;
                squares[index].classList.add('valid-move');
            }
        }
    }
}

function isCheckmate() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && ((currentPlayer === 'white' && isWhitePiece(piece)) ||
                         (currentPlayer === 'black' && isBlackPiece(piece)))) {
                for (let k = 0; k < 8; k++) {
                    for (let l = 0; l < 8; l++) {
                        if (isValidMove(piece, i, j, k, l, board)) {
                            const tempBoard = JSON.parse(JSON.stringify(board));
                            const targetPiece = tempBoard[k][l];
                            tempBoard[k][l] = tempBoard[i][j];
                            tempBoard[i][j] = '';
                            if (!isKingInCheck(tempBoard, currentPlayer)) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
    }
    return true;
}

function resetGame() {
    board = JSON.parse(JSON.stringify(initialBoard));
    currentPlayer = 'white';
    selectedSquare = null;
    gameActive = true;
    whiteCaptured = [];
    blackCaptured = [];
    document.getElementById('turnIndicator').innerHTML = '<span>⚪</span> White\'s Turn';
    document.getElementById('status').innerHTML = '';
    updateCapturedDisplay();
    renderBoard();
}

document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Initialize game
renderBoard();
console.log('♜ Chess Game Loaded! Bigger pieces ready!');
