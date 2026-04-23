// ========================================
// COMPLETE WORKING CHESS GAME
// Beautiful Board | Clear Pieces | Full Logic
// ========================================

const canvas = document.getElementById('chessCanvas');
const ctx = canvas.getContext('2d');
const squareSize = 70; // 560/8 = 70

// Board colors
const lightSquareColor = '#f0d9b5';
const darkSquareColor = '#b58863';
const highlightColor = 'rgba(0, 255, 0, 0.4)';
const checkColor = 'rgba(255, 0, 0, 0.4)';
const selectedColor = 'rgba(255, 255, 0, 0.3)';

// Initial board setup
let board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

let currentPlayer = 'white';
let selectedSquare = null;
let validMoves = [];
let gameActive = true;
let whiteCaptured = [];
let blackCaptured = [];

// Piece display mapping
const pieceDisplay = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

// Helper functions
function isWhitePiece(piece) {
    return piece && piece === piece.toUpperCase() && piece !== '';
}

function isBlackPiece(piece) {
    return piece && piece !== piece.toUpperCase() && piece !== '';
}

function getPieceType(piece) {
    if (!piece) return null;
    const type = piece.toLowerCase();
    const typeMap = {
        'k': 'king', 'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight', 'p': 'pawn'
    };
    return typeMap[type];
}

// ========================================
// DRAW CHESS BOARD
// ========================================
function drawBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const x = col * squareSize;
            const y = row * squareSize;
            const isLight = (row + col) % 2 === 0;
            
            ctx.fillStyle = isLight ? lightSquareColor : darkSquareColor;
            ctx.fillRect(x, y, squareSize, squareSize);
            
            // Border
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, squareSize, squareSize);
        }
    }
    
    // Coordinates
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#654321';
    for (let i = 0; i < 8; i++) {
        ctx.fillText(String.fromCharCode(65 + i), i * squareSize + 5, squareSize - 8);
        ctx.fillText(8 - i, 5, i * squareSize + 20);
    }
}

// ========================================
// DRAW 3D CHESS PIECES
// ========================================
function drawPiece(piece, x, y, size) {
    if (!piece) return;
    
    const cx = x + size/2;
    const cy = y + size/2;
    const isWhite = isWhitePiece(piece);
    const pieceType = getPieceType(piece);
    
    ctx.save();
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Base color
    const mainColor = isWhite ? '#f8f8f8' : '#2c2c2c';
    const darkColor = isWhite ? '#c0c0c0' : '#1a1a1a';
    const accentColor = isWhite ? '#e0e0e0' : '#3a3a3a';
    
    // Draw based on piece type
    if (pieceType === 'king') {
        // Base
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Body
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.rect(cx - size*0.18, cy - size*0.1, size*0.36, size*0.42);
        ctx.fill();
        ctx.stroke();
        
        // Head
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(cx, cy - size*0.28, size*0.16, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Crown
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.rect(cx - size*0.12, cy - size*0.44, size*0.24, size*0.1);
        ctx.fill();
        
        // Cross
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - size*0.04, cy - size*0.56, size*0.08, size*0.14);
        ctx.fillRect(cx - size*0.12, cy - size*0.52, size*0.24, size*0.06);
        
    } else if (pieceType === 'queen') {
        // Base
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Body
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.rect(cx - size*0.16, cy - size*0.08, size*0.32, size*0.4);
        ctx.fill();
        ctx.stroke();
        
        // Head
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(cx, cy - size*0.28, size*0.14, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Crown
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.rect(cx - size*0.14, cy - size*0.42, size*0.28, size*0.1);
        ctx.fill();
        for (let i = -1; i <= 1; i++) {
            ctx.fillRect(cx + i*size*0.1 - size*0.03, cy - size*0.52, size*0.06, size*0.12);
        }
        
    } else if (pieceType === 'rook') {
        // Base
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Tower
        ctx.fillStyle = accentColor;
        ctx.fillRect(cx - size*0.2, cy - size*0.15, size*0.4, size*0.47);
        ctx.strokeRect(cx - size*0.2, cy - size*0.15, size*0.4, size*0.47);
        
        // Battlements
        ctx.fillStyle = mainColor;
        for (let i = -1; i <= 1; i++) {
            ctx.fillRect(cx + i*size*0.13 - size*0.06, cy - size*0.32, size*0.12, size*0.18);
            ctx.strokeRect(cx + i*size*0.13 - size*0.06, cy - size*0.32, size*0.12, size*0.18);
        }
        
    } else if (pieceType === 'bishop') {
        // Base
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Body
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(cx - size*0.16, cy - size*0.08);
        ctx.lineTo(cx - size*0.2, cy + size*0.3);
        ctx.lineTo(cx + size*0.2, cy + size*0.3);
        ctx.lineTo(cx + size*0.16, cy - size*0.08);
        ctx.fill();
        ctx.stroke();
        
        // Hat
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(cx - size*0.12, cy - size*0.25);
        ctx.lineTo(cx, cy - size*0.55);
        ctx.lineTo(cx + size*0.12, cy - size*0.25);
        ctx.fill();
        ctx.stroke();
        
        // Slit
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(cx, cy - size*0.38, size*0.04, size*0.1, 0, 0, Math.PI*2);
        ctx.fill();
        
    } else if (pieceType === 'knight') {
        // Base
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Body
        ctx.fillStyle = accentColor;
        ctx.fillRect(cx - size*0.16, cy - size*0.08, size*0.32, size*0.4);
        ctx.strokeRect(cx - size*0.16, cy - size*0.08, size*0.32, size*0.4);
        
        // Horse head
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size*0.45);
        ctx.quadraticCurveTo(cx + size*0.12, cy - size*0.38, cx + size*0.1, cy - size*0.2);
        ctx.quadraticCurveTo(cx + size*0.05, cy - size*0.08, cx, cy - size*0.05);
        ctx.fill();
        ctx.stroke();
        
        // Mane
        ctx.fillStyle = darkColor;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(cx - size*0.08 - i*size*0.02, cy - size*0.35 + i*size*0.05, size*0.04, size*0.06);
        }
        
        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + size*0.05, cy - size*0.32, size*0.03, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx + size*0.06, cy - size*0.32, size*0.015, 0, Math.PI*2);
        ctx.fill();
        
    } else if (pieceType === 'pawn') {
        // Base
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy + size*0.32, size*0.24, size*0.09, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Body
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(cx - size*0.12, cy - size*0.05);
        ctx.lineTo(cx - size*0.16, cy + size*0.28);
        ctx.lineTo(cx + size*0.16, cy + size*0.28);
        ctx.lineTo(cx + size*0.12, cy - size*0.05);
        ctx.fill();
        ctx.stroke();
        
        // Head
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(cx, cy - size*0.25, size*0.12, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Collar
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy - size*0.13, size*0.1, size*0.04, 0, 0, Math.PI*2);
        ctx.fill();
    }
    
    ctx.restore();
}

