// js/constants.js
export const BOARD_WIDTH = 13;
export const BOARD_HEIGHT = 18;
export const CELL_SIZE = 30;

export const CURRENT_SEASON = 0;

export const SEASONS = {
    0: {
        name: "シーズン0",
        period: "2025/9/28～10/2",
        description: "同じ色のブロックを隣接させると、そのグループと、周囲の異色ブロックも消滅するクラシックルール。"
    },
    1: {
        name: "シーズン1",
        period: "2025/10/2～10/12",
        description: "新しいルールは準備中です。"
    }
};

export const colorPalettes = {
    normal: [
        '#9D8478', '#7E8B78', '#9182A7', '#738FA8',
        '#A0916C', '#B0C18B', '#D7B9C4', '#B8C5C8'
    ],
    support: [
        '#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6',
        '#e67e22', '#1abc9c', '#ecf0f1'
    ]
};

export const blockShapes = [
    { shape: [[1, 1, 1, 1]] },      // I型
    { shape: [[1, 1], [1, 1]] }, // O型
    { shape: [[0, 1, 1], [1, 1, 0]] },   // S型
    { shape: [[1, 1, 0], [0, 1, 1]] },     // Z型
    { shape: [[1, 0, 0], [1, 1, 1]] },  // L型
    { shape: [[0, 0, 1], [1, 1, 1]] },    // J型
    { shape: [[0, 1, 0], [1, 1, 1]] }   // T型
];