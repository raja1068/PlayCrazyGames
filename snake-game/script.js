const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

// Game variables
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [{x: 10, y: 10}];
let direction = {x: 0, y: 0};
let food = {};
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = true;

highScoreElement.textContent = highScore;

// Generate random food position
function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // Check if food spawns on snake
    for(let segment of snake) {
        if(segment.x === food.x && segment.y === food.y) {
            generateFood();
        }
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw snake
    ctx.fillStyle = '#4CAF50';
    for(let segment of snake) {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    }
    
    // Draw food
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

// Update game state
function update() {
    if(!gameRunning) return;
    
    // Move snake head
    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
    
    // Check wall collision
    if(head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    // Check self collision
    for(let segment of snake) {
        if(head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    // Check food collision
    if(head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
}

// Game over function
function gameOver() {
    gameRunning = false;
    if(score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
    alert(`Game Over! Your score: ${score}`);
    restartGame();
}

// Restart game
function restartGame() {
    snake = [{x: 10, y: 10}];
    direction = {x: 0, y: 0};
    score = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    generateFood();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if(!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
            if(direction.y === 0) direction = {x: 0, y: -1};
            break;
        case 'ArrowDown':
        case 's':
            if(direction.y === 0) direction = {x: 0, y: 1};
            break;
        case 'ArrowLeft':
        case 'a':
            if(direction.x === 0) direction = {x: -1, y: 0};
            break;
        case 'ArrowRight':
        case 'd':
            if(direction.x === 0) direction = {x: 1, y: 0};
            break;
    }
});

// Restart button
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Game loop
generateFood();
setInterval(() => {
    update();
    draw();
}, 100);
