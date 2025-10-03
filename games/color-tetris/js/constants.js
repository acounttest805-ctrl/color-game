// js/constants.js
export const BOARD_WIDTH = 13;
export const BOARD_HEIGHT = 23;
export const CELL_SIZE = 25;

export const CURRENT_SEASON = 1;

export const SEASONS = {
    0: {
        name: "シーズン0",
        period: "2025/09/28～10/02",
        description: `
【プレイエリア】: 縦18マス × 横13マス
【スコア計算】
  - 消えた同色ブロック: 3点
  - 巻き添えで消えた異色ブロック: 1点
【難易度上昇】
  - 天井の降下: 1分ごとに1マス下降 (最大9分)
  - 落下速度: 5分ごとに2倍速
`
    },
    1: {
        name: "シーズン1",
        period: "2025/10/02～10/14",
        description: `
【プレイエリア】: 縦23マス × 横13マス
【スコア計算】
  - 消えた同色ブロック: 4点
  - 巻き添えで消えた異色ブロック: 2点
  - All Clearボーナス: 300点
【難易度上昇】
  - 天井の降下: 1分ごとに1マス下降 (最大15分)
  - 落下速度: 初期680ms。1分ごとに20msずつ加速 (最大15分)
【新機能】
  - 次に落ちてくるブロックが画面に表示されます。
`
    }
};

// ★★★ 称号データを追加 ★★★
export const TITLES = {
    s0_rank1: { name: "シーズン0 1位", icon: "../assets/titles/s0_rank1.png" },
    s0_rank2: { name: "シーズン0 2位", icon: "../assets/titles/s0_rank2.png" },
    s0_rank3: { name: "シーズン0 3位", icon: "../assets/titles/s0_rank3.png" },
};


export const colorPalettes = {
    normal: {
        s0: ['#9D8478', '#7E8B78', '#9182A7', '#738FA8', '#A0916C', '#B0C18B', '#D7B9C4', '#B8C5C8'],
        s1: ['#9D8478', '#7E8B78', '#9182A7', '#738FA8', '#A0916C', '#B0C18B', '#D7B9C4', '#B8C5C8']
    },
    support: {
        s0: ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ecf0f1'],
        s1: [
            '#FF3B30', '#34C759', '#007AFF', '#FFCC00',
            '#AF52DE', '#FF9500', '#5AC8FA', '#FFFFFF'
        ]
    }
};

export const blockShapes = [
    { shape: [[1, 1, 1, 1]] },
    { shape: [[1, 1], [1, 1]] },
    { shape: [[0, 1, 1], [1, 1, 0]] },
    { shape: [[1, 1, 0], [0, 1, 1]] },
    { shape: [[1, 0, 0], [1, 1, 1]] },
    { shape: [[0, 0, 1], [1, 1, 1]] },
    { shape: [[0, 1, 0], [1, 1, 1]] },
    { shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] }
];