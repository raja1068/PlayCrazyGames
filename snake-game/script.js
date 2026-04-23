// ========================================
// SNAKE GAME - LIGHT GREEN BOARD
// DARK ORANGE TEXT - FULLY FUNCTIONAL
// ========================================

// Get canvas elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE; // 500/20 = 25
const TILE_SIZE = GRID_SIZE;

// Game Variables
let snake = [];
let direction = { x: 0, y: 0 };
let food = {};
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = true;
let gameLoopInterval = null;
let gameSpeed = 100;

// Initialize high score display
document.getElementById('highScore').textContent = highScore;

// ========================================
// INITIALIZE GAME
// ========================================
function initGame() {
    snake = [
        { x: 12, y: 12 },
        { x: 11, y: 12 },
        { x: 10, y: 12 }
    ];
    direction = { x: 1, y: 0 };
    score = 0;
    document.getElementById('score').textContent = score;
    gameRunning = true;
    generateFood();
    draw();
}

// ========================================
// GENERATE RANDOM FOOD POSITION
// ========================================
function generateFood() {
    do {
        food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };
    } while (isFoodOnSnake(food.x, food.y));
}

function isFoodOnSnake(x, y) {
    return snake.some(segment => segment.x === x && segment.y === y);
}

// ========================================
// DRAW LIGHT GREEN BOARD
// ========================================
function draw() {
    // Light green board background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#c8e6c9');
    gradient.addColorStop(1, '#a5d6a7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines (subtle)
    ctx.strokeStyle = '#81c784';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * TILE_SIZE, 0);
        ctx.lineTo(i * TILE_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * TILE_SIZE);
        ctx.lineTo(canvas.width, i * TILE_SIZE);
        ctx.stroke();
    }
    
    // Draw food (dark orange - matches text theme)
    const foodGradient = ctx.createRadialGradient(
        food.x * TILE_SIZE + TILE_SIZE/3,
        food.y * TILE_SIZE + TILE_SIZE/3,
        3,
        food.x * TILE_SIZE + TILE_SIZE/2,
        food.y * TILE_SIZE + TILE_SIZE/2,
        TILE_SIZE/2
    );
    foodGradient.addColorStop(0, '#ff8c00');
    foodGradient.addColorStop(1, '#d84315');
    
    ctx.fillStyle = foodGradient;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.fillRect(food.x * TILE_SIZE, food.y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
    
    // Draw snake
    ctx.shadowBlur = 3;
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        
        if (i === 0) {
            // Head - dark green
            const headGradient = ctx.createLinearGradient(
                segment.x * TILE_SIZE,
                segment.y * TILE_SIZE,
                segment.x * TILE_SIZE + TILE_SIZE,
                segment.y * TILE_SIZE + TILE_SIZE
            );
            headGradient.addColorStop(0, '#2e7d32');
            headGradient.addColorStop(1, '#1b5e20');
            ctx.fillStyle = headGradient;
        } else {
            // Body - medium green
            const bodyGradient = ctx.createLinearGradient(
                segment.x * TILE_SIZE,
                segment.y * TILE_SIZE,
                segment.x * TILE_SIZE + TILE_SIZE,
                segment.y * TILE_SIZE + TILE_SIZE
            );
            bodyGradient.addColorStop(0, '#4caf50');
            bodyGradient.addColorStop(1, '#388e3c');
            ctx.fillStyle = bodyGradient;
        }
        
        ctx.fillRect(segment.x * TILE_SIZE, segment.y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
        
        // Draw eyes on head
        if (i === 0) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(segment.x * TILE_SIZE + TILE_SIZE - 7, segment.y * TILE_SIZE + 7, 3, 0, Math.PI * 2);
            ctx.arc(segment.x * TILE_SIZE + 7, segment.y * TILE_SIZE + 7, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#d84315';
            ctx.beginPath();
            ctx.arc(segment.x * TILE_SIZE + TILE_SIZE - 7, segment.y * TILE_SIZE + 6, 1.5, 0, Math.PI * 2);
            ctx.arc(segment.x * TILE_SIZE + 7, segment.y * TILE_SIZE + 6, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.shadowBlur = 0;
}

// ========================================
// UPDATE GAME STATE
// ========================================
function update() {
    if (!gameRunning) return;
    
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Wall collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }
    
    // Self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('score').textContent = score;
        
        // Food animation
        const canvasEl = document.getElementById('gameCanvas');
        canvasEl.classList.add('food-effect');
        setTimeout(() => canvasEl.classList.remove('food-effect'), 200);
        
        generateFood();
        
        // Speed increase every 5 points
        if (score % 5 === 0 && gameSpeed > 50) {
            gameSpeed -= 5;
            clearInterval(gameLoopInterval);
            gameLoopInterval = setInterval(gameLoop, gameSpeed);
        }
    } else {
        snake.pop();
    }
    
    draw();
}

// ========================================
// GAME OVER FUNCTION
// ========================================
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoopInterval);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
    
    // Shake effect
    const container = document.querySelector('.game-container');
    container.classList.add('game-over-effect');
    setTimeout(() => container.classList.remove('game-over-effect'), 500);
    
    showGameOverMessage();
}

function showGameOverMessage() {
    let overlay = document.querySelector('.game-over-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <h2>💀 GAME OVER 💀</h2>
            <p>Your Score: <strong>${score}</strong></p>
            <p>High Score: <strong>${highScore}</strong></p>
            <button id="gameOverRestart">Play Again</button>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('gameOverRestart').addEventListener('click', () => {
            overlay.remove();
            restartGame();
        });
    }
}

// ========================================
// RESTART GAME
// ========================================
function restartGame() {
    const overlay = document.querySelector('.game-over-overlay');
    if (overlay) overlay.remove();
    
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    
    gameSpeed = 100;
    initGame();
    gameLoopInterval = setInterval(gameLoop, gameSpeed);
}

// ========================================
// KEYBOARD CONTROLS
// ========================================
function handleKeyPress(e) {
    if (!gameRunning) return;
    
    const key = e.key;
    
    if ((key === 'ArrowUp' || key === 'w') && direction.y === 0) {
        direction = { x: 0, y: -1 };
    } else if ((key === 'ArrowDown' || key === 's') && direction.y === 0) {
        direction = { x: 0, y: 1 };
    } else if ((key === 'ArrowLeft' || key === 'a') && direction.x === 0) {
        direction = { x: -1, y: 0 };
    } else if ((key === 'ArrowRight' || key === 'd') && direction.x === 0) {
        direction = { x: 1, y: 0 };
    }
}

// ========================================
// BUTTON EVENT LISTENERS
// ========================================
document.getElementById('restartBtn').addEventListener('click', () => {
    restartGame();
});

document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

document.addEventListener('keydown', handleKeyPress);

// ========================================
// MAIN GAME LOOP
// ========================================
function gameLoop() {
    update();
}

// Start game
initGame();
gameLoopInterval = setInterval(gameLoop, gameSpeed);

console.log('🐍 Snake Game Ready! Light Green Board | Dark Orange Theme');
