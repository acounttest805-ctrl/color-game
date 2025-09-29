// js/constants.js (Legacy)
export const BOARD_WIDTH = 13;
export const BOARD_HEIGHT = 18;
export const CELL_SIZE = 30;

// 過去のシーズン情報をここに蓄積していく
export const SEASONS = {
    0: {
        name: "シーズン0",
        description: "同じ色のブロックを隣接させると、そのグループと、周囲の異色ブロックも消滅するクラシックルール。"
    },
    // シーズン1が終了したら、ここに情報を追加する
    // 1: { name: "シーズン1", description: "..." }
};

// シーズンごとのカラーパレットを定義
export const colorPalettes = {
    normal: {
        s0: ['#9D8478', '#7E8B78', '#9182A7', '#738FA8', '#A0916C', '#B0C18B', '#D7B9C4', '#B8C5C8'],
        // s1: [...]
    },
    support: {
        s0: ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ecf0f1'],
        // s1: [...]
    }
};

export const blockShapes = [
    { shape: [[1, 1, 1, 1]] },
    { shape: [[1, 1], [1, 1]] },
    { shape: [[0, 1, 1], [1, 1, 0]] },
    { shape: [[1, 1, 0], [0, 1, 1]] },
    { shape: [[1, 0, 0], [1, 1, 1]] },
    { shape: [[0, 0, 1], [1, 1, 1]] },
    { shape: [[0, 1, 0], [1, 1, 1]] }
];