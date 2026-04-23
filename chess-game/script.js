// ========================================
// REALISTIC CHESS GAME - BIGGER PIECES
// Beautiful 1st Version Style | Larger Size
// Light Green Board | Detailed 3D Pieces
// ========================================

const canvas = document.getElementById('chessCanvas');
const ctx = canvas.getContext('2d');
const squareSize = 80; // 640/8 = 80

// Board colors - Light green theme
const lightSquareColor = '#c8e6c9';
const darkSquareColor = '#66bb6a';
const highlightColor = 'rgba(255, 193, 7, 0.5)';
const checkColor = 'rgba(244, 67, 54, 0.5)';

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

let currentPlayer = 'white';
let selectedSquare = null;
let validMoves = [];
let gameActive = true;
let whiteCaptured = [];
let blackCaptured = [];

// Helper functions
function isWhitePiece(piece) {
    return '♔♕♖♗♘♙'.includes(piece);
}

function isBlackPiece(piece) {
    return '♚♛♜♝♞♟'.includes(piece);
}

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

// ========================================
// BIGGER REALISTIC 3D PIECE DRAWING
// ========================================

// Draw King - Majestic with ornate cross (LARGER)
function drawKing(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Larger Base
    ctx.fillStyle = isWhite ? '#f5f5f5' : '#2a2a2a';
    ctx.strokeStyle = isWhite ? '#999' : '#444';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.35, size*0.32, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Larger Body (tapered column)
    ctx.fillStyle = isWhite ? '#e8e8e8' : '#333';
    ctx.beginPath();
    ctx.moveTo(cx - size*0.22, cy - size*0.08);
    ctx.lineTo(cx - size*0.25, cy + size*0.32);
    ctx.lineTo(cx + size*0.25, cy + size*0.32);
    ctx.lineTo(cx + size*0.22, cy - size*0.08);
    ctx.fill();
    ctx.stroke();
    
    // Larger Neck
    ctx.fillStyle = isWhite ? '#e0e0e0' : '#3a3a3a';
    ctx.beginPath();
    ctx.rect(cx - size*0.15, cy - size*0.28, size*0.3, size*0.22);
    ctx.fill();
    ctx.stroke();
    
    // Larger Head
    ctx.fillStyle = isWhite ? '#f0f0f0' : '#404040';
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.3, size*0.19, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Crown base
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.rect(cx - size*0.13, cy - size*0.48, size*0.26, size*0.14);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.stroke();
    
    // Crown cross (vertical - larger)
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.rect(cx - size*0.05, cy - size*0.62, size*0.1, size*0.18);
    ctx.fill();
    ctx.stroke();
    
    // Crown cross (horizontal - larger)
    ctx.beginPath();
    ctx.rect(cx - size*0.15, cy - size*0.57, size*0.3, size*0.09);
    ctx.fill();
    ctx.stroke();
    
    // Crown jewels
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.57, size*0.06, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.arc(cx - size*0.09, cy - size*0.52, size*0.04, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size*0.09, cy - size*0.52, size*0.04, 0, Math.PI*2);
    ctx.fill();
    
    // Highlight
    ctx.beginPath();
    ctx.arc(cx - size*0.06, cy - size*0.35, size*0.05, 0, Math.PI*2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Queen - Elegant with crown (LARGER)
function drawQueen(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Larger Base
    ctx.fillStyle = isWhite ? '#f5f5f5' : '#2a2a2a';
    ctx.strokeStyle = isWhite ? '#999' : '#444';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.35, size*0.32, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Larger Body (elegant curve)
    ctx.fillStyle = isWhite ? '#e8e8e8' : '#333';
    ctx.beginPath();
    ctx.moveTo(cx - size*0.2, cy - size*0.1);
    ctx.quadraticCurveTo(cx - size*0.26, cy + size*0.15, cx - size*0.23, cy + size*0.32);
    ctx.lineTo(cx + size*0.23, cy + size*0.32);
    ctx.quadraticCurveTo(cx + size*0.26, cy + size*0.15, cx + size*0.2, cy - size*0.1);
    ctx.fill();
    ctx.stroke();
    
    // Larger Neck
    ctx.fillStyle = isWhite ? '#e0e0e0' : '#3a3a3a';
    ctx.beginPath();
    ctx.rect(cx - size*0.13, cy - size*0.28, size*0.26, size*0.2);
    ctx.fill();
    ctx.stroke();
    
    // Larger Head
    ctx.fillStyle = isWhite ? '#f0f0f0' : '#404040';
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.32, size*0.17, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Crown
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.rect(cx - size*0.15, cy - size*0.5, size*0.3, size*0.12);
    ctx.fill();
    ctx.stroke();
    
    // Crown spikes (larger)
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i*size*0.1, cy - size*0.5);
        ctx.lineTo(cx + i*size*0.15, cy - size*0.62);
        ctx.lineTo(cx + i*size*0.05, cy - size*0.5);
        ctx.fill();
        ctx.stroke();
    }
    
    // Center jewel
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.55, size*0.07, 0, Math.PI*2);
    ctx.fill();
    
    // Highlight
    ctx.beginPath();
    ctx.arc(cx - size*0.05, cy - size*0.35, size*0.04, 0, Math.PI*2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Rook - Castle with battlements (LARGER)
function drawRook(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Larger Base
    ctx.fillStyle = isWhite ? '#f5f5f5' : '#2a2a2a';
    ctx.strokeStyle = isWhite ? '#999' : '#444';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.35, size*0.32, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Larger Tower body
    ctx.fillStyle = isWhite ? '#e0e0e0' : '#333';
    ctx.beginPath();
    ctx.rect(cx - size*0.25, cy - size*0.18, size*0.5, size*0.53);
    ctx.fill();
    ctx.stroke();
    
    // Larger Top platform
    ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
    ctx.beginPath();
    ctx.rect(cx - size*0.28, cy - size*0.22, size*0.56, size*0.08);
    ctx.fill();
    ctx.stroke();
    
    // Battlements (larger)
    for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = isWhite ? '#e0e0e0' : '#333';
        ctx.beginPath();
        ctx.rect(cx + i*size*0.15 - size*0.08, cy - size*0.4, size*0.16, size*0.2);
        ctx.fill();
        ctx.stroke();
        
        // Top of battlement
        ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
        ctx.beginPath();
        ctx.rect(cx + i*size*0.15 - size*0.09, cy - size*0.44, size*0.18, size*0.06);
        ctx.fill();
        ctx.stroke();
    }
    
    // Center tower top
    ctx.fillStyle = isWhite ? '#d5d5d5' : '#2e2e2e';
    ctx.beginPath();
    ctx.rect(cx - size*0.1, cy - size*0.48, size*0.2, size*0.12);
    ctx.fill();
    ctx.stroke();
    
    // Highlight
    ctx.beginPath();
    ctx.rect(cx - size*0.15, cy - size*0.05, size*0.08, size*0.25);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Bishop - Pointed hat with slit (LARGER)
function drawBishop(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Larger Base
    ctx.fillStyle = isWhite ? '#f5f5f5' : '#2a2a2a';
    ctx.strokeStyle = isWhite ? '#999' : '#444';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.35, size*0.32, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Larger Body
    ctx.fillStyle = isWhite ? '#e8e8e8' : '#333';
    ctx.beginPath();
    ctx.moveTo(cx - size*0.22, cy - size*0.08);
    ctx.lineTo(cx - size*0.26, cy + size*0.32);
    ctx.lineTo(cx + size*0.26, cy + size*0.32);
    ctx.lineTo(cx + size*0.22, cy - size*0.08);
    ctx.fill();
    ctx.stroke();
    
    // Larger Neck
    ctx.fillStyle = isWhite ? '#e0e0e0' : '#3a3a3a';
    ctx.beginPath();
    ctx.rect(cx - size*0.13, cy - size*0.25, size*0.26, size*0.2);
    ctx.fill();
    ctx.stroke();
    
    // Larger Hat (cone shaped)
    ctx.fillStyle = isWhite ? '#e0e0e0' : '#3a3a3a';
    ctx.beginPath();
    ctx.moveTo(cx - size*0.18, cy - size*0.28);
    ctx.lineTo(cx, cy - size*0.65);
    ctx.lineTo(cx + size*0.18, cy - size*0.28);
    ctx.fill();
    ctx.stroke();
    
    // Hat brim
    ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - size*0.3, size*0.22, size*0.07, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Slit in hat
    ctx.fillStyle = isWhite ? '#8B4513' : '#5a3a1a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - size*0.42, size*0.07, size*0.15, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Cross on top
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.rect(cx - size*0.04, cy - size*0.7, size*0.08, size*0.1);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(cx - size*0.13, cy - size*0.66, size*0.26, size*0.06);
    ctx.fill();
    
    // Highlight
    ctx.beginPath();
    ctx.arc(cx - size*0.06, cy - size*0.12, size*0.05, 0, Math.PI*2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Knight - Horse head with mane (LARGER)
function drawKnight(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Larger Base
    ctx.fillStyle = isWhite ? '#f5f5f5' : '#2a2a2a';
    ctx.strokeStyle = isWhite ? '#999' : '#444';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.35, size*0.32, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Larger Body/Neck
    ctx.fillStyle = isWhite ? '#e0e0e0' : '#333';
    ctx.beginPath();
    ctx.moveTo(cx - size*0.22, cy - size*0.08);
    ctx.lineTo(cx - size*0.26, cy + size*0.32);
    ctx.lineTo(cx + size*0.26, cy + size*0.32);
    ctx.lineTo(cx + size*0.22, cy - size*0.08);
    ctx.fill();
    ctx.stroke();
    
    // Larger Horse head
    ctx.fillStyle = isWhite ? '#e8e8e8' : '#3a3a3a';
    ctx.beginPath();
    ctx.moveTo(cx - size*0.08, cy - size*0.55);
    ctx.quadraticCurveTo(cx + size*0.2, cy - size*0.48, cx + size*0.16, cy - size*0.22);
    ctx.quadraticCurveTo(cx + size*0.1, cy - size*0.05, cx, cy - size*0.05);
    ctx.fill();
    ctx.stroke();
    
    // Snout
    ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(cx + size*0.13, cy - size*0.4, size*0.1, size*0.08, 0.2, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + size*0.1, cy - size*0.47, size*0.05, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx + size*0.11, cy - size*0.47, size*0.025, 0, Math.PI*2);
    ctx.fill();
    
    // Ear
    ctx.fillStyle = isWhite ? '#d8d8d8' : '#323232';
    ctx.beginPath();
    ctx.moveTo(cx + size*0.06, cy - size*0.6);
    ctx.lineTo(cx, cy - size*0.7);
    ctx.lineTo(cx + size*0.12, cy - size*0.65);
    ctx.fill();
    ctx.stroke();
    
    // Mane
    for (let i = 0; i < 6; i++) {
        ctx.fillStyle = isWhite ? '#b0b0b0' : '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(cx - size*0.03 - i*size*0.025, cy - size*0.52 + i*size*0.05);
        ctx.lineTo(cx - size*0.16 - i*size*0.02, cy - size*0.46 + i*size*0.06);
        ctx.lineTo(cx - size*0.07 - i*size*0.015, cy - size*0.43 + i*size*0.05);
        ctx.fill();
    }
    
    // Nostril
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.arc(cx + size*0.17, cy - size*0.36, size*0.025, 0, Math.PI*2);
    ctx.fill();
    
    // Highlight
    ctx.beginPath();
    ctx.rect(cx - size*0.15, cy - size*0.02, size*0.08, size*0.18);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Pawn - Simple but elegant (LARGER)
function drawPawn(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Larger Base
    ctx.fillStyle = isWhite ? '#f5f5f5' : '#2a2a2a';
    ctx.strokeStyle = isWhite ? '#999' : '#444';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.35, size*0.28, size*0.1, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Larger Body
    ctx.fillStyle = isWhite ? '#e8e8e8' : '#333';
    ctx.beginPath();
    ctx.moveTo(cx - size*0.18, cy - size*0.1);
    ctx.lineTo(cx - size*0.22, cy + size*0.32);
    ctx.lineTo(cx + size*0.22, cy + size*0.32);
    ctx.lineTo(cx + size*0.18, cy - size*0.1);
    ctx.fill();
    ctx.stroke();
    
    // Larger Neck
    ctx.fillStyle = isWhite ? '#e0e0e0' : '#3a3a3a';
    ctx.beginPath();
    ctx.rect(cx - size*0.1, cy - size*0.25, size*0.2, size*0.17);
    ctx.fill();
    ctx.stroke();
    
    // Larger Head (ball)
    ctx.fillStyle = isWhite ? '#f0f0f0' : '#404040';
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.35, size*0.16, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Collar
    ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - size*0.2, size*0.15, size*0.05, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Highlight on head
    ctx.beginPath();
    ctx.arc(cx - size*0.05, cy - size*0.4, size*0.05, 0, Math.PI*2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
    ctx.fill();
    
    ctx.restore();
}

// Main draw piece function
function drawPiece(piece, x, y, size) {
    if (!piece) return;
    
    const isWhite = isWhitePiece(piece);
    const pieceType = getPieceType(piece);
    
    switch(pieceType) {
        case 'king':
            drawKing(x, y, size, isWhite);
            break;
        case 'queen':
            drawQueen(x, y, size, isWhite);
            break;
        case 'rook':
            drawRook(x, y, size, isWhite);
            break;
        case 'bishop':
            drawBishop(x, y, size, isWhite);
            break;
        case 'knight':
            drawKnight(x, y, size, isWhite);
            break;
        case 'pawn':
            drawPawn(x, y, size, isWhite);
            break;
    }
}

// ========================================
// BOARD DRAWING FUNCTIONS
// ========================================

// Draw the chess board
function drawBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const x = col * squareSize;
            const y = row * squareSize;
            
            const isLight = (row + col) % 2 === 0;
            ctx.fillStyle = isLight ? lightSquareColor : darkSquareColor;
            ctx.fillRect(x, y, squareSize, squareSize);
            
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

// ========================================
// GAME LOGIC FUNCTIONS
// ========================================

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

function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
    const targetPiece = board[toRow][toCol];
    
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
            if (colDiff === 0 && rowDiff === direction && !targetPiece) return true;
            if (colDiff === 0 && rowDiff === 2 * direction && fromRow === startRow && !targetPiece && !board[fromRow + direction][fromCol]) return true;
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

function isCheckmate() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && ((currentPlayer === 'white' && isWhitePiece(piece)) ||
                         (currentPlayer === 'black' && isBlackPiece(piece)))) {
                const moves = getValidMoves(i, j);
                for (const move of moves) {
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
        updateCapturedDisplay();
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

function switchTurn() {
    currentPlayer = currentPlayer === 'white' ? 'black' :
