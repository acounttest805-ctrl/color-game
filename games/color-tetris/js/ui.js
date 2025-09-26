// ui.js
export const ui = {
    canvas: document.getElementById('game-board'),
    timeDisplay: document.getElementById('time-display'),
    scoreDisplay: document.getElementById('score-display'),
    titleScreen: document.getElementById('title-screen'),
    gameScreenWrapper: document.getElementById('game-screen-wrapper'),
    normalModeBtn: document.getElementById('normal-mode-btn'),
    supportModeBtn: document.getElementById('support-mode-btn'),
    backToTitleBtn: document.getElementById('back-to-title-btn'),
    
    showTitleScreen() {
        this.titleScreen.classList.remove('hidden');
        this.gameScreenWrapper.classList.add('hidden');
    },

    showGameScreen() {
        this.titleScreen.classList.add('hidden');
        this.gameScreenWrapper.classList.remove('hidden');
    },

    update(time, score) {
        const totalSeconds = Math.floor(time / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        this.timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.scoreDisplay.textContent = score;
    }
};