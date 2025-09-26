// board.js
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE } from './constants.js';

export function createEmptyBoard() {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

export function drawBoard(ctx, board, ceilingY) {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = value;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            }
        });
    });

    if (ceilingY > 0) {
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, BOARD_WIDTH * CELL_SIZE, ceilingY * CELL_SIZE);
    }
}

function isValid(x, y) {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}


function findSameColorNeighbors(board, coords, color) {
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

function findCollateralDamage(board, coreSet) {
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

function findConnectedGroup(board, startX, startY, visited) {
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

function dropFloatingBlocks(board) {
    const visited = new Set();
    const floatingGroups = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x] !== 0 && !visited.has(`${x},${y}`)) {
                const group = findConnectedGroup(board, x, y, visited);
                let isSupported = false;
                for (const cell of group) {
                    if (cell.y === BOARD_HEIGHT - 1 || (isValid(cell.x, cell.y + 1) && board[cell.y + 1][cell.x] !== 0 && !group.some(g => g.x === cell.x && g.y === cell.y + 1))) {
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
            group.forEach(cell => { board[cell.y][cell.x] = 0; });
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
            group.forEach(cell => { board[cell.y + dropDistance][cell.x] = cell.color; });
        });
    }
}

export function placeBlockOnBoard(board, block) {
    let score = 0;
    const placedCoords = [];
    block.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[block.y + y][block.x + x] = block.color;
                placedCoords.push({ x: block.x + x, y: block.y + y });
            }
        });
    });

    const sameColorNeighbors = findSameColorNeighbors(board, placedCoords, block.color);
    if (sameColorNeighbors.length > 0) {
        const coreClearSet = new Set();
        placedCoords.forEach(c => coreClearSet.add(`${c.x},${c.y}`));
        sameColorNeighbors.forEach(c => coreClearSet.add(`${c.x},${c.y}`));
        const finalClearSet = findCollateralDamage(board, coreClearSet);

        let sameColorCleared = 0;
        let differentColorCleared = 0;
        finalClearSet.forEach(coordStr => {
            const [x, y] = coordStr.split(',').map(Number);
            if (board[y][x] === block.color) sameColorCleared++;
            else if (board[y][x] !== 0) differentColorCleared++;
        });
        score = (sameColorCleared * 3) + (differentColorCleared * 1);
        
        finalClearSet.forEach(coordStr => {
            const [x, y] = coordStr.split(',').map(Number);
            board[y][x] = 0;
        });
        
        dropFloatingBlocks(board);
    }
    return score;
}