// ========================================
// DRAW HIGHLIGHTS
// ========================================
function drawHighlights() {
    if (selectedSquare) {
        const { row, col } = selectedSquare;
        const x = col * squareSize;
        const y = row * squareSize;
        ctx.fillStyle = selectedColor;
        ctx.fillRect(x, y, squareSize, squareSize);
    }
    
    for (const move of validMoves) {
        const x = move.col * squareSize;
        const y = move.row * squareSize;
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, y, squareSize, squareSize);
        
        // Draw dot for capture moves
        if (board[move.row][move.col]) {
            ctx.beginPath();
            ctx.arc(x + squareSize/2, y + squareSize/2, squareSize/5, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,0,0,0.6)';
            ctx.fill();
        }
    }
    
    // Highlight king in check
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece === 'K' && isKingInCheck('white')) {
                const x = col * squareSize;
                const y = row * squareSize;
                ctx.fillStyle = checkColor;
                ctx.fillRect(x, y, squareSize, squareSize);
            }
            if (piece === 'k' && isKingInCheck('black')) {
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

// Main render function
function render() {
    drawBoard();
    drawHighlights();
    drawPieces();
}

// ========================================
// GAME LOGIC
// ========================================

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
            
            // Move forward
            if (colDiff === 0 && rowDiff === direction && !targetPiece) return true;
            // Double move from start
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

function isKingInCheck(color) {
    const king = color === 'white' ? 'K' : 'k';
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

function isCheckmate() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && ((currentPlayer === 'white' && isWhitePiece(piece)) ||
                         (currentPlayer === 'black' && isBlackPiece(piece)))) {
                const moves = getValidMoves(i, j);
                for (const move of moves) {
                    const tempPiece = board[move.row][move.col];
                    const currentPiece = board[i][j];
                    board[move.row][move.col] = currentPiece;
                    board[i][j] = '';
                    const stillInCheck = isKingInCheck(currentPlayer);
                    board[i][j] = currentPiece;
                    board[move.row][move.col] = tempPiece;
                    
                    if (!stillInCheck) return false;
                }
            }
        }
    }
    return true;
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = '';
    
    if (capturedPiece) {
        if (isWhitePiece(capturedPiece)) {
            whiteCaptured.push(capturedPiece);
        } else {
            blackCaptured.push(capturedPiece);
        }
        document.getElementById('whiteCaptured').textContent = whiteCaptured.length;
        document.getElementById('blackCaptured').textContent = blackCaptured.length;
    }
    
    if (isKingInCheck(currentPlayer)) {
        board[fromRow][fromCol] = piece;
        board[toRow][toCol] = capturedPiece;
        if (capturedPiece) {
            if (isWhitePiece(capturedPiece)) {
                whiteCaptured.pop();
            } else {
                blackCaptured.pop();
            }
            document.getElementById('whiteCaptured').textContent = whiteCaptured.length;
            document.getElementById('blackCaptured').textContent = blackCaptured.length;
        }
        return false;
    }
    
    return true;
}

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
    } else {
        document.getElementById('status').innerHTML = '';
    }
}

function handleSquareClick(row, col) {
    if (!gameActive) return;
    
    // Check if a move is selected
    const move = validMoves.find(m => m.row === row && m.col === col);
    if (move && selectedSquare) {
        if (makeMove(selectedSquare.row, selectedSquare.col, row, col)) {
            selectedSquare = null;
            validMoves = [];
            render();
            switchTurn();
            render();
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
    
    render();
}

function resetGame() {
    board = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    currentPlayer = 'white';
    selectedSquare = null;
    validMoves = [];
    gameActive = true;
    whiteCaptured = [];
    blackCaptured = [];
    
    document.getElementById('turnIndicator').innerHTML = '<span>⚪</span> White\'s Turn';
    document.getElementById('status').innerHTML = '';
    document.getElementById('whiteCaptured').textContent = '0';
    document.getElementById('blackCaptured').textContent = '0';
    
    render();
}

// ========================================
// EVENT HANDLERS
// ========================================
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

document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Initialize
render();
console.log('♜ Chess Game Loaded!');
