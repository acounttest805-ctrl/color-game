// --- Game State & Elements ---
const gameScreen = document.getElementById('game-screen');
const player = document.getElementById('player');
const lifeIcons = document.getElementById('life-icons');
const lifeCount = document.getElementById('life-count');
const scoreValue = document.getElementById('score-value');
const progressBar = document.getElementById('progress-bar');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const retryButton = document.getElementById('retry-button');

// --- Game Settings ---
const PLAYER_SPEED = 10;
const OBJECT_SPEED = 5;
const stages = [
    null, // stage 1から
    {
        length: 2000, // ステージの長さ (スクロールピクセル数)
        spawnInterval: 40, // オブジェクト生成間隔
        obstacleRatio: 0.2, // 障害物の割合 (20%)
        colors: { item: '#3498db', obstacle: '#e74c3c' } // 青 vs 赤
    },
    {
        length: 2500,
        spawnInterval: 35,
        obstacleRatio: 0.35, // 35%
        colors: { item: '#2ecc71', obstacle: '#f1c40f' } // 緑 vs 黄
    },
    {
        length: 3500,
        spawnInterval: 30,
        obstacleRatio: 0.5, // 50%
        colors: { item: '#a8d5ba', obstacle: '#d5bba8' } // くすんだ緑 vs くすんだオレンジ
    },
    {
        length: 4000,
        spawnInterval: 28,
        obstacleRatio: 0.5,
        colors: { item: '#808A70', obstacle: '#9A7C70' } // 激似の緑 vs 茶
    }
];

let gameState = {
    currentStage: 1,
    totalScore: 0,
    life: 5,
    score: 0,
    scrollPosition: 0,
    playerX: gameScreen.offsetWidth / 2,
    isMovingLeft: false,
    isMovingRight: false,
    objects: [],
    spawnCounter: 0,
    isGameOver: false,
    animationFrameId: null
};

// --- Game Logic ---
function startGame() {
    gameState.currentStage = 1;
    gameState.totalScore = 0;
    setupStage();
}

function setupStage() {
    gameState.life = 5;
    gameState.score = 0;
    gameState.scrollPosition = 0;
    gameState.playerX = gameScreen.offsetWidth / 2;
    gameState.objects = [];
    gameState.isGameOver = false;
    resultModal.classList.add('hidden');
    updateUI();
    
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }
    gameLoop();
}

function gameLoop() {
    if (gameState.isGameOver) return;

    // Player Movement
    if (gameState.isMovingLeft) gameState.playerX -= PLAYER_SPEED;
    if (gameState.isMovingRight) gameState.playerX += PLAYER_SPEED;
    gameState.playerX = Math.max(15, Math.min(gameScreen.offsetWidth - 15, gameState.playerX));
    player.style.left = `${gameState.playerX}px`;

    // Object Spawning
    gameState.spawnCounter++;
    const stage = stages[gameState.currentStage];
    if (gameState.spawnCounter >= stage.spawnInterval) {
        gameState.spawnCounter = 0;
        createObject();
    }

    // Object Movement & Collision
    for (let i = gameState.objects.length - 1; i >= 0; i--) {
        const obj = gameState.objects[i];
        obj.y += OBJECT_SPEED;
        obj.element.style.top = `${obj.y}px`;

        // Collision Check
        const dx = gameState.playerX - obj.x;
        const dy = (gameScreen.offsetHeight - 40) - obj.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
            handleCollision(obj);
            obj.element.remove();
            gameState.objects.splice(i, 1);
            continue;
        }

        if (obj.y > gameScreen.offsetHeight) {
            obj.element.remove();
            gameState.objects.splice(i, 1);
        }
    }

    // Scrolling & Progress
    gameState.scrollPosition += OBJECT_SPEED;
    updateUI();

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
    objElement.style.left = `${Math.random() * (gameScreen.offsetWidth - 30)}px`;
    objElement.style.top = '-30px';
    objElement.style.backgroundColor = isObstacle ? stage.colors.obstacle : stage.colors.item;

    gameScreen.appendChild(objElement);

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
        showFeedbackCross();
        if (gameState.life <= 0) {
            gameOver();
        }
    } else {
        gameState.score += 10;
    }
    updateUI();
}

function handleStageClear() {
    gameState.totalScore += gameState.score;
    gameState.currentStage++;

    // ★修正点：画面上のすべてのオブジェクトを削除する
    for (const obj of gameState.objects) {
        obj.element.remove();
    }
    gameState.objects = []; // オブジェクト配列も空にする

    if (gameState.currentStage >= stages.length) {
        allStagesCleared();
    } else {
        setupStage();
    }
}

function gameOver() {
    gameState.isGameOver = true;
    cancelAnimationFrame(gameState.animationFrameId);
    resultTitle.textContent = 'ゲームオーバー';
    resultMessage.textContent = `ステージ ${gameState.currentStage} で失敗しました。`;
    resultModal.classList.remove('hidden');
}

function allStagesCleared() {
    gameState.isGameOver = true;
    cancelAnimationFrame(gameState.animationFrameId);
    resultTitle.textContent = '全ステージクリア！';
    resultMessage.textContent = `おめでとうございます！\n合計スコア: ${gameState.totalScore}`;
    resultModal.classList.remove('hidden');
}

function showFeedbackCross() {
    const cross = document.createElement('div');
    cross.textContent = '❌';
    cross.className = 'feedback-cross';
    cross.style.left = `${gameState.playerX - 25}px`;
    cross.style.top = `${gameScreen.offsetHeight - 80}px`;
    gameScreen.appendChild(cross);
    setTimeout(() => cross.remove(), 600);
}

function updateUI() {
    lifeIcons.textContent = '❤️'.repeat(gameState.life);
    lifeCount.textContent = gameState.life;
    scoreValue.textContent = gameState.score;
    const progress = Math.min(100, (gameState.scrollPosition / stages[gameState.currentStage].length) * 100);
    progressBar.style.height = `${progress}%`;
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

document.getElementById('btn-left').addEventListener('touchstart', () => gameState.isMovingLeft = true);
document.getElementById('btn-left').addEventListener('touchend', () => gameState.isMovingLeft = false);
document.getElementById('btn-right').addEventListener('touchstart', () => gameState.isMovingRight = true);
document.getElementById('btn-right').addEventListener('touchend', () => gameState.isMovingRight = false);

// PC用 mousedown/upイベントも追加
document.getElementById('btn-left').addEventListener('mousedown', () => gameState.isMovingLeft = true);
document.getElementById('btn-left').addEventListener('mouseup', () => gameState.isMovingLeft = false);
document.getElementById('btn-right').addEventListener('mousedown', () => gameState.isMovingRight = true);
document.getElementById('btn-right').addEventListener('mouseup', () => gameState.isMovingRight = false);

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
retryButton.addEventListener('click', startGame);

// --- Initial Start ---
startGame();