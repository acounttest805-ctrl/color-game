// js/ui.js
export const ui = {
    canvas: document.getElementById('game-board'),
    timeDisplay: document.getElementById('time-display'),
    scoreDisplay: document.getElementById('score-display'),
    titleScreen: document.getElementById('title-screen'),
    gameScreenWrapper: document.getElementById('game-screen-wrapper'),
    normalModeBtn: document.getElementById('normal-mode-btn'),
    supportModeBtn: document.getElementById('support-mode-btn'),
    backToTitleBtn: document.getElementById('back-to-title-btn'),
    rankingContainerAllTime: document.getElementById('ranking-container-alltime'),
    rankingContainerWeekly: document.getElementById('ranking-container-weekly'),

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
    },

    displayRankings({ allTime, weekly }) {
        this.updateRankingList(document.getElementById('ranking-list-alltime'), allTime);
        this.updateRankingList(document.getElementById('ranking-list-weekly'), weekly);
    },

    updateRankingList(listElement, data) {
        listElement.innerHTML = ''; // リストをクリア
        if (data.length === 0) {
            listElement.innerHTML = '<li>まだランキングがありません。</li>';
        } else {
            data.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="rank">${index + 1}.</span> <span class="name">${item.name}</span> <span class="mode">[${item.mode}]</span> <span class="score">${item.score}</span>`;
                listElement.appendChild(li);
            });
        }
    }
};