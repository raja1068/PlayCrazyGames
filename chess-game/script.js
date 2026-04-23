// SAFE INIT
let game;

try {
    game = new Chess();
} catch (e) {
    alert("Chess engine failed to load. Check internet/CDN.");
}

let selected = null;
let mode = 'offline';

function setMode(m) {
    mode = m;
    resetGame();
}

function renderBoard() {
    if (!game) return;

    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = '';

    const board = game.board();

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const sq = document.createElement("div");
            sq.className = "square " + ((i+j)%2===0 ? "light":"dark");

            const piece = board[i][j];
            if (piece) {
                sq.textContent = getPiece(piece);
            }

            sq.onclick = () => handleClick(i,j);
            boardDiv.appendChild(sq);
        }
    }

    document.getElementById("turn").innerText =
        game.turn() === 'w' ? "White's Turn" : "Black's Turn";
}

function handleClick(i,j) {
    if (!game) return;

    if (!selected) {
        selected = {row:i,col:j};
    } else {
        const move = {
            from: toSquare(selected.row, selected.col),
            to: toSquare(i, j),
            promotion: 'q'
        };

        const result = game.move(move);
        selected = null;

        if (result && mode === 'bot' && game.turn() === 'b') {
            setTimeout(randomBot, 300);
        }

        renderBoard();
    }
}

/* SIMPLE BOT (NO STOCKFISH → avoids crash) */
function randomBot() {
    const moves = game.moves();
    if (moves.length === 0) return;

    const move = moves[Math.floor(Math.random() * moves.length)];
    game.move(move);
    renderBoard();
}

/* HELPERS */

function toSquare(r,c){
    return String.fromCharCode(97+c) + (8-r);
}

function getPiece(p){
    const map = {
        p:'♟', r:'♜', n:'♞', b:'♝', q:'♛', k:'♚',
        P:'♙', R:'♖', N:'♘', B:'♗', Q:'♕', K:'♔'
    };
    return p.color === 'w' ? map[p.type.toUpperCase()] : map[p.type];
}

function resetGame(){
    game.reset();
    selected = null;
    document.getElementById("status").innerText='';
    renderBoard();
}

/* INIT */
setTimeout(() => {
    if (game) renderBoard();
}, 200);
