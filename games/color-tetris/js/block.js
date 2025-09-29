// color-tetris/js/block.js
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
                // BOARD_HEIGHT >= newY の条件は、ブロックがボード外に出る（上にはみ出る）ことを防ぐ
                // newY >= ceilingY は、ゲームオーバーラインを考慮
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || newY < ceilingY) return true;
                if (board[newY] && board[newY][newX] !== 0) return true;
            }
        });
    }
    return false;
}

export function rotateBlock(block, board, ceilingY, dir) {
    // 回転前のブロックの状態を保存
    const originalShape = JSON.parse(JSON.stringify(block.shape)); // ディープコピー
    const originalX = block.x;
    const originalY = block.y;

    // ブロックの回転ロジック（転置 + 行または列の反転）
    const newShape = block.shape[0].map((_, colIndex) => block.shape.map(row => row[colIndex]));
    if (dir > 0) { // 時計回り
        newShape.forEach(row => row.reverse());
    } else { // 反時計回り
        newShape.reverse();
    }
    block.shape = newShape;

    // 壁蹴り（Wall Kick）処理
    let offset = 1;
    while (checkCollision(block, board, ceilingY)) {
        block.x += offset; // ★修正: block.x を使用
        offset = -(offset + (offset > 0 ? 1 : -1)); // 左右に交互に動く
        // 補正の試行回数に上限を設ける
        if (Math.abs(offset) > block.shape[0].length + 2) { 
            // 補正範囲を超えたら元の状態に戻す
            block.shape = originalShape;
            block.x = originalX;
            block.y = originalY; // ★修正: Y座標も元に戻す
            return; // 回転失敗
        }
    }
    // 回転成功（衝突がなければそのまま、衝突があれば補正された位置）
}
