const initialBoard = [
['♜','♞','♝','♛','♚','♝','♞','♜'],
['♟','♟','♟','♟','♟','♟','♟','♟'],
['','','','','','','',''],
['','','','','','','',''],
['','','','','','','',''],
['','','','','','','',''],
['♙','♙','♙','♙','♙','♙','♙','♙'],
['♖','♘','♗','♕','♔','♗','♘','♖']
];

let board = JSON.parse(JSON.stringify(initialBoard));
let currentPlayer = 'white';
let selected = null;
let mode = 'offline';

/* Stockfish */
let engine = new Worker("https://cdn.jsdelivr.net/npm/stockfish/stockfish.js");

function setMode(m) {
    mode = m;
    resetGame();

    if (m === 'online') {
        alert("Online mode requires backend (Firebase).");
    }
}

function renderBoard() {
    const boardDiv = document.getElementById("board");
    boardDiv.innerHTML = '';

    board.forEach((row, i) => {
        row.forEach((cell, j) => {
            const sq = document.createElement("div");
            sq.className = "square " + ((i+j)%2===0 ? "light":"dark");
            sq.textContent = cell;

            if (selected && selected.row===i && selected.col===j) {
                sq.classList.add("selected");
            }

            sq.onclick = () => handleClick(i,j);
            boardDiv.appendChild(sq);
        });
    });
}

function handleClick(i,j) {
    if (!selected) {
        if (board[i][j] !== '') {
            selected = {row:i,col:j};
        }
    } else {
        movePiece(selected.row, selected.col, i, j);
        selected = null;

        if (mode === 'bot' && currentPlayer === 'black') {
            setTimeout(botMove, 500);
        }
    }
    renderBoard();
}

function movePiece(fr,fc,tr,tc) {
    board[tr][tc] = board[fr][fc];
    board[fr][fc] = '';

    currentPlayer = currentPlayer==='white'?'black':'white';

    document.getElementById("turn").innerText =
        currentPlayer==="white"?"White's Turn":"Black's Turn";
}

/* AI MOVE */
function botMove() {
    const fen = boardToFEN();

    engine.postMessage("position fen " + fen);
    engine.postMessage("go depth 10");

    engine.onmessage = function(e) {
        if (e.data.startsWith("bestmove")) {
            let move = e.data.split(" ")[1];

            let fc = move.charCodeAt(0)-97;
            let fr = 8 - move[1];
            let tc = move.charCodeAt(2)-97;
            let tr = 8 - move[3];

            movePiece(fr,fc,tr,tc);
            renderBoard();
        }
    };
}

/* FEN */
function boardToFEN() {
    let fen='';

    for(let i=0;i<8;i++){
        let empty=0;
        for(let j=0;j<8;j++){
            let p=board[i][j];
            if(p===''){ empty++; }
            else{
                if(empty>0){ fen+=empty; empty=0; }
                fen+=mapFen(p);
            }
        }
        if(empty>0) fen+=empty;
        if(i!==7) fen+='/';
    }

    fen += currentPlayer==='white'?' w ':' b ';
    fen += '- - 0 1';

    return fen;
}

function mapFen(p){
    return {
        '♙':'P','♖':'R','♘':'N','♗':'B','♕':'Q','♔':'K',
        '♟':'p','♜':'r','♞':'n','♝':'b','♛':'q','♚':'k'
    }[p];
}

function resetGame(){
    board = JSON.parse(JSON.stringify(initialBoard));
    currentPlayer='white';
    selected=null;

    document.getElementById("turn").innerText="White's Turn";
    renderBoard();
}

renderBoard();
