// ========================================
// REALISTIC CHESS GAME
// Light Green Board | Detailed Chess Pieces
// ========================================

const canvas = document.getElementById('chessCanvas');
const ctx = canvas.getContext('2d');
const squareSize = 80; // 640/8 = 80

// Board colors - Light green theme
const lightSquareColor = '#c8e6c9';
const darkSquareColor = '#66bb6a';
const highlightColor = 'rgba(255, 193, 7, 0.6)';
const checkColor = 'rgba(244, 67, 54, 0.6)';

// Initial board setup
let board = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

let currentPlayer = 'white'; // white moves first
let selectedSquare = null;
let validMoves = [];
let gameActive = true;
let whiteCaptured = [];
let blackCaptured = [];
let moveHistory = [];

// Unicode chess symbols with 3D effect
const pieceSymbols = {
    // White pieces
    '♔': '♔', '♕': '♕', '♖': '♖', '♗': '♗', '♘': '♘', '♙': '♙',
    // Black pieces
    '♚': '♚', '♛': '♛', '♜': '♜', '♝': '♝', '♞': '♞', '♟': '♟'
};

// Helper function to check if a piece is white
function isWhitePiece(piece) {
    return '♔♕♖♗♘♙'.includes(piece);
}

// Helper function to check if a piece is black
function isBlackPiece(piece) {
    return '♚♛♜♝♞♟'.includes(piece);
}

// Get piece type
function getPieceType(piece) {
    if (!piece) return null;
    const typeMap = {
        '♔': 'king', '♚': 'king',
        '♕': 'queen', '♛': 'queen',
        '♖': 'rook', '♜': 'rook',
        '♗': 'bishop', '♝': 'bishop',
        '♘': 'knight', '♞': 'knight',
        '♙': 'pawn', '♟': 'pawn'
    };
    return typeMap[piece];
}

