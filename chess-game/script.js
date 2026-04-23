// ========================================
// ULTRA-REALISTIC CHESS GAME
// Stunning 3D Chess Pieces | Light Green Board
// ========================================

const canvas = document.getElementById('chessCanvas');
const ctx = canvas.getContext('2d');
const squareSize = 80; // 640/8 = 80

// Board colors - Light green theme
const lightSquareColor = '#c8e6c9';
const darkSquareColor = '#4caf50';
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

// ========================================
// ULTRA-REALISTIC 3D PIECE DRAWING
// ========================================

// Create 3D gradient for pieces
function createPieceGradient(x, y, size, isWhite, isTop = false) {
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    if (isWhite) {
        if (isTop) {
            return ctx.createLinearGradient(centerX - size*0.15, centerY - size*0.3, centerX + size*0.15, centerY - size*0.1);
        }
        return ctx.createLinearGradient(centerX - size*0.2, centerY - size*0.2, centerX + size*0.2, centerY + size*0.3);
    } else {
        if (isTop) {
            return ctx.createLinearGradient(centerX - size*0.15, centerY - size*0.3, centerX + size*0.15, centerY - size*0.1);
        }
        return ctx.createLinearGradient(centerX - size*0.2, centerY - size*0.2, centerX + size*0.2, centerY + size*0.3);
    }
}

