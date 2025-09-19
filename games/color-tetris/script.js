// --- Setup ---
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const timeDisplay = document.getElementById('time-display');

const BOARD_WIDTH = 13;
const BOARD_HEIGHT = 25;
const CELL_SIZE = 22;

canvas.width = BOARD_WIDTH * CELL_SIZE;
canvas.height = BOARD_HEIGHT * CELL_SIZE;

// --- Game State ---
let board = createEmptyBoard();
let currentBlock = null;
let dropCounter = 0;
let lastTime = 0;
let startTime = 0;
const DROP_INTERVAL = 700;

// ★★★ 変更点 ★★★
const blockColors = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6']; // Red, Green, Blue, Yellow, Purple

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
        shape: shapeData.shape,
        color: randomColor,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shapeData.shape[0].length / 2),
        y: 0
    };

    if (checkCollision()) {
        alert("ゲームオーバー！");
        board = createEmptyBoard();
        startTime = performance.now();
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    if (startTime === 0) startTime = time;
    const deltaTime = time - lastTime;
    lastTime = time;
    
    const elapsedTime = Math.floor((time - startTime) / 1000);
    timeDisplay.textContent = elapsedTime;

    dropCounter += deltaTime;
    if (dropCounter > DROP_INTERVAL) {
        moveBlockDown();
    }
    
    draw();
    requestAnimationFrame(update);
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
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
                if (board[newY] && board[newY][newX] !== 0) return true;
            }
        }
    }
    return false;
}

function placeBlock() {
    const placedCoords = [];
    currentBlock.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                placedCoords.push({ x: currentBlock.x + x, y: currentBlock.y + y });
            }
        });
    });

    const toClear = checkBlocksToClear(placedCoords, currentBlock.color);

    placedCoords.forEach(coord => {
        const isClearing = toClear.some(c => c.x === coord.x && c.y === coord.y);
        if (!isClearing) {
            board[coord.y][coord.x] = currentBlock.color;
        }
    });

    if (toClear.length > 0) {
        dropFloatingBlocks();
    }
}

function checkBlocksToClear(coords, color) {
    const toClear = [];
    coords.forEach(coord => {
        const { x, y } = coord;
        if (!isValid(x, y)) return;
        const { sameColorFaces, differentColorFaces } = countAdjacentFaces(x, y, color, coords);
        if (sameColorFaces > differentColorFaces) {
            toClear.push({ x, y });
        }
    });
    return toClear;
}

function countAdjacentFaces(x, y, myColor, placedCoords) {
    let sameColorFaces = 0;
    let differentColorFaces = 0;
    
    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;

        const isPartOfPlacedBlock = placedCoords.some(c => c.x === nx && c.y === ny);
        if (isPartOfPlacedBlock) {
            return;
        }

        if (isValid(nx, ny) && board[ny][nx] !== 0) {
            if (board[ny][nx] === myColor) {
                sameColorFaces++;
            } else {
                differentColorFaces++;
            }
        }
    });
    return { sameColorFaces, differentColorFaces };
}

function isValid(x, y) {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}

function dropFloatingBlocks() {
    for (let x = 0; x < BOARD_WIDTH; x++) {
        let emptySpace = -1;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (board[y][x] === 0 && emptySpace === -1) {
                emptySpace = y;
            } else if (board[y][x] !== 0 && emptySpace !== -1) {
                board[emptySpace][x] = board[y][x];
                board[y][x] = 0;
                emptySpace--;
            }
        }
    }
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
