// ui.js
export const ui = {
    gameScreen: document.getElementById('game-screen'),
    player: document.getElementById('player'),
    lifeIcons: document.getElementById('life-icons'),
    lifeCount: document.getElementById('life-count'),
    scoreValue: document.getElementById('score-value'),
    progressBar: document.getElementById('progress-bar'),
    resultModal: document.getElementById('result-modal'),
    resultTitle: document.getElementById('result-title'),
    resultMessage: document.getElementById('result-message'),
    btnLeft: document.getElementById('btn-left'),
    btnRight: document.getElementById('btn-right'),
    retryButton: document.getElementById('retry-button'),

    update(state, stages) {
        this.lifeIcons.textContent = '❤️'.repeat(state.life);
        this.lifeCount.textContent = state.life;
        this.scoreValue.textContent = state.score;
        const progress = Math.min(100, (state.scrollPosition / stages[state.currentStage].length) * 100);
        this.progressBar.style.height = `${progress}%`;
        this.player.style.left = `${state.playerX}px`;
    },

    showGameOver(stageNum) {
        this.resultTitle.textContent = 'ゲームオーバー';
        this.resultMessage.textContent = `ステージ ${stageNum} で失敗しました。`;
        this.resultModal.classList.remove('hidden');
    },

    showAllStagesCleared(totalScore) {
        this.resultTitle.textContent = '全ステージクリア！';
        this.resultMessage.textContent = `おめでとうございます！\n合計スコア: ${totalScore}`;
        this.resultModal.classList.remove('hidden');
    },

    showFeedbackCross(playerX, playerY) {
        const cross = document.createElement('div');
        cross.textContent = '❌';
        cross.className = 'feedback-cross';
        cross.style.left = `${playerX - 25}px`;
        cross.style.top = `${playerY - 40}px`;
        this.gameScreen.appendChild(cross);
        setTimeout(() => cross.remove(), 600);
    }
};