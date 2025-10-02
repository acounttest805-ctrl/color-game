// js/ui.js
import { CELL_SIZE } from './constants.js';

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
    nextBlockCanvas: document.getElementById('next-block-canvas'),

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
    },

    drawNextBlock(block) {
        const nextCtx = this.nextBlockCanvas.getContext('2d');
        const width = this.nextBlockCanvas.width;
        const height = this.nextBlockCanvas.height;
        nextCtx.clearRect(0, 0, width, height);

        if (!block) return;

        const shape = block.shape;
        const blockSize = (shape[0].length > 2 || shape.length > 2) ? 12 : 15;
        const offsetX = (width - shape[0].length * blockSize) / 2;
        const offsetY = (height - shape.length * blockSize) / 2;

        nextCtx.fillStyle = block.color;
        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    nextCtx.fillRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize - 1, blockSize - 1);
                }
            });
        });
    },

    showAllClearEffect() {
        const effect = document.createElement('div');
        effect.id = 'all-clear-effect';
        effect.textContent = 'ALL CLEAR!';
        document.getElementById('game-container').appendChild(effect);
        setTimeout(() => effect.remove(), 1500);
    }
};