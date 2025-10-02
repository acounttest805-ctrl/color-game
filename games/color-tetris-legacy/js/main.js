// js/main.js (Legacy)
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, colorPalettes, blockShapes, SEASONS } from './constants.js';

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const titleScreen = document.getElementById('title-screen');
const gameScreenWrapper = document.getElementById('game-screen-wrapper');
const legacySelectionContainer = document.getElementById('legacy-selection-container');
const timeDisplay = document.getElementById('time-display');
const scoreDisplay = document.getElementById('score-display');
const backToTitleBtn = document.getElementById('back-to-title-btn');

let gameState = {};

export function initGame() {
    for (const seasonNum in SEASONS) {
        const season = SEASONS[seasonNum];
        
        const normalBtn = document.createElement('button');
        normalBtn.className = 'legacy-mode-btn';
        normalBtn.innerHTML = `<h3>${season.name}</h3><p>ノーマルモード</p>`;
        normalBtn.onclick = () => startGame(seasonNum, 'normal');
        legacySelectionContainer.appendChild(normalBtn);

        const supportBtn = document.createElement('button');
        supportBtn.className = 'legacy-mode-btn';
        supportBtn.innerHTML = `<h3>${season.name}</h3><p>色覚サポートモード</p>`;
        supportBtn.onclick = () => startGame(seasonNum, 'support');
        legacySelectionContainer.appendChild(supportBtn);
    }
    
    document.addEventListener('keydown', handleKeydown);
    document.getElementById('btn-left').addEventListener('click', () => moveBlockSide(-1));
    document.getElementById('btn-right').addEventListener('click', () => moveBlockSide(1));
    document.getElementById('btn-down').addEventListener('click', () => moveBlockDown());
    document.getElementById('btn-rotate-left').addEventListener('click', () => rotateBlock(-1));
    document.getElementById('btn-hard-drop').addEventListener('click', () => hardDrop());
    document.getElementById('btn-rotate-right').addEventListener('click', () => rotateBlock(1));
    backToTitleBtn.addEventListener('click', showTitleScreen);

    showTitleScreen();
}

function showTitleScreen() {
    titleScreen.classList.remove('hidden');
    gameScreenWrapper.classList.add('hidden');
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
        gameState.animationFrameId = null;
    }
}

function startGame(season, mode) {
    // シーズン0の定数を適用
    const S0_BOARD_HEIGHT = 18;
    const S0_CELL_SIZE = 30;

    gameState = {
        board: Array.from({ length: S0_BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)),
        currentBlock: null, score: 0, startTime: 0, lastTime: 0,
        dropCounter: 0, dropInterval: 700,
        ceilingY: 0,
        gameMode: mode, animationFrameId: null,
        season: season, isGameOver: false,
        boardHeight: S0_BOARD_HEIGHT, // ゲームステートに保存
        cellSize: S0_CELL_SIZE,       // ゲームステートに保存
    };

    canvas.width = BOARD_WIDTH * gameState.cellSize;
    canvas.height = gameState.boardHeight * gameState.cellSize;
    
    titleScreen.classList.add('hidden');
    gameScreenWrapper.classList.remove('hidden');
    
    spawnNewBlock();
    gameLoop();
}

function gameOver() {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = null;
    
    alert(`ゲームオーバー！\n${SEASONS[gameState.season].name} / ${gameState.gameMode === 'normal' ? 'ノーマル' : '色覚サポート'}\nスコア: ${gameState.score}`);
    showTitleScreen();
}

