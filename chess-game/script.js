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
let currentPlayer = 'white'; // white moves first
let selectedSquare = null;
let gameActive = true;
let whiteCaptured = [];
let blackCaptured = [];

// Piece movement rules
function isValidMove(piece, fromRow, fromCol, toRow, toCol, board) {
    const pieceType = piece;
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const targetPiece = board[toRow][toCol];
    
    // Can't capture own piece
    if (targetPiece && ((currentPlayer === 'white' && '♙♖♘♗♕♔'.includes(targetPiece)) ||
                       (currentPlayer === 'black' && '♟♜♞♝♛♚'.includes(targetPiece)))) {
        return false;
    }
    
    // Pawn moves
    if (pieceType === '♙' || pieceType === '♟') {
        const direction = pieceType === '♙' ? -1 : 1;
        const startRow = pieceType === '♙' ? 6 : 1;
        
        // Move forward
        if (colDiff === 0 && !targetPiece) {
            if (rowDiff === direction) return true;
            if (rowDiff === 2 * direction && fromRow === startRow && !board[fromRow + direction][fromCol]) return true;
        }
        // Capture diagonally
        else if (Math.abs(colDiff) === 1 && rowDiff === direction && targetPiece) {
            return true;
        }
        return false;
    }
    
    // Rook moves
    if (pieceType === '♖' || pieceType === '♜') {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return isClearPath(fromRow, fromCol, toRow, toCol, board);
    }
    
    // Knight moves
    if (pieceType === '♘' || pieceType === '♞') {
        return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
               (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
    }
    
    // Bishop moves
    if (pieceType === '♗' || pieceType === '♝') {
        if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;
        return isClearPath(fromRow, fromCol, toRow, toCol, board);
    }
    
    // Queen moves
    if (pieceType === '♕' || pieceType === '♛') {
        if (fromRow === toRow || fromCol === toCol) {
            return isClearPath(fromRow, fromCol, toRow, toCol, board);
        }
        if (Math.abs(rowDiff) === Math.abs(colDiff)) {
            return isClearPath(fromRow, fromCol, toRow, toCol, board);
        }
        return false;
    }
    
    // King moves
    if (pieceType === '♔' || pieceType === '♚') {
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
    
    // Find king position
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] === king) {
                kingPos = {row: i, col: j};
                break;
            }
        }
    }
    
    if (!kingPos) return false;
    
    // Check if any enemy piece can capture king
    const opponent = player === 'white' ? 'black' : 'white';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && ((opponent === 'white' && '♙♖♘♗♕♔'.includes(piece)) ||
                         (opponent === 'black' && '♟♜♞♝♛♚'.includes(piece)))) {
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
    
    // Capture piece
    if (targetPiece) {
        if (currentPlayer === 'white') {
            whiteCaptured.push(targetPiece);
        } else {
            blackCaptured.push(targetPiece);
        }
        updateCapturedDisplay();
    }
    
    // Move piece
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = '';
    
    // Check if move puts own king in check
    if (isKingInCheck(board, currentPlayer)) {
        // Undo move
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
    document.getElementById('whiteCaptured').textContent = whiteCaptured.join(' ');
    document.getElementById('blackCaptured').textContent = blackCaptured.join(' ');
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
            
            // Check if king is in check
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
    
    // No piece selected
    if (selectedSquare === null) {
        // Select piece if it belongs to current player
        if (piece && ((currentPlayer === 'white' && '♙♖♘♗♕♔'.includes(piece)) ||
                     (currentPlayer === 'black' && '♟♜♞♝♛♚'.includes(piece)))) {
            selectedSquare = {row, col};
            renderBoard();
            showValidMoves(row, col);
        }
    } else {
        // Try to move
        const fromRow = selectedSquare.row;
        const fromCol = selectedSquare.col;
        const piece = board[fromRow][fromCol];
        
        if (isValidMove(piece, fromRow, fromCol, row, col, board)) {
            if (makeMove(fromRow, fromCol, row, col)) {
                // Switch players
                currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
                document.getElementById('turnIndicator').textContent = 
                    currentPlayer === 'white' ? "White's Turn" : "Black's Turn";
                
                // Check for checkmate
                if (isCheckmate()) {
                    const winner = currentPlayer === 'white' ? 'Black' : 'White';
                    document.getElementById('status').textContent = `${winner} wins by checkmate! 🎉`;
                    gameActive = false;
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
    // Simplified checkmate detection
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && ((currentPlayer === 'white' && '♙♖♘♗♕♔'.includes(piece)) ||
                         (currentPlayer === 'black' && '♟♜♞♝♛♚'.includes(piece)))) {
                // Try all possible moves
                for (let k = 0; k < 8; k++) {
                    for (let l = 0; l < 8; l++) {
                        if (isValidMove(piece, i, j, k, l, board)) {
                            // Test if move gets out of check
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
    document.getElementById('turnIndicator').textContent = "White's Turn";
    document.getElementById('status').textContent = '';
    updateCapturedDisplay();
    renderBoard();
}

document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

renderBoard();
