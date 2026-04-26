function setupEventListeners() {
    const playerSelectionButtons = document.querySelectorAll('.player-selection-button');

    playerSelectionButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            try {
                // Logic to handle player selection
                const selectedPlayer = button.dataset.player;
                selectPlayer(selectedPlayer);
                console.log(`Player selected: ${selectedPlayer}`);
            } catch (error) {
                console.error(`Error handling player selection: ${error.message}`);
                alert('An error occurred while selecting the player. Please try again.');
            }
        });
    });
}