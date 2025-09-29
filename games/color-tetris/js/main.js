// js/main.js
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, colorPalettes, blockShapes, CURRENT_SEASON, SEASONS } from './constants.js';
import { ui } from './ui.js';
import { initFirebase, submitScore, getRankings } from './firebase.js';
import { getGuestUserId } from './crypto.js'; // crypto.jsからインポート

// block.js から必要な関数をインポート
import { createNewBlock, drawBlock, checkCollision, rotateBlock } from './block.js';
// board.js から必要な関数をインポート
import { createEmptyBoard, drawBoard, placeBlockOnBoard } from './board.js';


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
    document.getElementById('btn-rotate-left').addEventListener('click', () => rotateBlockWrapper(-1)); // ラッパー関数を使用
    document.getElementById('btn-hard-drop').addEventListener('click', () => hardDrop());
    document.getElementById('btn-rotate-right').addEventListener('click', () => rotateBlockWrapper(1)); // ラッパー関数を使用

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
        board: createEmptyBoard(), // board.js の createEmptyBoard を使用
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
    // ランキングの最低スコアを正しく取得する
    const lowestAllTime = rankings.allTime.length < 5 ? 0 : rankings.allTime[rankings.allTime.length - 1].score;
    const lowestWeekly = rankings.weekly.length < 5 ? 0 : rankings.weekly[rankings.weekly.length - 1].score; // ★修正

    let promptClosed = false; // プロンプトが閉じられたかどうかのフラグ

    if (gameState.score > 0 && (gameState.score > lowestAllTime || gameState.score > lowestWeekly)) {
        const playerName = prompt(
            `ランキング入り！\nスコア: ${gameState.score}\n\n名前を入力してください (8文字以内):\n(本名などの個人情報は入力しないでください)`,
            "Player"
        );
        if (playerName !== null) {
            const encodedId = getGuestUserId();
            await submitScore(encodedId, playerName, gameState.score, gameState.gameMode, gameState.season);
        }
        promptClosed = true;
    } else {
        alert(`ゲームオーバー！\nスコア: ${gameState.score}`);
        promptClosed = true;
    }

    // プロンプトまたはアラートが閉じられた後にタイトル画面に戻る
    if (promptClosed) {
        showTitleScreen(); // ★修正: ゲームオーバー後にタイトル画面に戻る
    }
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
    
    drawBoard(ctx, gameState.board, gameState.ceilingY); // board.js の drawBoard を使用
    drawBlock(ctx, gameState.currentBlock); // block.js の drawBlock を使用
}

function checkDifficultyUpdate(elapsedTime) {
    const minutes = Math.floor(elapsedTime / 60000);
    gameState.ceilingY = Math.min(minutes, 9);
    const speedUps = Math.floor(elapsedTime / 300000);
    gameState.dropInterval = 700 / Math.pow(2, speedUps);
}

function spawnNewBlock() {
    if (gameState.isGameOver) return;
    // block.js の createNewBlock を使用
    gameState.currentBlock = createNewBlock(gameState.ceilingY, gameState.gameMode);
    
    // block.js の checkCollision を使用
    if (checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameOver();
    }
}

function moveBlockDown() {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    gameState.currentBlock.y++;
    // block.js の checkCollision を使用
    if (checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameState.currentBlock.y--; // 衝突したら一つ戻す
        placeBlock();
        spawnNewBlock();
    }
    gameState.dropCounter = 0;
}

function placeBlock() {
    if (gameState.isGameOver) return;
    // board.js の placeBlockOnBoard を使用し、戻り値のスコアを加算
    const clearedScore = placeBlockOnBoard(gameState.board, gameState.currentBlock);
    gameState.score += clearedScore;
}

// checkCollision, findSameColorNeighbors, findCollateralDamage, isValid, dropFloatingBlocks, findConnectedGroup
// これらは main.js から削除し、board.js および block.js からインポートされた関数が使用されます。

// block.js の rotateBlock を呼び出すためのラッパー関数
function rotateBlockWrapper(dir) {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    rotateBlock(gameState.currentBlock, gameState.board, gameState.ceilingY, dir); // block.js の rotateBlock を使用
}

function moveBlockSide(dir) {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    gameState.currentBlock.x += dir;
    // block.js の checkCollision を使用
    if (checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameState.currentBlock.x -= dir;
    }
}

function hardDrop() {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    // block.js の checkCollision を使用
    while (!checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameState.currentBlock.y++;
    }
    gameState.currentBlock.y--; // 衝突したら一つ戻す
    placeBlock();
    spawnNewBlock();
}

function handleKeydown(event) {
    if (ui.gameScreenWrapper.classList.contains('hidden') || gameState.isGameOver) return;
    if (event.key === 'ArrowLeft') moveBlockSide(-1);
    else if (event.key === 'ArrowRight') moveBlockSide(1);
    else if (event.key === 'ArrowDown') moveBlockDown();
    else if (event.key === 'ArrowUp') hardDrop();
    else if (event.key === 'z' || event.key === 'Z') rotateBlockWrapper(-1);
    else if (event.key === 'x' || event.key === 'X') rotateBlockWrapper(1);
}
