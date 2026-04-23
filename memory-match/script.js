const icons = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let canFlip = true;

const grid = document.getElementById('grid');
const movesSpan = document.getElementById('moves');
const matchesSpan = document.getElementById('matches');

function initGame() {
    // Double the icons and shuffle
    let deck = [...icons, ...icons];
    cards = shuffle(deck);
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    canFlip = true;
    movesSpan.textContent = moves;
    matchesSpan.textContent = matchedPairs;
    renderGrid();
}

function shuffle(array) {
    for(let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function renderGrid() {
    grid.innerHTML = '';
    cards.forEach((icon, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-index', index);
        
        // Show icon if card is flipped or matched
        if(flippedCards.includes(index) || cards[index] === 'matched') {
            card.textContent = icon;
            card.classList.add('flipped');
        }
        
        if(cards[index] === 'matched') {
            card.classList.add('matched');
        }
        
        card.addEventListener('click', () => flipCard(index));
        grid.appendChild(card);
    });
}

function flipCard(index) {
    if(!canFlip) return;
    if(flippedCards.includes(index)) return;
    if(cards[index] === 'matched') return;
    
    flippedCards.push(index);
    renderGrid();
    
    if(flippedCards.length === 2) {
        moves++;
        movesSpan.textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    const icon1 = cards[card1];
    const icon2 = cards[card2];
    
    if(icon1 === icon2) {
        // Match found
        cards[card1] = 'matched';
        cards[card2] = 'matched';
        matchedPairs++;
        matchesSpan.textContent = matchedPairs;
        flippedCards = [];
        
        if(matchedPairs === icons.length) {
            setTimeout(() => {
                alert(`Congratulations! You won in ${moves} moves! 🎉`);
            }, 100);
        }
    } else {
        // No match
        canFlip = false;
        setTimeout(() => {
            flippedCards = [];
            renderGrid();
            canFlip = true;
        }, 1000);
    }
}

document.getElementById('resetBtn').addEventListener('click', initGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

initGame();
