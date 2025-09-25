// --- Setup ---
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const timeDisplay = document.getElementById('time-display');
const scoreDisplay = document.getElementById('score-display');
const titleScreen = document.getElementById('title-screen');
const gameScreenWrapper = document.getElementById('game-screen-wrapper');
const normalModeBtn = document.getElementById('normal-mode-btn');
const supportModeBtn = document.getElementById('support-mode-btn');
const backToTitleBtn = document.getElementById('back-to-title-btn');

const BOARD_WIDTH = 13;
const BOARD_HEIGHT = 18;
const CELL_SIZE = 30;

canvas.width = BOARD_WIDTH * CELL_SIZE;
canvas.height = BOARD_HEIGHT * CELL_SIZE;

// --- Game State ---
let board = createEmptyBoard();
let currentBlock = null;
let dropCounter = 0;
let lastTime = 0;
let startTime = 0;
let score = 0;
let dropInterval = 700;
let ceilingY = 0;
let animationFrameId = null;

const colorPalettes = {
    normal: [
        '#9D8478', '#7E8B78', '#9182A7', '#738FA8', '#A0916C',
        '#B0C18B', '#D7B9C4', '#B8C5C8'  
    ],
    support: [
        '#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6',
        '#e67e22', '#1abc9c', '#ecf0f1'
    ]
};
let blockColors = [];

const blockShapes = [
    { shape: [[1, 1, 1, 1]] },      // I型
    { shape: [[1, 1], [1, 1]] }, // O型
    { shape: [[0, 1, 1], [1, 1, 0]] },   // S型
    { shape: [[1, 1, 0], [0, 1, 1]] },     // Z型
    { shape: [[1, 0, 0], [1, 1, 1]] },  // L型
    { shape: [[0, 0, 1], [1, 1, 1]] },    // J型
    { shape: [[0, 1, 0], [1, 1, 1]] }   // T型
];

// --- Game Flow Management ---
function showTitleScreen() {
    titleScreen.classList.remove('hidden');
    gameScreenWrapper.classList.add('hidden');
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function startGame(mode) {
    blockColors = colorPalettes[mode];
    titleScreen.classList.add('hidden');
    gameScreenWrapper.classList.remove('hidden');
    board = createEmptyBoard();
    score = 0;
    dropInterval = 700;
    ceilingY = 0;
    lastTime = 0;
    startTime = 0;
    spawnNewBlock();
    update();
}

// --- Game Functions ---
function createEmptyBoard() {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

function spawnNewBlock() {
    const shapeIndex = Math.floor(Math.random() * blockShapes.length);
    const shapeData = blockShapes[shapeIndex];
    const colorIndex = Math.floor(Math.random() * blockColors.length);
    const randomColor = blockColors[colorIndex];
    currentBlock = {
        shape: shapeData.shape, color: randomColor,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shapeData.shape[0].length / 2),
        y: ceilingY
    };
    if (checkCollision()) {
        alert("ゲームオーバー！");
        showTitleScreen();
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (ceilingY > 0) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, ceilingY * CELL_SIZE);
    }
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = value;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            }
        });
    });
    if (currentBlock) {
        ctx.fillStyle = currentBlock.color;
        currentBlock.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillRect((currentBlock.x + x) * CELL_SIZE, (currentBlock.y + y) * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
                }
            });
        });
    }
}

function update(time = 0) {
    if (startTime === 0) startTime = time;
    const deltaTime = time - lastTime;
    lastTime = time;
    updateUI(time);
    checkDifficultyUpdate(time);
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) moveBlockDown();
    draw();
    animationFrameId = requestAnimationFrame(update);
}

function checkDifficultyUpdate(time) {
    const elapsedTimeInSeconds = (time - startTime) / 1000;
    const minutesPassedForCeiling = Math.floor(elapsedTimeInSeconds / 60);
    ceilingY = Math.min(minutesPassedForCeiling, 9);
    const fiveMinuteIntervals = Math.floor(elapsedTimeInSeconds / 300);
    const baseInterval = 700;
    dropInterval = baseInterval / Math.pow(2, fiveMinuteIntervals);
}

function updateUI(time = 0) {
    const totalSeconds = Math.floor((time - startTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    scoreDisplay.textContent = score;
}

function rotateBlock(dir) {
    if (!currentBlock) return;
    const originalShape = currentBlock.shape;
    const originalX = currentBlock.x;
    const shape = currentBlock.shape;
    const newShape = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]));
    if (dir > 0) { newShape.forEach(row => row.reverse()); }
    else { newShape.reverse(); }
    currentBlock.shape = newShape;
    let offset = 1;
    while (checkCollision()) {
        currentBlock.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentBlock.shape[0].length) {
            currentBlock.shape = originalShape;
            currentBlock.x = originalX;
            return;
        }
    }
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

function hardDrop() {
    if (!currentBlock) return;
    while (!checkCollision()) {
        currentBlock.y++;
    }
    currentBlock.y--;
    placeBlock();
    spawnNewBlock();
}

function checkCollision() {
    if (!currentBlock) return true;
    for (let y = 0; y < currentBlock.shape.length; y++) {
        for (let x = 0; x < currentBlock.shape[y].length; x++) {
            if (currentBlock.shape[y][x] !== 0) {
                let newX = currentBlock.x + x;
                let newY = currentBlock.y + y;
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || newY < ceilingY) {
                    return true;
                }
                if (board[newY] && board[newY][newX] !== 0) return true;
            }
        }
    }
    return false;
}