// Draw realistic chess piece with 3D effect
function drawPiece(piece, x, y, size) {
    if (!piece) return;
    
    const isWhite = isWhitePiece(piece);
    const pieceType = getPieceType(piece);
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    // Save context state
    ctx.save();
    
    // Add shadow for 3D effect
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Set colors based on piece color
    if (isWhite) {
        ctx.fillStyle = '#f5f5f5';
        ctx.strokeStyle = '#333';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
    } else {
        ctx.fillStyle = '#2c2c2c';
        ctx.strokeStyle = '#1a1a1a';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
    }
    
    ctx.lineWidth = 1.5;
    
    // Draw different piece shapes
    switch(pieceType) {
        case 'king':
            // King - tallest piece with cross on top
            ctx.beginPath();
            // Base
            ctx.ellipse(centerX, centerY + size*0.35, size*0.25, size*0.1, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            // Body
            ctx.beginPath();
            ctx.rect(centerX - size*0.2, centerY - size*0.15, size*0.4, size*0.5);
            ctx.fill();
            ctx.stroke();
            // Head
            ctx.beginPath();
            ctx.arc(centerX, centerY - size*0.25, size*0.2, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            // Cross on top
            ctx.beginPath();
            ctx.rect(centerX - size*0.05, centerY - size*0.45, size*0.1, size*0.25);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.rect(centerX - size*0.15, centerY - size*0.38, size*0.3, size*0.08);
            ctx.fill();
            ctx.stroke();
            break;
            
        case 'queen':
            // Queen - elegant with crown
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + size*0.35, size*0.25, size*0.1, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.rect(centerX - size*0.18, centerY - size*0.1, size*0.36, size*0.45);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(centerX, centerY - size*0.2, size*0.18, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            // Crown spikes
            for(let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.rect(centerX + i*size*0.12, centerY - size*0.38, size*0.06, size*0.2);
                ctx.fill();
                ctx.stroke();
            }
            break;
            
        case 'rook':
            // Rook - castle with battlements
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + size*0.35, size*0.25, size*0.1, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.rect(centerX - size*0.2, centerY - size*0.15, size*0.4, size*0.5);
            ctx.fill();
            ctx.stroke();
            // Battlements
            for(let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.rect(centerX + i*size*0.15, centerY - size*0.35, size*0.1, size*0.25);
                ctx.fill();
                ctx.stroke();
            }
            break;
            
        case 'bishop':
            // Bishop - pointed hat with slit
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + size*0.35, size*0.25, size*0.1, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.rect(centerX - size*0.18, centerY - size*0.1, size*0.36, size*0.45);
            ctx.fill();
            ctx.stroke();
            // Pointed top
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - size*0.42);
            ctx.lineTo(centerX - size*0.12, centerY - size*0.2);
            ctx.lineTo(centerX + size*0.12, centerY - size*0.2);
            ctx.fill();
            ctx.stroke();
            // Slit
            ctx.beginPath();
            ctx.ellipse(centerX, centerY - size*0.05, size*0.05, size*0.12, 0, 0, Math.PI*2);
            ctx.fillStyle = isWhite ? '#ddd' : '#444';
            ctx.fill();
            ctx.stroke();
            break;
            
        case 'knight':
            // Knight - horse head
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + size*0.35, size*0.25, size*0.1, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            // Neck
            ctx.beginPath();
            ctx.rect(centerX - size*0.15, centerY - size*0.1, size*0.3, size*0.45);
            ctx.fill();
            ctx.stroke();
            // Horse head
            ctx.beginPath();
            ctx.arc(centerX + size*0.08, centerY - size*0.25, size*0.16, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            // Mane
            ctx.beginPath();
            ctx.moveTo(centerX - size*0.05, centerY - size*0.38);
            ctx.lineTo(centerX - size*0.15, centerY - size*0.28);
            ctx.lineTo(centerX - size*0.08, centerY - size*0.22);
            ctx.fill();
            ctx.stroke();
            // Ear
            ctx.beginPath();
            ctx.moveTo(centerX + size*0.12, centerY - size*0.4);
            ctx.lineTo(centerX + size*0.08, centerY - size*0.48);
            ctx.lineTo(centerX + size*0.16, centerY - size*0.44);
            ctx.fill();
            ctx.stroke();
            break;
            
        case 'pawn':
            // Pawn - simple with ball on top
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + size*0.3, size*0.22, size*0.09, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.rect(centerX - size*0.14, centerY - size*0.05, size*0.28, size*0.35);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(centerX, centerY - size*0.2, size*0.12, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            break;
    }
    
    // Add highlight/gloss effect
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(centerX - size*0.08, centerY - size*0.1, size*0.05, 0, Math.PI*2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.5)' : 'rgba(150,150,150,0.3)';
    ctx.fill();
    
    ctx.restore();
}

// Draw the chess board
function drawBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const x = col * squareSize;
            const y = row * squareSize;
            
            // Draw square
            const isLight = (row + col) % 2 === 0;
            ctx.fillStyle = isLight ? lightSquareColor : darkSquareColor;
            ctx.fillRect(x, y, squareSize, squareSize);
            
            // Draw board border
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, squareSize, squareSize);
        }
    }
    
    // Draw coordinate labels
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#1b5e20';
    for (let i = 0; i < 8; i++) {
        ctx.fillText(String.fromCharCode(65 + i), i * squareSize + 5, squareSize - 5);
        ctx.fillText(8 - i, 5, i * squareSize + 20);
    }
}

// Highlight valid moves and selected piece
function drawHighlights() {
    if (selectedSquare) {
        const { row, col } = selectedSquare;
        const x = col * squareSize;
        const y = row * squareSize;
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, y, squareSize, squareSize);
    }
    
    for (const move of validMoves) {
        const x = move.col * squareSize;
        const y = move.row * squareSize;
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, y, squareSize, squareSize);
        
        // Draw dot in center for capture moves
        if (board[move.row][move.col]) {
            ctx.beginPath();
            ctx.arc(x + squareSize/2, y + squareSize/2, squareSize/6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,0,0,0.5)';
            ctx.fill();
        }
    }
    
    // Highlight king in check
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece === '♔' && isKingInCheck('white')) {
                const x = col * squareSize;
                const y = row * squareSize;
                ctx.fillStyle = checkColor;
                ctx.fillRect(x, y, squareSize, squareSize);
            }
            if (piece === '♚' && isKingInCheck('black')) {
                const x = col * squareSize;
                const y = row * squareSize;
                ctx.fillStyle = checkColor;
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }
    }
}

