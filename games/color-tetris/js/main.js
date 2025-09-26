// main.js
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE } from './constants.js';
import { ui } from './ui.js';
import { createEmptyBoard, drawBoard, placeBlockOnBoard } from './board.js';
import { createNewBlock, drawBlock, checkCollision, rotateBlock } from './block.js';

// --- Canvas Setup ---
const ctx = ui.canvas.getContext('2d');
ui.canvas.width = BOARD_WIDTH * CELL_SIZE;
ui.canvas.height = BOARD_HEIGHT * CELL_SIZE;

// --- Game State ---
let gameState = {};

// --- Game Flow ---
function showTitleScreen() {
    ui.showTitleScreen();
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }
}

function startGame(mode) {
    gameState = {
        board: createEmptyBoard(),
        currentBlock: null,
        score: 0,
        startTime: 0,
        lastTime: 0,
        dropCounter: 0,
        dropInterval: 700,
        ceilingY: 0,
        gameMode: mode,
        animationFrameId: null
    };
    
    ui.showGameScreen();
    spawnNewBlock();
    gameLoop();
}

// --- Main Game Loop ---
function gameLoop(time = 0) {
    if (!gameState.startTime) gameState.startTime = time;
    const deltaTime = time - gameState.lastTime;
    gameState.lastTime = time;

    // 難易度更新
    const elapsedTime = time - gameState.startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    gameState.ceilingY = Math.min(minutes, 9);
    const speedUps = Math.floor(elapsedTime / 300000);
    gameState.dropInterval = 700 / Math.pow(2, speedUps);
    
    // UI更新
    ui.update(elapsedTime, gameState.score);
    
    // 落下処理
    gameState.dropCounter += deltaTime;
    if (gameState.dropCounter > gameState.dropInterval) {
        moveBlockDown();
    }
    
    // 描画
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    drawBoard(ctx, gameState.board, gameState.ceilingY);
    drawBlock(ctx, gameState.currentBlock);

    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Block Actions ---
function spawnNewBlock() {
    gameState.currentBlock = createNewBlock(gameState.ceilingY, gameState.gameMode);
    if (checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        alert("ゲームオーバー！");
        showTitleScreen();
    }
}

function moveBlockDown() {
    gameState.currentBlock.y++;
    if (checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameState.currentBlock.y--;
        gameState.score += placeBlockOnBoard(gameState.board, gameState.currentBlock);
        spawnNewBlock();
    }
    gameState.dropCounter = 0;
}

function moveBlockSide(dir) {
    gameState.currentBlock.x += dir;
    if (checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameState.currentBlock.x -= dir;
    }
}

function hardDrop() {
    while (!checkCollision(gameState.currentBlock, gameState.board, gameState.ceilingY)) {
        gameState.currentBlock.y++;
    }
    gameState.currentBlock.y--;
    gameState.score += placeBlockOnBoard(gameState.board, gameState.currentBlock);
    spawnNewBlock();
}

// --- Event Listeners ---
ui.normalModeBtn.addEventListener('click', () => startGame('normal'));
ui.supportModeBtn.addEventListener('click', () => startGame('support'));
ui.backToTitleBtn.addEventListener('click', showTitleScreen);

document.addEventListener('keydown', event => {
    if (ui.gameScreenWrapper.classList.contains('hidden')) return;
    if (event.key === 'ArrowLeft') moveBlockSide(-1);
    else if (event.key === 'ArrowRight') moveBlockSide(1);
    else if (event.key === 'ArrowDown') moveBlockDown();
    else if (event.key === 'ArrowUp') hardDrop();
    else if (event.key === 'z' || event.key === 'Z') rotateBlock(gameState.currentBlock, gameState.board, gameState.ceilingY, -1);
    else if (event.key === 'x' || event.key === 'X') rotateBlock(gameState.currentBlock, gameState.board, gameState.ceilingY, 1);
});

document.getElementById('btn-left').addEventListener('click', () => moveBlockSide(-1));
document.getElementById('btn-right').addEventListener('click', () => moveBlockSide(1));
document.getElementById('btn-down').addEventListener('click', () => moveBlockDown());
document.getElementById('btn-rotate-left').addEventListener('click', () => rotateBlock(gameState.currentBlock, gameState.board, gameState.ceilingY, -1));
document.getElementById('btn-hard-drop').addEventListener('click', () => hardDrop());
document.getElementById('btn-rotate-right').addEventListener('click', () => rotateBlock(gameState.currentBlock, gameState.board, gameState.ceilingY, 1));


// --- Initial Load ---
showTitleScreen();