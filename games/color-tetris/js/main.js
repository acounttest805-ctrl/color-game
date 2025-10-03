// js/main.js
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, colorPalettes, blockShapes, CURRENT_SEASON, SEASONS } from './constants.js';
import { ui } from './ui.js';
import { initFirebase, submitScore, getRankings, getPlayerBestScore } from './firebase.js'; 
import { getGuestUserId } from './crypto.js';

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
        alert(`${SEASONS[selectedSeason].name}\n\n${SEASONS[selectedSeason].description}`);
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
        board: Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)),
        currentBlock: null, nextBlock: null, score: 0, startTime: 0, lastTime: 0,
        dropCounter: 0,
        dropInterval: String(CURRENT_SEASON) === "1" ? 680 : 700,
        ceilingY: 0,
        gameMode: mode, animationFrameId: null,
        season: CURRENT_SEASON,
        isGameOver: false
    };
    
    ui.canvas.width = BOARD_WIDTH * CELL_SIZE;
    ui.canvas.height = BOARD_HEIGHT * CELL_SIZE;
    
    ui.showGameScreen();
    
    gameState.nextBlock = createNewBlock(); // 最初のNextブロックを準備
    spawnNewBlock(); // 最初のCurrentブロックを登場させる
    
    gameLoop();
}

// ★★★ gameOver関数を全面的に書き換え ★★★
async function gameOver() {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    
    cancelAnimationFrame(gameState.animationFrameId);
    gameState.animationFrameId = null;

    const encodedId = getGuestUserId();
    
    // 自分の過去の最高スコアと、現在のランキングを並行して取得
    const [playerData, rankings] = await Promise.all([
        getPlayerBestScore(encodedId, gameState.season),
        getRankings(gameState.season)
    ]);
    
    const pastBestScore = playerData ? playerData.score : -1;
    const pastPlayerName = playerData ? playerData.name : "Player";

    // 今回のスコアが過去のベストスコアより低い場合は、ランクイン判定すらせずに終了
    if (gameState.score <= pastBestScore) {
        alert(`ゲームオーバー！\nスコア: ${gameState.score}\nハイスコア: ${pastBestScore}`);
        showTitleScreen();
        return;
    }

    // ランクイン判定
    const lowestAllTime = rankings.allTime.length < 6 ? 0 : rankings.allTime[rankings.allTime.length - 1].score;
    const lowestWeekly = rankings.weekly.length < 6 ? 0 : rankings.weekly[rankings.weekly.length - 1].score;
    
    const isRankedIn = gameState.score > lowestAllTime || gameState.score > lowestWeekly;

    if (isRankedIn) {
        // ランクインした場合のみ名前を尋ねる
        const playerName = prompt(
            `ランキング入り！ ハイスコア更新！\nスコア: ${gameState.score}\n\n名前を入力してください (8文字以内):\n(本名などの個人情報は入力しないでください)`,
            pastPlayerName // ★過去の名前をデフォルト表示
        );
        
        if (playerName !== null) { // キャンセルされなかった場合
            await submitScore(encodedId, playerName, gameState.score, gameState.gameMode, gameState.season);
        }
    } else {
        // ランクインしなかったが、自己ベストは更新した場合
        alert(`ゲームオーバー！ ハイスコア更新！\nスコア: ${gameState.score}`);
        // ランク外なのでスコアは送信しない
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
    if (gameState.dropCounter > gameState.dropInterval) {
        moveBlockDown();
    }
    
    draw();
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    if (gameState.ceilingY > 0) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, ui.canvas.width, gameState.ceilingY * CELL_SIZE);
    }
    gameState.board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = value;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            }
        });
    });
    if (gameState.currentBlock) {
        ctx.fillStyle = gameState.currentBlock.color;
        gameState.currentBlock.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillRect((gameState.currentBlock.x + x) * CELL_SIZE, (gameState.currentBlock.y + y) * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
                }
            });
        });
    }
}

