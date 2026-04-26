/**
 * UI management
 */
class UIManager {
    constructor() {
        // Screens
        this.mainMenu = document.getElementById('main-menu');
        this.gameScreen = document.getElementById('game-screen');
        this.pauseMenu = document.getElementById('pause-menu');
        this.gameOver = document.getElementById('game-over');
        
        // Score elements
        this.player1Score = document.querySelector('#player1-score .score-value');
        this.player2Score = document.querySelector('#player2-score .score-value');
        this.player1Container = document.getElementById('player1-score');
        this.player2Container = document.getElementById('player2-score');
        this.turnIndicator = document.getElementById('current-turn');
        
        // Player name elements
        this.player1Name = document.querySelector('#player1-score .player-name');
        this.player2Name = document.querySelector('#player2-score .player-name');
        
        // Buttons
        this.btnSinglePlayer = document.getElementById('btn-single-player');
        this.btnTwoPlayer = document.getElementById('btn-two-player');
        this.btnPause = document.getElementById('btn-pause');
        this.btnResume = document.getElementById('btn-resume');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnMainMenu = document.getElementById('btn-main-menu');
        this.btnPlayAgain = document.getElementById('btn-play-again');
        this.btnBackMenu = document.getElementById('btn-back-menu');
        
        // Slider
        this.strikerSlider = document.getElementById('striker-slider');
        
        // Message
        this.gameMessage = document.getElementById('game-message');
        this.messageText = document.getElementById('message-text');
        
        // Game over elements
        this.winnerText = document.getElementById('winner-text');
        this.finalScore1 = document.getElementById('final-score-1');
        this.finalScore2 = document.getElementById('final-score-2');
    }

    showScreen(screen) {
        this.mainMenu.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.pauseMenu.classList.add('hidden');
        this.gameOver.classList.add('hidden');
        
        switch (screen) {
            case 'menu':
                this.mainMenu.classList.remove('hidden');
                break;
            case 'game':
                this.gameScreen.classList.remove('hidden');
                break;
            case 'pause':
                this.pauseMenu.classList.remove('hidden');
                break;
            case 'gameover':
                this.gameOver.classList.remove('hidden');
                break;
        }
    }

    updateScores(player1, player2) {
        this.player1Score.textContent = player1;
        this.player2Score.textContent = player2;
    }

    setActivePlayer(player) {
        if (player === 1) {
            this.player1Container.classList.add('active');
            this.player2Container.classList.remove('active');
        } else {
            this.player1Container.classList.remove('active');
            this.player2Container.classList.add('active');
        }
    }

    updateTurnIndicator(playerName, isBot = false) {
        this.turnIndicator.textContent = isBot ? "Bot's Turn" : `${playerName}'s Turn`;
    }

    setPlayerNames(player1Name, player2Name) {
        this.player1Name.textContent = player1Name;
        this.player2Name.textContent = player2Name;
    }

    showMessage(text, duration = 2000) {
        this.messageText.textContent = text;
        this.gameMessage.classList.remove('hidden');
        
        if (duration > 0) {
            setTimeout(() => {
                this.gameMessage.classList.add('hidden');
            }, duration);
        }
    }

    hideMessage() {
        this.gameMessage.classList.add('hidden');
    }

    showGameOver(winner, score1, score2, isTie = false) {
        if (isTie) {
            this.winnerText.textContent = "It's a Tie!";
        } else {
            this.winnerText.textContent = `${winner} Wins!`;
        }
        this.finalScore1.textContent = score1;
        this.finalScore2.textContent = score2;
        this.showScreen('gameover');
    }

    getSliderValue() {
        return parseInt(this.strikerSlider.value, 10);
    }

    setSliderValue(value) {
        this.strikerSlider.value = value;
    }

    enableSlider() {
        this.strikerSlider.disabled = false;
    }

    disableSlider() {
        this.strikerSlider.disabled = true;
    }
}
