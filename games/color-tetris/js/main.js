// js/main.js
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, CURRENT_SEASON, SEASONS } from './constants.js';
import { ui } from './ui.js';
import { initFirebase, submitScore, getRankings } from './firebase.js';
import { getGuestUserId } from './crypto.js';
// ★修正: board.js から rotateBlock の import を削除
import { createEmptyBoard, drawBoard, placeBlockOnBoard } from './board.js';
import { createNewBlock, drawBlock as drawCurrentBlock, checkCollision as checkBlockCollision, rotateBlock as rotateCurrentBlock } from './block.js';

const ctx = ui.canvas.getContext('2d');

const seasonNameDisplay = document.getElementById('season-name-display');
const seasonPeriodDisplay = document.getElementById('season-period-display');
const toggleRankingBtn = document.getElementById('toggle-ranking-btn');
const rankingControls = document.getElementById('ranking-controls');

let gameState = {};
let selectedSeason = CURRENT_SEASON;

export function initGame(db) {
    initFirebase(db);

    seasonNameDisplay.textContent = `${SEASONS[CURRENT_SEASON].name} 開催中`;
    seasonPeriodDisplay.textContent = SEASONS[CURRENT_SEASON].period;

    const seasonSelect = document.getElementById('season-select');
    if (seasonSelect.options.length === 0) {
        for (const seasonNum in SEASONS) {
            const option = document.createElement('option');
            option.value = seasonNum;
            option.textContent = SEASONS[seasonNum].name;
            seasonSelect.appendChild(option);
        }
    }
    seasonSelect.value = selectedSeason;
    
    seasonSelect.addEventListener('change', (e) => {
        selectedSeason = parseInt(e.target.value, 10);
        updateRankingDisplay();
    });

    document.getElementById('rule-button').addEventListener('click', () => {
        alert(`${SEASONS[selectedSeason].name}\n\n${SEASONS[selectedSeason].description}`);
    });

    ui.normalModeBtn.addEventListener('click', () => startGame('normal'));
    ui.supportModeBtn.addEventListener('click', () => startGame('support'));
    ui.backToTitleBtn.addEventListener('click', showTitleScreen);
    
    document.addEventListener('keydown', handleKeydown);
    document.getElementById('btn-left').addEventListener('click', () => moveBlockSide(-1));
    document.getElementById('btn-right').addEventListener('click', () => moveBlockSide(1));
    document.getElementById('btn-down').addEventListener('click', () => moveBlockDown());
    document.getElementById('btn-rotate-left').addEventListener('click', () => rotateBlock(-1));
    document.getElementById('btn-hard-drop').addEventListener('click', () => hardDrop());
    document.getElementById('btn-rotate-right').addEventListener('click', () => rotateBlock(1));

    toggleRankingBtn.addEventListener('click', () => {
        rankingControls.classList.toggle('hidden');
        const isHidden = rankingControls.classList.contains('hidden');
        toggleRankingBtn.textContent = isHidden ? 'ランキングを見る' : 'ランキングを隠す';
    });

    showTitleScreen();
}

async function updateRankingDisplay() {
    const rankings = await getRankings(selectedSeason);
    ui.displayRankings(rankings, SEASONS[selectedSeason].name);
}

async function showTitleScreen() {
    ui.showTitleScreen();
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
        gameState.animationFrameId = null;
    }
    
    updateRankingDisplay();
    
    rankingControls.classList.add('hidden');
    toggleRankingBtn.textContent = 'ランキングを見る';
}

function startGame(mode) {
    gameState = {
        board: createEmptyBoard(),
        currentBlock: null, score: 0, startTime: 0, lastTime: 0,
        dropCounter: 0, dropInterval: 700, ceilingY: 0,
        gameMode: mode, animationFrameId: null,
        season: CURRENT_SEASON,
        isGameOver: false
    };
    
    ui.canvas.width = BOARD_WIDTH * CELL_SIZE;
    ui.canvas.height = BOARD_HEIGHT * CELL_SIZE;
    
    ui.showGameScreen();
    spawnNewBlock();
    gameLoop();
}

