// --- ゲーム設定 ---
const TILE_SIZE = 30; // CSSの --tile-size と同じ値

// マップデータ (0:背景, 1:足場, 2:スタート, 3:ゴール)
const maps = [
    null, // maps[1]から使う
    [ // ステージ1: 簡単な直線
        [2, 1, 1, 1, 1, 3]
    ],
    [ // ステージ2: 少し曲がる
        [0, 0, 2, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 1, 1, 1, 3]
    ],
    [ // ステージ3: 複雑な道
        [2, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0, 1, 0],
        [0, 1, 0, 0, 1, 1, 0],
        [0, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 1, 1, 3]
    ]
];

let currentStage = 1;
let playerPos = { x: 0, y: 0 }; // プレイヤーの現在位置 (マス目)

// --- HTML要素の取得 ---
const board = document.getElementById('game-board');
const player = document.getElementById('player');
const message = document.getElementById('message');
const stageTitle = document.getElementById('stage-title');

// --- マップ生成処理 ---
function generateMap(stageNum) {
    const mapData = maps[stageNum];
    board.innerHTML = '';
    
    // CSSグリッドの列数を設定
    board.style.gridTemplateColumns = `repeat(${mapData[0].length}, 1fr)`;
    // コンテナのサイズをマップに合わせる
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
    const nextX = playerPos.x + dx;
    const nextY = playerPos.y + dy;
    const mapData = maps[currentStage];

    // マップの範囲外かチェック
    if (nextY < 0 || nextY >= mapData.length || nextX < 0 || nextX >= mapData[0].length) {
        return; // 動かない
    }

    const destinationTile = mapData[nextY][nextX];

    if (destinationTile === 0) { // 背景・落下マス
        message.textContent = '足場から落ちてしまった... 最初からやり直そう。';
        setTimeout(() => setupStage(currentStage), 1000); // 1秒後にリスタート
    } else if (destinationTile === 3) { // ゴール
        playerPos = { x: nextX, y: nextY };
        updatePlayerPosition();
        message.textContent = 'ゴール！おめでとう！';
        setTimeout(() => {
            currentStage++;
            if(currentStage >= maps.length) {
                message.textContent = '全ステージクリア！すごい！';
            } else {
                setupStage(currentStage);
            }
        }, 1000); // 1秒後に次のステージへ
    } else { // 足場 or スタート
        playerPos = { x: nextX, y: nextY };
        updatePlayerPosition();
    }
}

// --- ステージ初期化処理 ---
function setupStage(stageNum) {
    stageTitle.textContent = `ステージ ${stageNum}`;
    message.textContent = '矢印キーでゴールを目指そう！';
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
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
    }
});

// --- ゲーム開始 ---
setupStage(currentStage);