function placeBlock() {
    currentBlock.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[currentBlock.y + y][currentBlock.x + x] = currentBlock.color;
            }
        });
    });
    const placedCoords = [];
    currentBlock.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                placedCoords.push({ x: currentBlock.x + x, y: currentBlock.y + y });
            }
        });
    });
    const sameColorNeighbors = findSameColorNeighbors(placedCoords, currentBlock.color);
    if (sameColorNeighbors.length > 0) {
        const coreClearSet = new Set();
        placedCoords.forEach(c => coreClearSet.add(`${c.x},${c.y}`));
        sameColorNeighbors.forEach(c => coreClearSet.add(`${c.x},${c.y}`));
        const finalClearSet = findCollateralDamage(coreClearSet);
        let sameColorCleared = 0;
        let differentColorCleared = 0;
        finalClearSet.forEach(coordStr => {
            const [x, y] = coordStr.split(',').map(Number);
            if (board[y][x] === currentBlock.color) {
                sameColorCleared++;
            } else if (board[y][x] !== 0) {
                differentColorCleared++;
            }
        });
        score += sameColorCleared * 3;
        score += differentColorCleared * 1;
        finalClearSet.forEach(coordStr => {
            const [x, y] = coordStr.split(',').map(Number);
            board[y][x] = 0;
        });
        dropFloatingBlocks();
    }
}

function findSameColorNeighbors(coords, color) {
    const neighbors = [];
    const coordSet = new Set(coords.map(c => `${c.x},${c.y}`));
    coords.forEach(c => {
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            const nx = c.x + dx;
            const ny = c.y + dy;
            if (coordSet.has(`${nx},${ny}`)) return;
            if (isValid(nx, ny) && board[ny][nx] === color) {
                neighbors.push({ x: nx, y: ny });
            }
        });
    });
    return neighbors;
}

function findCollateralDamage(coreSet) {
    const finalSet = new Set(coreSet);
    coreSet.forEach(coordStr => {
        const [x, y] = coordStr.split(',').map(Number);
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            if (isValid(nx, ny) && board[ny][nx] !== 0) {
                finalSet.add(`${nx},${ny}`);
            }
        });
    });
    return finalSet;
}

function isValid(x, y) {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}

function dropFloatingBlocks() {
    const visited = new Set();
    const floatingGroups = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const coordStr = `${x},${y}`;
            if (board[y][x] !== 0 && !visited.has(coordStr)) {
                const group = findConnectedGroup(x, y, visited);
                let isSupported = false;
                for (const cell of group) {
                    if (cell.y === BOARD_HEIGHT - 1 || (isValid(cell.x, cell.y + 1) && board[cell.y + 1][cell.x] !== 0 && !group.some(g => g.x === cell.x && g.y === cell.y + 1))) {
                        isSupported = true;
                        break;
                    }
                }
                if (!isSupported) {
                    floatingGroups.push(group);
                }
            }
        }
    }
    
    if (floatingGroups.length > 0) {
        // ★★★ ここからが修正された落下ロジック ★★★
        floatingGroups.forEach(group => {
            let dropDistance = 0;
            let canDrop = true;
            // 1. 落下距離を計算
            while (canDrop) {
                dropDistance++;
                for (const cell of group) {
                    const nextY = cell.y + dropDistance;
                    if (nextY >= BOARD_HEIGHT || (isValid(nextY, cell.x) && board[nextY][cell.x] !== 0 && !group.some(g => g.x === cell.x && g.y === nextY))) {
                        canDrop = false;
                        break;
                    }
                }
            }
            dropDistance--;

            if (dropDistance > 0) {
                // 2. グループを一度盤面から消す
                group.forEach(cell => {
                    board[cell.y][cell.x] = 0;
                });
                // 3. 計算した距離だけ落下させて、盤面に再配置
                group.forEach(cell => {
                    board[cell.y + dropDistance][cell.x] = cell.color;
                });
            }
        });
    }
}

function findConnectedGroup(startX, startY, visited) {
    const group = [];
    const queue = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);
    while (queue.length > 0) {
        const current = queue.shift();
        current.color = board[current.y][current.x];
        group.push(current);
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            const neighbor = { x: current.x + dx, y: current.y + dy };
            const neighborStr = `${neighbor.x},${neighbor.y}`;
            if (isValid(neighbor.x, neighbor.y) && board[neighbor.y][neighbor.x] !== 0 && !visited.has(neighborStr)) {
                visited.add(neighborStr);
                queue.push(neighbor);
            }
        });
    }
    return group;
}

// --- Event Listeners ---
document.addEventListener('keydown', event => {
    if (gameScreenWrapper.classList.contains('hidden')) return;
    if (event.key === 'ArrowLeft') moveBlockSide(-1);
    else if (event.key === 'ArrowRight') moveBlockSide(1);
    else if (event.key === 'ArrowDown') moveBlockDown();
    else if (event.key === 'ArrowUp') hardDrop();
    else if (event.key === 'z' || event.key === 'Z') rotateBlock(-1);
    else if (event.key === 'x' || event.key === 'X') rotateBlock(1);
});

document.getElementById('btn-left').addEventListener('click', () => moveBlockSide(-1));
document.getElementById('btn-right').addEventListener('click', () => moveBlockSide(1));
document.getElementById('btn-down').addEventListener('click', () => moveBlockDown());
document.getElementById('btn-rotate-left').addEventListener('click', () => rotateBlock(-1));
document.getElementById('btn-hard-drop').addEventListener('click', () => hardDrop());
document.getElementById('btn-rotate-right').addEventListener('click', () => rotateBlock(1));
normalModeBtn.addEventListener('click', () => startGame('normal'));
supportModeBtn.addEventListener('click', () => startGame('support'));
backToTitleBtn.addEventListener('click', showTitleScreen);

// --- Initial Load ---
showTitleScreen();