function gameLoop(time = 0) {
    if (gameState.isGameOver) return;
    if (!gameState.startTime) gameState.startTime = time;
    const deltaTime = time - gameState.lastTime;
    gameState.lastTime = time;

    updateUI(time - gameState.startTime);
    
    if (String(gameState.season) === "0") {
        checkDifficultyUpdate_S0(time - gameState.startTime);
    }
    
    gameState.dropCounter += deltaTime;
    if (gameState.dropCounter > gameState.dropInterval) {
        moveBlockDown();
    }
    
    draw();
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function checkDifficultyUpdate_S0(elapsedTime) {
    const minutes = Math.floor(elapsedTime / 60000);
    gameState.ceilingY = Math.min(minutes, 9);
    const speedUps = Math.floor(elapsedTime / 300000); // 5分ごと
    gameState.dropInterval = 700 / Math.pow(2, speedUps);
}

function updateUI(elapsedTime) {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    scoreDisplay.textContent = gameState.score;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (String(gameState.season) === "0" && gameState.ceilingY > 0) {
        ctx.fillStyle = 'rgba(51, 51, 51, 0.7)';
        ctx.fillRect(0, 0, canvas.width, gameState.ceilingY * gameState.cellSize);
    }

    gameState.board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = value;
                ctx.fillRect(x * gameState.cellSize, y * gameState.cellSize, gameState.cellSize - 1, gameState.cellSize - 1);
            }
        });
    });

    if (gameState.currentBlock) {
        ctx.fillStyle = gameState.currentBlock.color;
        gameState.currentBlock.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillRect((gameState.currentBlock.x + x) * gameState.cellSize, (gameState.currentBlock.y + y) * gameState.cellSize, gameState.cellSize - 1, gameState.cellSize - 1);
                }
            });
        });
    }
}

function spawnNewBlock() {
    if (gameState.isGameOver) return;
    const colors = colorPalettes[gameState.gameMode][`s${gameState.season}`];
    const shapeData = blockShapes[Math.floor(Math.random() * blockShapes.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    gameState.currentBlock = {
        shape: shapeData.shape, color: randomColor,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shapeData.shape[0].length / 2),
        y: String(gameState.season) === "0" ? gameState.ceilingY : 0
    };

    if (checkCollision()) {
        gameOver();
    }
}

function checkCollision() {
    const { currentBlock: block, board, ceilingY, boardWidth, boardHeight } = gameState;
    if (!block) return true;
    for (let y = 0; y < block.shape.length; y++) {
        for (let x = 0; x < block.shape[y].length; x++) {
            if (block.shape[y][x] !== 0) {
                let newX = block.x + x;
                let newY = block.y + y;
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= boardHeight || newY < ceilingY) {
                    return true;
                }
                if (board[newY] && board[newY][newX] !== 0) return true;
            }
        }
    }
    return false;
}


function moveBlockDown() {
    if (!gameState.currentBlock || gameState.isGameOver) return;
    gameState.currentBlock.y++;
    if (checkCollision()) {
        gameState.currentBlock.y--;
        placeBlock();
        spawnNewBlock();
    }
    gameState.dropCounter = 0;
}

function placeBlock() {
    if (gameState.isGameOver) return;
    const block = gameState.currentBlock;
    block.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                gameState.board[block.y + y][block.x + x] = block.color;
            }
        });
    });
    
    if (String(gameState.season) === "0") {
        const placedCoords = [];
        block.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    placedCoords.push({ x: block.x + x, y: block.y + y });
                }
            });
        });
        const sameColorNeighbors = findSameColorNeighbors(placedCoords, block.color);
        if (sameColorNeighbors.length > 0) {
            const coreClearSet = new Set();
            placedCoords.forEach(c => coreClearSet.add(`${c.x},${c.y}`));
            sameColorNeighbors.forEach(c => coreClearSet.add(`${c.x},${c.y}`));
            const finalClearSet = findCollateralDamage(coreClearSet);
            let sameColorCleared = 0, differentColorCleared = 0;
            finalClearSet.forEach(coordStr => {
                const [x, y] = coordStr.split(',').map(Number);
                if (gameState.board[y][x] === block.color) sameColorCleared++;
                else if (gameState.board[y][x] !== 0) differentColorCleared++;
            });
            gameState.score += (sameColorCleared * 3) + (differentColorCleared * 1);
            finalClearSet.forEach(coordStr => {
                const [x, y] = coordStr.split(',').map(Number);
                gameState.board[y][x] = 0;
            });
            dropFloatingBlocks();
        }
    }
}