async function gameOver() {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    
    cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = null;

    const rankings = await getRankings(gameState.season);
    const lowestAllTime = rankings.allTime.length < 5 ? 0 : rankings.allTime[rankings.allTime.length - 1].score;
    const lowestWeekly = rankings.weekly.length < 5 ? 0 : rankings.weekly[rankings.weekly.length - 1].score;

    if (gameState.score > 0 && (gameState.score > lowestAllTime || gameState.score > lowestWeekly)) {
        const playerName = prompt(
            `ランキング入り！\nスコア: ${gameState.score}\n\n名前を入力してください (8文字以内):\n(本名などの個人情報は入力しないでください)`,
            "Player"
        );
        if (playerName !== null) {
            const encodedId = getGuestUserId();
            // ★修正: playerName.slice(0, 8) を追加
            await submitScore(encodedId, playerName.slice(0, 8), gameState.score, gameState.gameMode, gameState.season);
        }
    } else {
        alert(`ゲームオーバー！\nスコア: ${gameState.score}`);
    }
    showTitleScreen();
}

function gameLoop(time = 0) {
    if (gameState.isGameOver) return;
    if (!gameState.startTime) gameState.startTime = time;
    const deltaTime = time - gameState.lastTime;
    gameState.lastTime = time;

    checkDifficultyUpdate(time - gameState.startTime);
    ui.update(time - gameState.startTime, gameState.score);
    
    gameState.dropCounter += deltaTime;
    if (gameState.dropCounter > gameState.dropInterval) {
        moveBlockDown();
    }
    
    draw();
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    
    drawBoard(ctx, gameState.board, gameState.ceilingY);
    drawCurrentBlock(ctx, gameState.currentBlock); // 別名にした関数を使用
}

function checkDifficultyUpdate(elapsedTime) {
    const minutes = Math.floor(elapsedTime / 60000);
    gameState.ceilingY = Math.min(minutes, 9);
    // ★修正: 速度上昇ロジックを変更
    const speedUps = Math.floor(elapsedTime / 30000); // 30秒ごとに速度アップ
    gameState.dropInterval = Math.max(100, 700 - (speedUps * 50));
}

function spawnNewBlock() {
    if (gameState.isGameOver) return;
    gameState.currentBlock = createNewBlock(gameState.ceilingY, gameState.gameMode);
    if (checkCollision()) {
        gameOver();
    }
}

function moveBlockDown() {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    gameState.currentBlock.y++;
    if (checkCollision()) {
        gameState.currentBlock.y--;
        placeBlock();
    }
    gameState.dropCounter = 0;
}

function placeBlock() {
    if (gameState.isGameOver) return;
    const scoreToAdd = placeBlockOnBoard(gameState.board, gameState.currentBlock);
    gameState.score += scoreToAdd;
    // ★修正: spawnNewBlockをここに追加
    spawnNewBlock();
}

function checkCollision() {
    if (!gameState.currentBlock) return true;
    return checkBlockCollision(gameState.currentBlock, gameState.board, gameState.ceilingY);
}

function rotateBlock(dir) {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    rotateCurrentBlock(gameState.currentBlock, gameState.board, gameState.ceilingY, dir);
}

function moveBlockSide(dir) {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    gameState.currentBlock.x += dir;
    if (checkCollision()) {
        gameState.currentBlock.x -= dir;
    }
}

function hardDrop() {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    while (!checkCollision()) {
        gameState.currentBlock.y++;
    }
    gameState.currentBlock.y--;
    placeBlock();
}

function handleKeydown(event) {
    if (ui.gameScreenWrapper.classList.contains('hidden') || gameState.isGameOver) return;
    if (event.key === 'ArrowLeft') moveBlockSide(-1);
    else if (event.key === 'ArrowRight') moveBlockSide(1);
    else if (event.key === 'ArrowDown') moveBlockDown();
    else if (event.key === 'ArrowUp') hardDrop();
    else if (event.key === 'z' || event.key === 'Z') rotateBlock(-1);
    else if (event.key === 'x' || event.key === 'X') rotateBlock(1);
}
