// block.js
// ★★★ この行に CELL_SIZE を追加 ★★★
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, blockShapes, colorPalettes } from './constants.js';

export function createNewBlock(ceilingY, mode) {
    const shapeIndex = Math.floor(Math.random() * blockShapes.length);
    const shapeData = blockShapes[shapeIndex];
    const colors = colorPalettes[mode];
    const colorIndex = Math.floor(Math.random() * colors.length);
    const randomColor = colors[colorIndex];
    
    return {
        shape: shapeData.shape,
        color: randomColor,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shapeData.shape[0].length / 2),
        y: ceilingY
    };
}

export function drawBlock(ctx, block) {
    if (!block) return;
    ctx.fillStyle = block.color;
    block.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // ここで CELL_SIZE が使われている
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

export function rotateBlock(block, board, ceilingY, dir) {
    const originalShape = block.shape;
    const originalX = block.x;
    const newShape = block.shape[0].map((_, colIndex) => block.shape.map(row => row[colIndex]));
    if (dir > 0) newShape.forEach(row => row.reverse());
    else newShape.reverse();
    block.shape = newShape;

    let offset = 1;
    while (checkCollision(block, board, ceilingY)) {
        currentBlock.x += offset; // グローバル変数を参照している可能性を考慮して修正
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > block.shape[0].length + 2) { // 補正範囲を少し広げる
            block.shape = originalShape;
            block.x = originalX;
            return;
        }
    }
}