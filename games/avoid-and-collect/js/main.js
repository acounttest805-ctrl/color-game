// main.js
import { PLAYER_SPEED, OBJECT_SPEED, stages } from './constants.js';
import { ui } from './ui.js';

let gameState = {};

// --- Game Logic ---
function startGame() {
    gameState = {
        currentStage: 1,
        totalScore: 0,
        life: 5,
        score: 0,
        scrollPosition: 0,
        playerX: ui.gameScreen.offsetWidth / 2,
        isMovingLeft: false,
        isMovingRight: false,
        objects: [],
        spawnCounter: 0,
        isGameOver: false,
        animationFrameId: null
    };
    setupStage();
}

function setupStage() {
    if (gameState.currentStage > 1) { // ステージ2以降のリセット
        gameState.life = 5;
        gameState.score = 0;
        gameState.scrollPosition = 0;
        gameState.playerX = ui.gameScreen.offsetWidth / 2;
        gameState.objects.forEach(obj => obj.element.remove());
        gameState.objects = [];
    }
    ui.resultModal.classList.add('hidden');
    ui.update(gameState, stages);
    
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }
    gameLoop();
}

function gameLoop() {
    if (gameState.isGameOver) return;

    if (gameState.isMovingLeft) gameState.playerX -= PLAYER_SPEED;
    if (gameState.isMovingRight) gameState.playerX += PLAYER_SPEED;
    gameState.playerX = Math.max(15, Math.min(ui.gameScreen.offsetWidth - 15, gameState.playerX));

    gameState.spawnCounter++;
    const stage = stages[gameState.currentStage];
    if (gameState.spawnCounter >= stage.spawnInterval) {
        gameState.spawnCounter = 0;
        createObject();
    }

    for (let i = gameState.objects.length - 1; i >= 0; i--) {
        const obj = gameState.objects[i];
        obj.y += OBJECT_SPEED;
        obj.element.style.top = `${obj.y}px`;

        const playerY = ui.gameScreen.offsetHeight - 40;
        const dx = gameState.playerX - obj.x;
        const dy = playerY - obj.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
            handleCollision(obj);
            obj.element.remove();
            gameState.objects.splice(i, 1);
            continue;
        }

        if (obj.y > ui.gameScreen.offsetHeight) {
            obj.element.remove();
            gameState.objects.splice(i, 1);
        }
    }

    gameState.scrollPosition += OBJECT_SPEED;
    ui.update(gameState, stages);

    if (gameState.scrollPosition >= stage.length) {
        handleStageClear();
        return;
    }
    
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function createObject() {
    const stage = stages[gameState.currentStage];
    const isObstacle = Math.random() < stage.obstacleRatio;
    
    const objElement = document.createElement('div');
    objElement.className = 'object';
    objElement.style.left = `${Math.random() * (ui.gameScreen.offsetWidth - 30)}px`;
    objElement.style.top = '-30px';
    objElement.style.backgroundColor = isObstacle ? stage.colors.obstacle : stage.colors.item;

    ui.gameScreen.appendChild(objElement);

    gameState.objects.push({
        element: objElement,
        x: objElement.offsetLeft + 15,
        y: -30,
        isObstacle: isObstacle
    });
}

function handleCollision(obj) {
    if (obj.isObstacle) {
        gameState.life--;
        const playerY = ui.gameScreen.offsetHeight - 40;
        ui.showFeedbackCross(gameState.playerX, playerY);
        if (gameState.life <= 0) {
            gameOver();
        }
    } else {
        gameState.score += 10;
    }
}

function handleStageClear() {
    gameState.totalScore += gameState.score;
    gameState.currentStage++;

    if (gameState.currentStage >= stages.length) {
        allStagesCleared();
    } else {
        setupStage();
    }
}

function gameOver() {
    gameState.isGameOver = true;
    cancelAnimationFrame(gameState.animationFrameId);
    ui.showGameOver(gameState.currentStage);
}

function allStagesCleared() {
    gameState.isGameOver = true;
    cancelAnimationFrame(gameState.animationFrameId);
    ui.showAllStagesCleared(gameState.totalScore);
}

// --- Event Listeners ---
function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') gameState.isMovingLeft = true;
    if (e.key === 'ArrowRight') gameState.isMovingRight = true;
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft') gameState.isMovingLeft = false;
    if (e.key === 'ArrowRight') gameState.isMovingRight = false;
}

ui.btnLeft.addEventListener('touchstart', () => gameState.isMovingLeft = true);
ui.btnLeft.addEventListener('touchend', () => gameState.isMovingLeft = false);
ui.btnRight.addEventListener('touchstart', () => gameState.isMovingRight = true);
ui.btnRight.addEventListener('touchend', () => gameState.isMovingRight = false);

ui.btnLeft.addEventListener('mousedown', () => gameState.isMovingLeft = true);
ui.btnLeft.addEventListener('mouseup', () => gameState.isMovingLeft = false);
ui.btnRight.addEventListener('mousedown', () => gameState.isMovingRight = true);
ui.btnRight.addEventListener('mouseup', () => gameState.isMovingRight = false);

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
ui.retryButton.addEventListener('click', startGame);

// --- Initial Start ---
startGame();