// Draw King - Majestic with ornate cross
function drawKing(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Base
    const baseGrad = createPieceGradient(x, y, size, isWhite);
    baseGrad.addColorStop(0, isWhite ? '#f0f0f0' : '#3a3a3a');
    baseGrad.addColorStop(1, isWhite ? '#c0c0c0' : '#1a1a1a');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = isWhite ? '#999' : '#555';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Body (tapered column)
    const bodyGrad = createPieceGradient(x, y, size, isWhite);
    bodyGrad.addColorStop(0, isWhite ? '#e8e8e8' : '#333');
    bodyGrad.addColorStop(1, isWhite ? '#b0b0b0' : '#1a1a1a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(cx - size*0.18, cy - size*0.05);
    ctx.lineTo(cx - size*0.22, cy + size*0.3);
    ctx.lineTo(cx + size*0.22, cy + size*0.3);
    ctx.lineTo(cx + size*0.18, cy - size*0.05);
    ctx.fill();
    ctx.stroke();
    
    // Neck
    ctx.beginPath();
    ctx.rect(cx - size*0.12, cy - size*0.22, size*0.24, size*0.2);
    ctx.fill();
    ctx.stroke();
    
    // Head (round)
    const headGrad = createPieceGradient(x, y, size, isWhite);
    headGrad.addColorStop(0, isWhite ? '#f5f5f5' : '#444');
    headGrad.addColorStop(1, isWhite ? '#d0d0d0' : '#2a2a2a');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.25, size*0.16, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Crown base
    ctx.fillStyle = isWhite ? '#ffd700' : '#ffaa00';
    ctx.beginPath();
    ctx.rect(cx - size*0.1, cy - size*0.4, size*0.2, size*0.12);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.stroke();
    
    // Crown cross (vertical)
    ctx.fillStyle = isWhite ? '#ffd700' : '#ffaa00';
    ctx.beginPath();
    ctx.rect(cx - size*0.04, cy - size*0.52, size*0.08, size*0.16);
    ctx.fill();
    ctx.stroke();
    
    // Crown cross (horizontal)
    ctx.beginPath();
    ctx.rect(cx - size*0.12, cy - size*0.48, size*0.24, size*0.08);
    ctx.fill();
    ctx.stroke();
    
    // Crown jewels
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.48, size*0.05, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.arc(cx - size*0.07, cy - size*0.44, size*0.03, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size*0.07, cy - size*0.44, size*0.03, 0, Math.PI*2);
    ctx.fill();
    
    // Highlight
    ctx.beginPath();
    ctx.arc(cx - size*0.05, cy - size*0.28, size*0.04, 0, Math.PI*2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Queen - Elegant with crown
function drawQueen(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Base
    const baseGrad = createPieceGradient(x, y, size, isWhite);
    baseGrad.addColorStop(0, isWhite ? '#f0f0f0' : '#3a3a3a');
    baseGrad.addColorStop(1, isWhite ? '#c0c0c0' : '#1a1a1a');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Body (elegant curve)
    const bodyGrad = createPieceGradient(x, y, size, isWhite);
    bodyGrad.addColorStop(0, isWhite ? '#e8e8e8' : '#333');
    bodyGrad.addColorStop(1, isWhite ? '#b0b0b0' : '#1a1a1a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(cx - size*0.16, cy - size*0.08);
    ctx.quadraticCurveTo(cx - size*0.22, cy + size*0.15, cx - size*0.2, cy + size*0.3);
    ctx.lineTo(cx + size*0.2, cy + size*0.3);
    ctx.quadraticCurveTo(cx + size*0.22, cy + size*0.15, cx + size*0.16, cy - size*0.08);
    ctx.fill();
    ctx.stroke();
    
    // Neck
    ctx.beginPath();
    ctx.rect(cx - size*0.1, cy - size*0.22, size*0.2, size*0.16);
    ctx.fill();
    ctx.stroke();
    
    // Head
    const headGrad = createPieceGradient(x, y, size, isWhite);
    headGrad.addColorStop(0, isWhite ? '#f5f5f5' : '#444');
    headGrad.addColorStop(1, isWhite ? '#d0d0d0' : '#2a2a2a');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.27, size*0.14, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Crown
    ctx.fillStyle = isWhite ? '#ffd700' : '#ffaa00';
    ctx.beginPath();
    ctx.rect(cx - size*0.12, cy - size*0.42, size*0.24, size*0.1);
    ctx.fill();
    ctx.stroke();
    
    // Crown spikes
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i*size*0.08, cy - size*0.42);
        ctx.lineTo(cx + i*size*0.12, cy - size*0.52);
        ctx.lineTo(cx + i*size*0.04, cy - size*0.42);
        ctx.fill();
        ctx.stroke();
    }
    
    // Center jewel
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.46, size*0.06, 0, Math.PI*2);
    ctx.fill();
    
    // Highlight
    ctx.beginPath();
    ctx.arc(cx - size*0.04, cy - size*0.3, size*0.03, 0, Math.PI*2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Rook - Castle with battlements
function drawRook(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Base
    const baseGrad = createPieceGradient(x, y, size, isWhite);
    baseGrad.addColorStop(0, isWhite ? '#f0f0f0' : '#3a3a3a');
    baseGrad.addColorStop(1, isWhite ? '#c0c0c0' : '#1a1a1a');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Tower body
    const bodyGrad = createPieceGradient(x, y, size, isWhite);
    bodyGrad.addColorStop(0, isWhite ? '#e0e0e0' : '#333');
    bodyGrad.addColorStop(1, isWhite ? '#a0a0a0' : '#1a1a1a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.rect(cx - size*0.2, cy - size*0.15, size*0.4, size*0.48);
    ctx.fill();
    ctx.stroke();
    
    // Top platform
    ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
    ctx.beginPath();
    ctx.rect(cx - size*0.22, cy - size*0.18, size*0.44, size*0.06);
    ctx.fill();
    ctx.stroke();
    
    // Battlements
    for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = isWhite ? '#e0e0e0' : '#333';
        ctx.beginPath();
        ctx.rect(cx + i*size*0.12 - size*0.06, cy - size*0.32, size*0.12, size*0.16);
        ctx.fill();
        ctx.stroke();
        
        // Top of battlement
        ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
        ctx.beginPath();
        ctx.rect(cx + i*size*0.12 - size*0.07, cy - size*0.35, size*0.14, size*0.05);
        ctx.fill();
        ctx.stroke();
    }
    
    // Center tower top
    ctx.fillStyle = isWhite ? '#d5d5d5' : '#2e2e2e';
    ctx.beginPath();
    ctx.rect(cx - size*0.08, cy - size*0.38, size*0.16, size*0.1);
    ctx.fill();
    ctx.stroke();
    
    // Highlight
    ctx.beginPath();
    ctx.rect(cx - size*0.12, cy - size*0.05, size*0.06, size*0.2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Bishop - Pointed hat with slit
function drawBishop(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Base
    const baseGrad = createPieceGradient(x, y, size, isWhite);
    baseGrad.addColorStop(0, isWhite ? '#f0f0f0' : '#3a3a3a');
    baseGrad.addColorStop(1, isWhite ? '#c0c0c0' : '#1a1a1a');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Body
    const bodyGrad = createPieceGradient(x, y, size, isWhite);
    bodyGrad.addColorStop(0, isWhite ? '#e8e8e8' : '#333');
    bodyGrad.addColorStop(1, isWhite ? '#b0b0b0' : '#1a1a1a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(cx - size*0.18, cy - size*0.05);
    ctx.lineTo(cx - size*0.22, cy + size*0.3);
    ctx.lineTo(cx + size*0.22, cy + size*0.3);
    ctx.lineTo(cx + size*0.18, cy - size*0.05);
    ctx.fill();
    ctx.stroke();
    
    // Neck
    ctx.beginPath();
    ctx.rect(cx - size*0.1, cy - size*0.2, size*0.2, size*0.18);
    ctx.fill();
    ctx.stroke();
    
    // Hat (cone shaped)
    const hatGrad = createPieceGradient(x, y, size, isWhite);
    hatGrad.addColorStop(0, isWhite ? '#e0e0e0' : '#3a3a3a');
    hatGrad.addColorStop(1, isWhite ? '#c0c0c0' : '#2a2a2a');
    ctx.fillStyle = hatGrad;
    ctx.beginPath();
    ctx.moveTo(cx - size*0.14, cy - size*0.22);
    ctx.lineTo(cx, cy - size*0.52);
    ctx.lineTo(cx + size*0.14, cy - size*0.22);
    ctx.fill();
    ctx.stroke();
    
    // Hat brim
    ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - size*0.24, size*0.18, size*0.06, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Slit in hat
    ctx.fillStyle = isWhite ? '#8B4513' : '#5a3a1a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - size*0.32, size*0.05, size*0.12, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Cross on top
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.rect(cx - size*0.03, cy - size*0.55, size*0.06, size*0.08);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(cx - size*0.1, cy - size*0.52, size*0.2, size*0.05);
    ctx.fill();
    
    // Highlight
    ctx.beginPath();
    ctx.arc(cx - size*0.05, cy - size*0.1, size*0.04, 0, Math.PI*2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Knight - Horse head with mane
function drawKnight(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Base
    const baseGrad = createPieceGradient(x, y, size, isWhite);
    baseGrad.addColorStop(0, isWhite ? '#f0f0f0' : '#3a3a3a');
    baseGrad.addColorStop(1, isWhite ? '#c0c0c0' : '#1a1a1a');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.32, size*0.28, size*0.1, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Body/Neck
    const bodyGrad = createPieceGradient(x, y, size, isWhite);
    bodyGrad.addColorStop(0, isWhite ? '#e0e0e0' : '#333');
    bodyGrad.addColorStop(1, isWhite ? '#a0a0a0' : '#1a1a1a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(cx - size*0.18, cy - size*0.05);
    ctx.lineTo(cx - size*0.22, cy + size*0.3);
    ctx.lineTo(cx + size*0.22, cy + size*0.3);
    ctx.lineTo(cx + size*0.18, cy - size*0.05);
    ctx.fill();
    ctx.stroke();
    
    // Horse head
    const headGrad = createPieceGradient(x, y, size, isWhite);
    headGrad.addColorStop(0, isWhite ? '#e8e8e8' : '#3a3a3a');
    headGrad.addColorStop(1, isWhite ? '#c8c8c8' : '#2a2a2a');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(cx - size*0.05, cy - size*0.45);
    ctx.quadraticCurveTo(cx + size*0.15, cy - size*0.4, cx + size*0.12, cy - size*0.2);
    ctx.quadraticCurveTo(cx + size*0.08, cy - size*0.05, cx, cy - size*0.05);
    ctx.fill();
    ctx.stroke();
    
    // Snout
    ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(cx + size*0.1, cy - size*0.32, size*0.08, size*0.06, 0.2, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + size*0.08, cy - size*0.38, size*0.04, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx + size*0.09, cy - size*0.38, size*0.02, 0, Math.PI*2);
    ctx.fill();
    
    // Ear
    ctx.fillStyle = isWhite ? '#d8d8d8' : '#323232';
    ctx.beginPath();
    ctx.moveTo(cx + size*0.05, cy - size*0.48);
    ctx.lineTo(cx, cy - size*0.56);
    ctx.lineTo(cx + size*0.1, cy - size*0.52);
    ctx.fill();
    ctx.stroke();
    
    // Mane
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = isWhite ? '#b0b0b0' : '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(cx - size*0.02 - i*size*0.02, cy - size*0.42 + i*size*0.04);
        ctx.lineTo(cx - size*0.12 - i*size*0.015, cy - size*0.38 + i*size*0.05);
        ctx.lineTo(cx - size*0.05 - i*size*0.01, cy - size*0.35 + i*size*0.04);
        ctx.fill();
    }
    
    // Nostril
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.arc(cx + size*0.13, cy - size*0.3, size*0.02, 0, Math.PI*2);
    ctx.fill();
    
    // Highlight
    ctx.beginPath();
    ctx.rect(cx - size*0.12, cy - size*0.02, size*0.06, size*0.15);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)';
    ctx.fill();
    
    ctx.restore();
}

// Draw Pawn - Simple but elegant
function drawPawn(x, y, size, isWhite) {
    const cx = x + size/2;
    const cy = y + size/2;
    
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Base
    const baseGrad = createPieceGradient(x, y, size, isWhite);
    baseGrad.addColorStop(0, isWhite ? '#f0f0f0' : '#3a3a3a');
    baseGrad.addColorStop(1, isWhite ? '#c0c0c0' : '#1a1a1a');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + size*0.32, size*0.24, size*0.09, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Body (tapered)
    const bodyGrad = createPieceGradient(x, y, size, isWhite);
    bodyGrad.addColorStop(0, isWhite ? '#e8e8e8' : '#333');
    bodyGrad.addColorStop(1, isWhite ? '#b0b0b0' : '#1a1a1a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(cx - size*0.14, cy - size*0.08);
    ctx.lineTo(cx - size*0.18, cy + size*0.28);
    ctx.lineTo(cx + size*0.18, cy + size*0.28);
    ctx.lineTo(cx + size*0.14, cy - size*0.08);
    ctx.fill();
    ctx.stroke();
    
    // Neck
    ctx.beginPath();
    ctx.rect(cx - size*0.08, cy - size*0.2, size*0.16, size*0.14);
    ctx.fill();
    ctx.stroke();
    
    // Head (ball)
    const headGrad = createPieceGradient(x, y, size, isWhite);
    headGrad.addColorStop(0, isWhite ? '#f5f5f5' : '#444');
    headGrad.addColorStop(1, isWhite ? '#d0d0d0' : '#2a2a2a');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - size*0.28, size*0.12, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Collar
    ctx.fillStyle = isWhite ? '#d0d0d0' : '#2a2a2a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - size*0.16, size*0.12, size*0.04, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Highlight on head
    ctx.beginPath();
    ctx.arc(cx - size*0.04, cy - size*0.32, size*0.04, 0, Math.PI*2);
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)';
    ctx.fill();
    
    ctx.restore();
}

// Main draw piece function
function drawPiece(piece, x, y, size) {
    if (!piece) return;
    
    const isWhite = '♔♕♖♗♘♙'.includes(piece);
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

// Helper functions
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

function isWhitePiece(piece) {
    return '♔♕♖♗♘♙'.includes(piece);
}

function isBlackPiece(piece) {
    return '♚♛♜♝♞♟'.includes(piece);
}

// ========================================
// GAME LOGIC
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

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = '';
    
    if (capturedPiece) {
        if (isWhitePiece(capturedPiece)) {
            whiteCaptured.push(capturedPiece);
        } else
