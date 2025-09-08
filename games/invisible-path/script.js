// --- ゲーム設定 ---
const TILE_SIZE = 30; // CSSの --tile-size と同じ値

// マップデータ (0:背景, 1:足場, 2:スタート, 3:ゴール)
// ステージ情報に配色を追加
const stages = [
    null, // stages[1]から使う
    { // ステージ1: 誰でもわかる色
        map: [
            [2, 1, 1, 1, 1, 3]
        ],
        colors: {
            empty: "#4a90e2", // 明るい青
            path: "#f5a623"   // 明るいオレンジ
        }
    },
    { // ステージ2: 少し似てきた色
        map: [
            [0, 0, 2, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 1, 0, 1, 0],
            [0, 1, 1, 1, 3]
        ],
        colors: {
            empty: "#d0e0d5", // 薄い緑
            path: "#f0e5d8"   // 薄いベージュ
        }
    },
    { // ステージ3: 赤緑色覚の人に難しい色
        map: [
            [2, 1, 1, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 0],
            [0, 1, 1, 0, 0, 1, 0],
            [0, 1, 0, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 1, 1, 3]
        ],
        colors: {
            empty: "#808A70", // くすんだ緑
            path: "#9A7C70"   // くすんだ赤/茶
        }
    }
];

let currentStage = 1;
let playerPos = { x: 0, y: 0 }; // プレイヤーの現在位置 (マス目)
let isMoving = false; // プレイヤーが移動中かどうかのフラグ

// --- HTML要素の取得 ---
const board = document.getElementById('game-board');
const player = document.getElementById('player');
const message = document.getElementById('message');
const stageTitle = document.getElementById('stage-title');

// --- CSS変数を更新する関数 ---
function applyStageColors(stageNum) {
    const stageColors = stages[stageNum].colors;
    const root = document.documentElement; // <html>要素を取得
    root.style.setProperty('--color-empty', stageColors.empty);
    root.style.setProperty('--color-path', stageColors.path);
}

// --- マップ生成処理 ---
function generateMap(stageNum) {
    const mapData = stages[stageNum].map;
    board.innerHTML = '';
    
    board.style.gridTemplateColumns = `repeat(${mapData[0].length}, 1fr)`;
    board.style.width = `${mapData[0].length * TILE_SIZE}px`;
    board.style.height = `${mapData.length * TILE_SIZE}px`;

    mapData.forEach((row, y) => {
        row.forEach((tileType, x) => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (tileType === 0) tile.classList.add('tile-empty');
            if (tileType === 1) tile.classList.add('tile-path');
            if (tileType === 2) {
                tile.classList.add('tile-start');
                playerPos = { x: x, y: y }; // スタート位置を記録
            }
            if (tileType === 3) tile.classList.add('tile-goal');
            board.appendChild(tile);
        });
    });
    updatePlayerPosition();
}

// --- プレイヤーの位置更新処理 ---
function updatePlayerPosition() {
    const offsetX = (TILE_SIZE - (TILE_SIZE * 0.8)) / 2; // ●をマスの中央に配置するためのオフセット
    player.style.transform = `translate(${playerPos.x * TILE_SIZE + offsetX}px, ${playerPos.y * TILE_SIZE + offsetX}px)`;
}

// --- 移動処理 ---
function movePlayer(dx, dy) {
    if (isMoving) return; // 移動中なら何もしない
    isMoving = true;

    const nextX = playerPos.x + dx;
    const nextY = playerPos.y + dy;
    const mapData = stages[currentStage].map;

    // マップの範囲外かチェック
    if (nextY < 0 || nextY >= mapData.length || nextX < 0 || nextX >= mapData[0].length) {
        isMoving = false;
        return; // 動かない
    }

    const destinationTile = mapData[nextY][nextX];
    playerPos = { x: nextX, y: nextY };
    updatePlayerPosition();

    setTimeout(() => {
        if (destinationTile === 0) { // 背景・落下マス
            message.textContent = '足場から落ちてしまった... 最初からやり直そう。';
            setTimeout(() => {
                setupStage(currentStage);
                isMoving = false;
            }, 800);
        } else if (destinationTile === 3) { // ゴール
            message.textContent = 'ゴール！おめでとう！';
            setTimeout(() => {
                currentStage++;
                if(currentStage >= stages.length) {
                    message.textContent = '全ステージクリア！すごい！';
                    // ここでゲーム終了の処理を追加しても良い
                } else {
                    setupStage(currentStage);
                }
                isMoving = false;
            }, 800);
        } else { // 足場 or スタート
            isMoving = false;
        }
    }, 150); // 移動アニメーションの時間
}

// --- ステージ初期化処理 ---
function setupStage(stageNum) {
    stageTitle.textContent = `ステージ ${stageNum}`;
    message.textContent = '矢印キーでゴールを目指そう！';
    
    applyStageColors(stageNum);
    generateMap(stageNum);
}

// --- イベントリスナーの設定 ---
// 十字キー（UI）
document.getElementById('btn-up').addEventListener('click', () => movePlayer(0, -1));
document.getElementById('btn-down').addEventListener('click', () => movePlayer(0, 1));
document.getElementById('btn-left').addEventListener('click', () => movePlayer(-1, 0));
document.getElementById('btn-right').addEventListener('click', () => movePlayer(1, 0));

// PCのキーボード操作
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': e.preventDefault(); movePlayer(0, -1); break;
        case 'ArrowDown': e.preventDefault(); movePlayer(0, 1); break;
        case 'ArrowLeft': e.preventDefault(); movePlayer(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePlayer(1, 0); break;
    }
});

// --- ゲーム開始 ---
setupStage(currentStage);
