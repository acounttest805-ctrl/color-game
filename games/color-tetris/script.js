// --- Setup ---
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const timeDisplay = document.getElementById('time-display'); // ★追加

const BOARD_WIDTH = 13;   // ★変更: 13
const BOARD_HEIGHT = 25;  // ★変更: 25
const CELL_SIZE = 22;     // スマホ画面に収まるように少し小さく調整

canvas.width = BOARD_WIDTH * CELL_SIZE;
canvas.height = BOARD_HEIGHT * CELL_SIZE;

// --- Game State ---
let board = createEmptyBoard();
let currentBlock = null;
let dropCounter = 0;
let lastTime = 0;
let startTime = 0; // ★追加: 経過時間計測用
const DROP_INTERVAL = 700;

// ★変更: テトリスの全7種類のブロックを追加
const blockShapes = [
    { shape: [[1, 1, 1, 1]], color: 'cyan' },      // I型
    { shape: [[1, 1], [1, 1]], color: 'yellow' }, // O型
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },   // S型
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },     // Z型
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'orange' },  // L型
    { shape: [[0, 0, 1], [1, 1, 1]], color: 'blue' },    // J型
    { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' }   // T型
];

// --- Game Functions ---
function createEmptyBoard() {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

function spawnNewBlock() {
    // ★変更: 7種類からランダムにブロックを選択
    const randomIndex = Math.floor(Math.random() * blockShapes.length);
    const shapeData = blockShapes[randomIndex];
    
    currentBlock = {
        shape: shapeData.shape,
        color: shapeData.color,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shapeData.shape[0].length / 2),
        y: 0
    };

    // ゲームオーバーチェック
    if (checkCollision()) {
        alert("ゲームオーバー！"); // 仮のゲームオーバー処理
        board = createEmptyBoard();
        startTime = performance.now(); // 時間リセット
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = value;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1); // 枠線が見えるように-1
            }
        });
    });

    if (currentBlock) {
        ctx.fillStyle = currentBlock.color;
        currentBlock.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillRect(
                        (currentBlock.x + x) * CELL_SIZE,
                        (currentBlock.y + y) * CELL_SIZE,
                        CELL_SIZE - 1, CELL_SIZE - 1
                    );
                }
            });
        });
    }
}

function update(time = 0) {
    if (startTime === 0) {
        startTime = time; // 最初のフレームで開始時刻を記録
    }
    const deltaTime = time - lastTime;
    lastTime = time;
    
    // ★追加: 経過時間を更新
    const elapsedTime = Math.floor((time - startTime) / 1000);
    timeDisplay.textContent = elapsedTime;

    dropCounter += deltaTime;
    if (dropCounter > DROP_INTERVAL) {
        moveBlockDown();
    }
    
    draw();
    requestAnimationFrame(update);
}

function moveBlockDown() {
    if (!currentBlock) return;
    currentBlock.y++;
    if (checkCollision()) {
        currentBlock.y--;
        placeBlock();
        spawnNewBlock();
    }
    dropCounter = 0;
}

function moveBlockSide(dir) {
    if (!currentBlock) return;
    currentBlock.x += dir;
    if (checkCollision()) {
        currentBlock.x -= dir;
    }
}

// ★追加: 即落下（ハードドロップ）機能
function hardDrop() {
    if (!currentBlock) return;
    while (!checkCollision()) {
        currentBlock.y++;
    }
    currentBlock.y--; // 1つ戻す
    placeBlock();
    spawnNewBlock();
}

function checkCollision() {
    if (!currentBlock) return true; // ブロックがない場合は常に衝突とみなす
    for (let y = 0; y < currentBlock.shape.length; y++) {
        for (let x = 0; x < currentBlock.shape[y].length; x++) {
            if (currentBlock.shape[y][x] !== 0) {
                let newX = currentBlock.x + x;
                let newY = currentBlock.y + y;
                
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }
                if (board[newY] && board[newY][newX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function placeBlock() {
    currentBlock.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // 盤面からはみ出さないようにチェック
                if (currentBlock.y + y < BOARD_HEIGHT) {
                    board[currentBlock.y + y][currentBlock.x + x] = currentBlock.color;
                }
            }
        });
    });
}

// --- Event Listeners ---
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        moveBlockSide(-1);
    } else if (event.key === 'ArrowRight') {
        moveBlockSide(1);
    } else if (event.key === 'ArrowDown') {
        hardDrop(); // ★変更: 即落下を呼び出す
    }
});

document.getElementById('btn-left').addEventListener('click', () => moveBlockSide(-1));
document.getElementById('btn-right').addEventListener('click', () => moveBlockSide(1));
document.getElementById('btn-down').addEventListener('click', () => hardDrop()); // ★変更: 即落下を呼び出す

// --- Initial Start ---
spawnNewBlock();
update();
