const game = new Chess();

let selected = null;
let mode = 'offline';

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
            const square = document.createElement("div");
            square.className = "square " + ((i+j)%2===0 ? "light":"dark");

            const piece = board[i][j];
            if (piece) {
                square.textContent = pieceUnicode(piece);
            }

            if (selected && selected.row === i && selected.col === j) {
                square.classList.add("selected");
            }

            square.addEventListener("click", () => handleClick(i, j));
            boardDiv.appendChild(square);
        }
    }

    document.getElementById("turn").innerText =
        game.turn() === 'w' ? "White's Turn" : "Black's Turn";

    if (game.in_checkmate()) {
        document.getElementById("status").innerText = "Checkmate!";
    }
}

function handleClick(i, j) {
    if (!selected) {
        selected = {row: i, col: j};
    } else {
        const move = {
            from: coordToSquare(selected.row, selected.col),
            to: coordToSquare(i, j),
            promotion: 'q'
        };

        const result = game.move(move);
        selected = null;

        if (result && mode === 'bot' && game.turn() === 'b') {
            setTimeout(botMove, 300);
        }

        renderBoard();
    }
}

function botMove() {
    engine.postMessage("position fen " + game.fen());
    engine.postMessage("go depth 10");

    engine.onmessage = function(e) {
        if (e.data.startsWith("bestmove")) {
            const move = e.data.split(" ")[1];

            game.move({
                from: move.substring(0,2),
                to: move.substring(2,4),
                promotion: 'q'
            });

            renderBoard();
        }
    };
}

/* HELPERS */

function coordToSquare(r,c){
    return String.fromCharCode(97+c) + (8-r);
}

function pieceUnicode(p){
    const map = {
        p:'♟', r:'♜', n:'♞', b:'♝', q:'♛', k:'♚',
        P:'♙', R:'♖', N:'♘', B:'♗', Q:'♕', K:'♔'
    };
    return p.color === 'w' ? map[p.type.toUpperCase()] : map[p.type];
}

function resetGame(){
    game.reset();
    selected = null;
    document.getElementById("status").innerText = "";
    renderBoard();
}

renderBoard();
