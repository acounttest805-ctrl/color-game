// js/main.js
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, colorPalettes, blockShapes, CURRENT_SEASON, SEASONS, TITLES } from './constants.js';
import { ui } from './ui.js';
// ★★★ ここを修正: getPlayerBestScore を削除 ★★★
import { initFirebase, submitScore, getRankings, checkEligibleTitles } from './firebase.js';
import { getGuestUserId } from './crypto.js';
import { createEmptyBoard, drawBoard, placeBlockOnBoard } from './board.js';
import { createNewBlock, drawBlock as drawCurrentBlock, checkCollision, rotateBlock as rotateCurrentBlock } from './block.js';

const ctx = ui.canvas.getContext('2d');

const seasonNameDisplay = document.getElementById('season-name-display');
const seasonPeriodDisplay = document.getElementById('season-period-display');
const toggleRankingBtn = document.getElementById('toggle-ranking-btn');
const rankingControls = document.getElementById('ranking-controls');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const howToPlayModal = document.getElementById('how-to-play-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

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
        const commonRule = `【基本ルール (全シーズン共通)】
・同じ色のブロックを隣接させると、そのグループと周囲の異色ブロックも一緒に消えます。
--------------------`;
        alert(`${SEASONS[selectedSeason].name} ルール\n\n${commonRule}\n${SEASONS[selectedSeason].description}`);
    });

    howToPlayBtn.addEventListener('click', () => {
        howToPlayModal.classList.remove('hidden');
    });
    closeModalBtn.addEventListener('click', () => {
        howToPlayModal.classList.add('hidden');
    });
    howToPlayModal.addEventListener('click', (event) => {
        if (event.target === howToPlayModal) {
            howToPlayModal.classList.add('hidden');
        }
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
        currentBlock: null, nextBlock: null, score: 0,
        startTime: 0, lastTime: 0, dropCounter: 0,
        dropInterval: String(CURRENT_SEASON) === "1" ? 680 : 700,
        ceilingY: 0, gameMode: mode, animationFrameId: null,
        season: CURRENT_SEASON, isGameOver: false
    };
    ui.canvas.width = BOARD_WIDTH * CELL_SIZE;
    ui.canvas.height = BOARD_HEIGHT * CELL_SIZE;
    ui.showGameScreen();
    spawnNewBlock();
    spawnNewBlock();
    gameLoop();
}

async function gameOver() {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = null;

    const encodedId = getGuestUserId();
    const rankings = await getRankings(gameState.season);
    
    // ランクイン判定ロジック
    let isRankedIn = false;
    // 全期間ランキングにランクインするか？
    if (rankings.allTime.length < 6 || (rankings.allTime[5] && gameState.score > rankings.allTime[5].score)) {
        isRankedIn = true;
    }
    // 今週ランキングにランクインするか？
    if (rankings.weekly.length < 6 || (rankings.weekly[5] && gameState.score > rankings.weekly[5].score)) {
        isRankedIn = true;
    }
    
    if (gameState.score > 0 && isRankedIn) {
        // ★★★ ここからが「名前入力とスコア送信の処理」 ★★★
        let selectedTitleId = null;
        const eligibleTitles = await checkEligibleTitles(encodedId, CURRENT_SEASON);

        if (eligibleTitles.length > 0) {
            let promptMessage = "おめでとうございます！過去の実績により、以下の称号を付けられます。\n\n";
            eligibleTitles.forEach((titleId, index) => {
                promptMessage += `${index + 1}: ${TITLES[titleId].name}\n`;
            });
            promptMessage += "\n付けたい称号の番号を入力してください (付けない場合はキャンセルか空欄でOK):";
            
            const choice = prompt(promptMessage);
            if (choice) {
                const choiceIndex = parseInt(choice, 10) - 1;
                if (choiceIndex >= 0 && choiceIndex < eligibleTitles.length) {
                    selectedTitleId = eligibleTitles[choiceIndex];
                }
            }
        }
        
        const playerName = prompt(
            `ランキング入り！\nスコア: ${gameState.score}\n\n名前を入力してください (8文字以内):\n(本名などの個人情報は入力しないでください)`,
            "Player"
        );
        
        if (playerName !== null) {
            await submitScore(encodedId, playerName, gameState.score, gameState.gameMode, gameState.season, selectedTitleId);
        }
        // ★★★ ここまで ★★★

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
    if (gameState.dropCounter > gameState.dropInterval) moveBlockDown();
    draw();
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    drawBoard(ctx, gameState.board, gameState.ceilingY);
    drawCurrentBlock(ctx, gameState.currentBlock);
}

function checkDifficultyUpdate(elapsedTime) {
    const minutes = Math.floor(elapsedTime / 60000);
    if (String(gameState.season) === "1") {
        gameState.ceilingY = Math.min(minutes, 15);
        const intervals = Math.min(minutes, 15);
        gameState.dropInterval = Math.max(80, 680 - (intervals * 20));
    } else {
        gameState.ceilingY = Math.min(minutes, 9);
        const speedUps = Math.floor(elapsedTime / 300000);
        gameState.dropInterval = 700 / Math.pow(2, speedUps);
    }
}

function spawnNewBlock() {
    if (gameState.isGameOver) return;
    gameState.currentBlock = gameState.nextBlock;
    gameState.nextBlock = createNewBlock(gameState.gameMode, gameState.season);
    if (gameState.currentBlock) {
        gameState.currentBlock.y = gameState.ceilingY;
        if (checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
            gameOver();
            return;
        }
    }
    ui.drawNextBlock(gameState.nextBlock);
}

function moveBlockDown() {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    gameState.currentBlock.y++;
    if (checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameState.currentBlock.y--;
        placeBlock();
        spawnNewBlock();
    }
    gameState.dropCounter = 0;
}

function placeBlock() {
    if (gameState.isGameOver) return;
    const scoreToAdd = placeBlockOnBoard(gameState.board, gameState.currentBlock, gameState.season);
    gameState.score += scoreToAdd;
}

function rotateBlock(dir) {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    rotateCurrentBlock(gameState.currentBlock, gameState.board, gameState.ceilingY, dir);
}

function moveBlockSide(dir) {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    gameState.currentBlock.x += dir;
    if (checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameState.currentBlock.x -= dir;
    }
}

function hardDrop() {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    while (!checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameState.currentBlock.y++;
    }
    gameState.currentBlock.y--;
    placeBlock();
    spawnNewBlock();
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