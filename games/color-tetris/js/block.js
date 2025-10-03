// js/block.js
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, blockShapes, colorPalettes } from './constants.js';

// ★★★ season を引数に追加 ★★★
export function createNewBlock(mode, season) {
    const colors = colorPalettes[mode][`s${season}`];
    const shapeData = blockShapes[Math.floor(Math.random() * blockShapes.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    return {
        shape: shapeData.shape,
        color: randomColor,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shapeData.shape[0].length / 2),
        y: 0
    };
}

export function drawBlock(ctx, block) {
    if (!block) return;
    ctx.fillStyle = block.color;
    block.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillRect(
                    (block.x + x) * CELL_SIZE,
                    (block.y + y) * CELL_SIZE,
                    CELL_SIZE - 1, CELL_SIZE - 1
                );
            }
        });
    });
}

export function checkCollision(block, board, ceilingY) {
    if (!block) return true;
    for (let y = 0; y < block.shape.length; y++) {
        for (let x = 0; x < block.shape[y].length; x++) {
            if (block.shape[y][x] !== 0) {
                let newX = block.x + x;
                let newY = block.y + y;
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || newY < ceilingY) {
                    return true;
                }
                if (board[newY] && board[newY][newX] !== 0) return true;
            }
        }
    }
    return false;
}

export function rotateBlock(block, board, ceilingY, dir) {
    const originalShape = JSON.parse(JSON.stringify(block.shape));
    const originalX = block.x;
    const newShape = block.shape[0].map((_, colIndex) => block.shape.map(row => row[colIndex]));
    if (dir > 0) newShape.forEach(row => row.reverse());
    else newShape.reverse();
    block.shape = newShape;

    let offset = 1;
    while (checkCollision(block, board, ceilingY)) {
        block.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (Math.abs(offset) > block.shape[0].length + 2) {
            block.shape = originalShape;
            block.x = originalX;
            return;
        }
    }
}