function rotateBlock(dir) {
    const block = gameState.currentBlock;
    if (!block || gameState.isGameOver) return;
    const originalShape = JSON.parse(JSON.stringify(block.shape));
    const originalX = block.x;
    const newShape = block.shape[0].map((_, colIndex) => block.shape.map(row => row[colIndex]));
    if (dir > 0) newShape.forEach(row => row.reverse());
    else newShape.reverse();
    block.shape = newShape;

    let offset = 1;
    while (checkCollision()) {
        block.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (Math.abs(offset) > block.shape[0].length + 2) {
            block.shape = originalShape;
            block.x = originalX;
            return;
        }
    }
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
    spawnNewBlock();
}

function findSameColorNeighbors(coords, color) {
    const neighbors = [];
    const coordSet = new Set(coords.map(c => `${c.x},${c.y}`));
    coords.forEach(c => {
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            const nx = c.x + dx;
            const ny = c.y + dy;
            if (coordSet.has(`${nx},${ny}`)) return;
            if (isValid(nx, ny) && gameState.board[ny][nx] === color) {
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
            if (isValid(nx, ny) && gameState.board[ny][nx] !== 0) {
                finalSet.add(`${nx},${ny}`);
            }
        });
    });
    return finalSet;
}

function isValid(x, y) {
    return x >= 0 && x < gameState.boardWidth && y >= 0 && y < gameState.boardHeight;
}

function dropFloatingBlocks() {
    const visited = new Set();
    const floatingGroups = [];
    for (let y = 0; y < gameState.boardHeight; y++) {
        for (let x = 0; x < gameState.boardWidth; x++) {
            if (gameState.board[y][x] !== 0 && !visited.has(`${x},${y}`)) {
                const group = findConnectedGroup(x, y, visited);
                let isSupported = false;
                for (const cell of group) {
                    if (cell.y === gameState.boardHeight - 1 || (isValid(cell.x, cell.y + 1) && gameState.board[cell.y + 1][cell.x] !== 0 && !group.some(g => g.x === cell.x && g.y === cell.y + 1))) {
                        isSupported = true;
                        break;
                    }
                }
                if (!isSupported) floatingGroups.push(group);
            }
        }
    }
    if (floatingGroups.length > 0) {
        floatingGroups.forEach(group => {
            group.forEach(cell => { gameState.board[cell.y][cell.x] = 0; });
        });
        floatingGroups.forEach(group => {
            let dropDistance = 0;
            let canDrop = true;
            while (canDrop) {
                dropDistance++;
                for (const cell of group) {
                    const nextY = cell.y + dropDistance;
                    if (nextY >= gameState.boardHeight || (isValid(nextY, cell.x) && gameState.board[nextY][cell.x] !== 0)) {
                        canDrop = false;
                        break;
                    }
                }
            }
            dropDistance--;
            group.forEach(cell => { gameState.board[cell.y + dropDistance][cell.x] = cell.color; });
        });
    }
}

function findConnectedGroup(startX, startY, visited) {
    const group = [];
    const queue = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);
    while (queue.length > 0) {
        const current = queue.shift();
        current.color = gameState.board[current.y][current.x];
        group.push(current);
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            const neighbor = { x: current.x + dx, y: current.y + dy };
            const neighborStr = `${neighbor.x},${neighbor.y}`;
            if (isValid(neighbor.x, neighbor.y) && gameState.board[neighbor.y][neighbor.x] !== 0 && !visited.has(neighborStr)) {
                visited.add(neighborStr);
                queue.push(neighbor);
            }
        });
    }
    return group;
}

function handleKeydown(event) {
    if (gameScreenWrapper.classList.contains('hidden') || gameState.isGameOver) return;
    if (event.key === 'ArrowLeft') moveBlockSide(-1);
    else if (event.key === 'ArrowRight') moveBlockSide(1);
    else if (event.key === 'ArrowDown') moveBlockDown();
    else if (event.key === 'ArrowUp') hardDrop();
    else if (event.key === 'z' || event.key === 'Z') rotateBlock(-1);
    else if (event.key === 'x' || event.key === 'X') rotateBlock(1);
}