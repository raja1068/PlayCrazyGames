/**
 * MAIN ENTRY POINT
 * Initializes the game, sets up event listeners, and starts the game loop
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize board
    Board.renderBoard('ludoBoard');
    
    // Initialize game
    const game = new LudoGame();
    game.init();
    
    // Set up event listeners
    const rollBtn = document.getElementById('rollBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    rollBtn.addEventListener('click', () => {
        game.rollDice();
    });
    
    resetBtn.addEventListener('click', () => {
        game.resetGame();
    });
    
    // Keyboard support: Press 'R' to roll dice
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
            if (!game.waitingForMove && game.gameActive && !game.winner) {
                game.rollDice();
            }
        } else if (e.key === 'n' || e.key === 'N') {
            game.resetGame();
        }
    });
    
    console.log('Ludo Game Initialized! 🎲');
});