function checkDifficultyUpdate(elapsedTime) {
    const minutes = Math.floor(elapsedTime / 60000);

    if (String(gameState.season) === "1") {
        gameState.ceilingY = Math.min(minutes, 15);
        const intervals = Math.min(minutes, 15);
        gameState.dropInterval = Math.max(80, 680 - (intervals * 20));
    } else { // シーズン0
        gameState.ceilingY = Math.min(minutes, 9);
        const speedUps = Math.floor(elapsedTime / 300000);
        gameState.dropInterval = 700 / Math.pow(2, speedUps);
    }
}

function spawnNewBlock() {
    if (gameState.isGameOver) return;

    gameState.currentBlock = gameState.nextBlock;
    gameState.nextBlock = createNewBlock();
    
    if (gameState.currentBlock) {
        gameState.currentBlock.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(gameState.currentBlock.shape[0].length / 2);
        gameState.currentBlock.y = gameState.ceilingY; // 出現位置を天井に設定
    }
    
    ui.drawNextBlock(gameState.nextBlock);

    if (checkCollision()) {
        gameOver();
    }
}

function createNewBlock() {
    const colors = colorPalettes[gameState.gameMode][`s${gameState.season}`];
    const shapeData = blockShapes[Math.floor(Math.random() * blockShapes.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return {
        shape: shapeData.shape, color: randomColor,
        x: 0, y: 0 // x, yはspawnNewBlockで設定
    };
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
    const placedCoords = [];
    block.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                placedCoords.push({ x: block.x + x, y: block.y + y });
            }
        });
    });
    
    // シーズンごとのルールを適用
    if (String(gameState.season) === "0" || String(gameState.season) === "1") {
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

            if (String(gameState.season) === "1") {
                gameState.score += (sameColorCleared * 4) + (differentColorCleared * 2);
            } else {
                gameState.score += (sameColorCleared * 3) + (differentColorCleared * 1);
            }

            finalClearSet.forEach(coordStr => {
                const [x, y] = coordStr.split(',').map(Number);
                gameState.board[y][x] = 0;
            });
            dropFloatingBlocks();

            const isAllClear = gameState.board.every(row => row.every(cell => cell === 0));
            if (isAllClear) {
                // ★★★ シーズン1の場合のみボーナスを加算 ★★★
                if (String(gameState.season) === "1") {
                    ui.showAllClearEffect();
                    gameState.score += 300;
                }
            }
        }
    }
}

function checkCollision() {
    const block = gameState.currentBlock;
    const board = gameState.board;
    const ceilingY = gameState.ceilingY;
    if (!block) return true;
    for (let y = 0; y < block.shape.length; y++) {
        for (let x = 0; x < block.shape[y].length; x++) {
            if (block.shape[y][x] !== 0) {
                let newX = block.x + x;
                let newY = block.y + y;
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || newY < ceilingY) return true;
                if (board[newY] && board[newY][newX] !== 0) return true;
            }
        }
    }
    return false;
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
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}

function dropFloatingBlocks() {
    const visited = new Set();
    const floatingGroups = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (gameState.board[y][x] !== 0 && !visited.has(`${x},${y}`)) {
                const group = findConnectedGroup(x, y, visited);
                let isSupported = false;
                for (const cell of group) {
                    if (cell.y === BOARD_HEIGHT - 1 || (isValid(cell.x, cell.y + 1) && gameState.board[cell.y + 1][cell.x] !== 0 && !group.some(g => g.x === cell.x && g.y === cell.y + 1))) {
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
                    if (nextY >= BOARD_HEIGHT || (isValid(nextY, cell.x) && gameState.board[nextY][cell.x] !== 0)) {
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
    if (ui.gameScreenWrapper.classList.contains('hidden') || gameState.isGameOver) return;
    if (event.key === 'ArrowLeft') moveBlockSide(-1);
    else if (event.key === 'ArrowRight') moveBlockSide(1);
    else if (event.key === 'ArrowDown') moveBlockDown();
    else if (event.key === 'ArrowUp') hardDrop();
    else if (event.key === 'z' || event.key === 'Z') rotateBlock(-1);
    else if (event.key === 'x' || event.key === 'X') rotateBlock(1);

}