// Draw all pieces
function drawPieces() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                drawPiece(piece, col * squareSize, row * squareSize, squareSize);
            }
        }
    }
}

// Check if path is clear for rook/bishop/queen
function isClearPath(fromRow, fromCol, toRow, toCol) {
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

// Check if move is valid
function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
    const targetPiece = board[toRow][toCol];
    
    // Can't capture own piece
    if (targetPiece) {
        if ((isWhitePiece(piece) && isWhitePiece(targetPiece)) ||
            (isBlackPiece(piece) && isBlackPiece(targetPiece))) {
            return false;
        }
    }
    
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const pieceType = getPieceType(piece);
    
    switch(pieceType) {
        case 'pawn':
            const direction = isWhitePiece(piece) ? -1 : 1;
            const startRow = isWhitePiece(piece) ? 6 : 1;
            
            // Move forward one
            if (colDiff === 0 && rowDiff === direction && !targetPiece) return true;
            // Move forward two from start
            if (colDiff === 0 && rowDiff === 2 * direction && fromRow === startRow && !targetPiece && !board[fromRow + direction][fromCol]) return true;
            // Capture diagonally
            if (Math.abs(colDiff) === 1 && rowDiff === direction && targetPiece) return true;
            return false;
            
        case 'rook':
            if (fromRow !== toRow && fromCol !== toCol) return false;
            return isClearPath(fromRow, fromCol, toRow, toCol);
            
        case 'knight':
            return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
                   (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
                   
        case 'bishop':
            if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;
            return isClearPath(fromRow, fromCol, toRow, toCol);
            
        case 'queen':
            if (fromRow === toRow || fromCol === toCol) {
                return isClearPath(fromRow, fromCol, toRow, toCol);
            }
            if (Math.abs(rowDiff) === Math.abs(colDiff)) {
                return isClearPath(fromRow, fromCol, toRow, toCol);
            }
            return false;
            
        case 'king':
            return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
    }
    return false;
}

// Get all valid moves for a piece
function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    if ((currentPlayer === 'white' && !isWhitePiece(piece)) ||
        (currentPlayer === 'black' && !isBlackPiece(piece))) {
        return [];
    }
    
    const moves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (isValidMove(piece, row, col, i, j)) {
                moves.push({ row: i, col: j });
            }
        }
    }
    return moves;
}

// Check if king is in check
function isKingInCheck(color) {
    const king = color === 'white' ? '♔' : '♚';
    let kingRow = -1, kingCol = -1;
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] === king) {
                kingRow = i;
                kingCol = j;
                break;
            }
        }
    }
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && ((color === 'white' && isBlackPiece(piece)) ||
                         (color === 'black' && isWhitePiece(piece)))) {
                if (isValidMove(piece, i, j, kingRow, kingCol)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Make a move
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    
    // Save to history
    moveHistory.push({
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece: piece,
        captured: capturedPiece
    });
    
    // Move piece
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = '';
    
    // Update captured pieces
    if (capturedPiece) {
        if (isWhitePiece(capturedPiece)) {
            whiteCaptured.push(capturedPiece);
        } else {
            blackCaptured.push(capturedPiece);
        }
        updateCapturedDisplay();
    }
    
    // Check if move puts own king in check - undo if so
    if (isKingInCheck(currentPlayer)) {
        board[fromRow][fromCol] = piece;
        board[toRow][toCol] = capturedPiece;
        if (capturedPiece) {
            if (isWhitePiece(capturedPiece)) {
                whiteCaptured.pop();
            } else {
                blackCaptured.pop();
            }
            updateCapturedDisplay();
        }
        moveHistory.pop();
        return false;
    }
    
    return true;
}

// Check for checkmate
function isCheckmate() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && ((currentPlayer === 'white' && isWhitePiece(piece)) ||
                         (currentPlayer === 'black' && isBlackPiece(piece)))) {
                const moves = getValidMoves(i, j);
                for (const move of moves) {
                    // Test if move gets out of check
                    const testPiece = board[i][j];
                    const targetPiece = board[move.row][move.col];
                    board[move.row][move.col] = testPiece;
                    board[i][j] = '';
                    const stillInCheck = isKingInCheck(currentPlayer);
                    board[i][j] = testPiece;
                    board[move.row][move.col] = targetPiece;
                    
                    if (!stillInCheck) return false;
                }
            }
        }
    }
    return true;
}

