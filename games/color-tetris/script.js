// --- Setup ---
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const timeDisplay = document.getElementById('time-display');
const scoreDisplay = document.getElementById('score-display');

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
let dropInterval = 700; // ★ constからletに変更
let ceilingY = 0; // ★追加: 盤面の上限 (狭まっていく)

const blockColors = [
    '#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6',
    '#e67e22', '#1abc9c', '#ecf0f1'
];

const blockShapes = [
    { shape: [[1, 1, 1, 1]] },      // I型
    { shape: [[1, 1], [1, 1]] }, // O型
    { shape: [[0, 1, 1], [1, 1, 0]] },   // S型
    { shape: [[1, 1, 0], [0, 1, 1]] },     // Z型
    { shape: [[1, 0, 0], [1, 1, 1]] },  // L型
    { shape: [[0, 0, 1], [1, 1, 1]] },    // J型
    { shape: [[0, 1, 0], [1, 1, 1]] }   // T型
];

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
        y: ceilingY // ★変更: 盤面の上限から出現
    };

    if (checkCollision()) {
        alert("ゲームオーバー！");
        board = createEmptyBoard();
        startTime = performance.now();
        score = 0;
        dropInterval = 700; // リセット
        ceilingY = 0;       // リセット
        updateUI(performance.now());
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ★追加: 狭まったエリアをグレーで描画
    if (ceilingY > 0) {
        ctx.fillStyle = '#333'; // グレー
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
    
    // ★追加: 難易度調整ロジック
    checkDifficultyUpdate(time);

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) { // ★変更: dropIntervalを参照
        moveBlockDown();
    }
    
    draw();
    requestAnimationFrame(update);
}

// ★追加: 時間経過による難易度上昇を管理する関数
function checkDifficultyUpdate(time) {
    const elapsedTimeInSeconds = (time - startTime) / 1000;

    // 1. 1分ごとに盤面を狭める
    const minutesPassedForCeiling = Math.floor(elapsedTimeInSeconds / 60);
    // 9分(540秒)まで狭める
    ceilingY = Math.min(minutesPassedForCeiling, 9); 

    // 2. 5分ごとに速度を上げる
    const fiveMinuteIntervals = Math.floor(elapsedTimeInSeconds / 300); // 300秒 = 5分
    const baseInterval = 700;
    dropInterval = baseInterval / Math.pow(2, fiveMinuteIntervals);
}

function updateUI(time = 0) {
    const elapsedTime = Math.floor((time - startTime) / 1000);
    timeDisplay.textContent = elapsedTime;
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
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || 
                    newY < ceilingY // ★追加: 天井との衝突判定
                ) {
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
        floatingGroups.forEach(group => {
            group.forEach(cell => {
                board[cell.y][cell.x] = 0;
            });
        });
        floatingGroups.forEach(group => {
            let dropDistance = 0;
            let canDrop = true;
            while (canDrop) {
                dropDistance++;
                for (const cell of group) {
                    const nextY = cell.y + dropDistance;
                    if (nextY >= BOARD_HEIGHT || (isValid(nextY, cell.x) && board[nextY][cell.x] !== 0)) {
                        canDrop = false;
                        break;
                    }
                }
            }
            dropDistance--;
            group.forEach(cell => {
                board[cell.y + dropDistance][cell.x] = cell.color;
            });
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
    if (event.key === 'ArrowLeft') moveBlockSide(-1);
    else if (event.key === 'ArrowRight') moveBlockSide(1);
    else if (event.key === 'ArrowDown') moveBlockDown();
    else if (event.key === 'ArrowUp') hardDrop();
    else if (event.key === 'z' || event.key === 'Z') rotateBlock(-1);
    else if (event.key === 'x' || event.key === 'X') rotateBlock(1);
});

document.getElementById('btn-left').addEventListener('click', () => moveBlockSide(-1));
document.getElementById('btn-right').addEventListener('click', () => moveBlockSide(1));
document.getElementById('btn-down').addEventListener('click', () => hardDrop());

// --- Initial Start ---
spawnNewBlock();
update();