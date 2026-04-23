const game = new Chess();

let selected = null;
let mode = 'offline';

/* Stockfish */
let engine = new Worker("https://cdn.jsdelivr.net/npm/stockfish/stockfish.js");

function setMode(m) {
    mode = m;
    resetGame();
}

function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = '';

    const board = game.board();

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const sq = document.createElement("div");
            sq.className = "square " + ((i+j)%2===0 ? "light":"dark");

            const piece = board[i][j];
            if (piece) {
                sq.textContent = pieceToUnicode(piece);
            }

            if (selected && selected.row===i && selected.col===j) {
                sq.classList.add("selected");
            }

            sq.onclick = () => handleClick(i,j);
            boardDiv.appendChild(sq);
        }
    }

    document.getElementById("turn").innerText =
        game.turn() === 'w' ? "White's Turn" : "Black's Turn";

    if (game.in_checkmate()) {
        document.getElementById("status").innerText = "Checkmate!";
    }
}

function handleClick(i,j) {
    const board = game.board();

    if (!selected) {
        if (board[i][j]) {
            selected = {row:i,col:j};
        }
    } else {
        const move = {
            from: coordsToSquare(selected.row, selected.col),
            to: coordsToSquare(i,j),
            promotion: 'q'
        };

        const result = game.move(move);

        selected = null;

        if (result && mode === 'bot' && game.turn() === 'b') {
            setTimeout(botMove, 400);
        }

        renderBoard();
    }
}

function botMove() {
    engine.postMessage("position fen " + game.fen());
    engine.postMessage("go depth 12");

    engine.onmessage = function(e) {
        if (e.data.startsWith("bestmove")) {
            let move = e.data.split(" ")[1];

            game.move({
                from: move.substring(0,2),
                to: move.substring(2,4),
                promotion: 'q'
            });

            renderBoard();
        }
    };
}

/* Helpers */

function coordsToSquare(r,c){
    return String.fromCharCode(97+c) + (8-r);
}

function pieceToUnicode(p){
    const map = {
        'p':'♟','r':'♜','n':'♞','b':'♝','q':'♛','k':'♚',
        'P':'♙','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔'
    };
    return map[p.color === 'w' ? p.type.toUpperCase() : p.type];
}

function resetGame(){
    game.reset();
    selected = null;
    document.getElementById("status").innerText='';
    renderBoard();
}

renderBoard();