// Update captured pieces display
function updateCapturedDisplay() {
    document.getElementById('whiteCaptured').textContent = whiteCaptured.length;
    document.getElementById('blackCaptured').textContent = blackCaptured.length;
}

// Switch turns
function switchTurn() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    const turnIndicator = document.getElementById('turnIndicator');
    if (currentPlayer === 'white') {
        turnIndicator.innerHTML = '<span>⚪</span> White\'s Turn';
    } else {
        turnIndicator.innerHTML = '<span>⚫</span> Black\'s Turn';
    }
    
    if (isKingInCheck(currentPlayer)) {
        if (isCheckmate()) {
            const winner = currentPlayer === 'white' ? 'Black' : 'White';
            document.getElementById('status').innerHTML = `🏆 CHECKMATE! ${winner} wins! 🏆`;
            gameActive = false;
        } else {
            document.getElementById('status').innerHTML = '⚠️ CHECK! ⚠️';
            setTimeout(() => {
                if (document.getElementById('status').innerHTML === '⚠️ CHECK! ⚠️') {
                    document.getElementById('status').innerHTML = '';
                }
            }, 1500);
        }
    }
}

// Handle square click
function handleSquareClick(row, col) {
    if (!gameActive) return;
    
    // Check if a move is selected
    const move = validMoves.find(m => m.row === row && m.col === col);
    if (move && selectedSquare) {
        if (makeMove(selectedSquare.row, selectedSquare.col, row, col)) {
            selectedSquare = null;
            validMoves = [];
            drawBoard();
            drawHighlights();
            drawPieces();
            switchTurn();
            drawBoard();
            drawHighlights();
            drawPieces();
        }
        return;
    }
    
    // Select a piece
    const piece = board[row][col];
    if (piece && ((currentPlayer === 'white' && isWhitePiece(piece)) ||
                 (currentPlayer === 'black' && isBlackPiece(piece)))) {
        selectedSquare = { row, col };
        validMoves = getValidMoves(row, col);
    } else {
        selectedSquare = null;
        validMoves = [];
    }
    
    drawBoard();
    drawHighlights();
    drawPieces();
}

// Reset game
function resetGame() {
    board = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
    ];
    currentPlayer = 'white';
    selectedSquare = null;
    validMoves = [];
    gameActive = true;
    whiteCaptured = [];
    blackCaptured = [];
    moveHistory = [];
    
    document.getElementById('turnIndicator').innerHTML = '<span>⚪</span> White\'s Turn';
    document.getElementById('status').innerHTML = '';
    updateCapturedDisplay();
    
    drawBoard();
    drawHighlights();
    drawPieces();
}

// Canvas click handler
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const col = Math.floor(x / squareSize);
    const row = Math.floor(y / squareSize);
    
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
        handleSquareClick(row, col);
    }
});

// Button listeners
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Initialize game
function init() {
    drawBoard();
    drawPieces();
}

init();

console.log('♜ Realistic Chess Game Loaded! Light green board with 3D pieces!');
