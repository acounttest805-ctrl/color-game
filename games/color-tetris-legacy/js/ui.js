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

    displayRankings({ allTime, weekly }, seasonName) {
        this.updateRankingList(this.rankingContainerAllTime, `${seasonName} 全期間`, allTime);
        this.updateRankingList(this.rankingContainerWeekly, `${seasonName} 今週`, weekly);
    },

    updateRankingList(container, title, data) {
        let html = `<h2>${title}</h2><ol>`;
        if (data.length === 0) {
            html += '<li>まだランキングがありません。</li>';
        } else {
            data.forEach((item, index) => {
                const name = item.name ? item.name.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Anonymous";
                html += `<li><span class="rank">${index + 1}.</span> <span class="name">${name}</span> <span class="mode">[${item.mode}]</span> <span class="score">${item.score}</span></li>`;
            });
        }
        html += '</ol>';
        container.innerHTML = html;
    }
};