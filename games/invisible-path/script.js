// --- ゲーム設定 ---
const TILE_SIZE = 30; // CSSの --tile-size と同じ値

// マップデータ (0:背景, 1:足場, 2:スタート, 3:ゴール)
const stages = [
    null, // stages[1]から使う
    { // ステージ1
        map: [[2, 1, 1, 1, 1, 3]],
        colors: { empty: "#4a90e2", path: "#f5a623" }
    },
    { // ステージ2
        map: [
            [0, 0, 2, 0, 0], [0, 0, 1, 0, 0], [0, 1, 1, 1, 0],
            [0, 1, 0, 1, 0], [0, 1, 1, 1, 3]
        ],
        colors: { empty: "#d0e0d5", path: "#f0e5d8" }
    },
    { // ステージ3
        map: [
            [2, 1, 1, 0, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0], [0, 1, 1, 0, 0, 1, 0],
            [0, 1, 0, 0, 1, 1, 0], [0, 1, 1, 1, 1, 0, 0], [0, 0, 0, 0, 1, 1, 3]
        ],
        colors: { empty: "#808A70", path: "#9A7C70" }
    }
];

let currentStage = 1;
let playerPos = { x: 0, y: 0 };
let isMoving = false;

// --- HTML要素の取得 ---
const board = document.getElementById('game-board');
const player = document.getElementById('player');
const message = document.getElementById('message');
const stageTitle = document.getElementById('stage-title');
// モーダル要素を追加
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const retryButton = document.getElementById('retry-button');

// --- ゲーム開始/リスタート処理 ---
function startGame() {
    resultModal.classList.add('hidden'); // モーダルを隠す
    currentStage = 1;
    setupStage(currentStage);
}

// --- ステージ初期化処理 ---
function setupStage(stageNum) {
    stageTitle.textContent = `ステージ ${stageNum}`;
    message.textContent = '矢印キーでゴールを目指そう！';
    isMoving = false;
    applyStageColors(stageNum);
    generateMap(stageNum);
}

// --- CSS変数を更新する関数 ---
function applyStageColors(stageNum) {
    const stageColors = stages[stageNum].colors;
    const root = document.documentElement;
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
                playerPos = { x: x, y: y };
            }
            if (tileType === 3) tile.classList.add('tile-goal');
            board.appendChild(tile);
        });
    });
    updatePlayerPosition();
}

// --- プレイヤーの位置更新処理 ---
function updatePlayerPosition() {
    const offsetX = (TILE_SIZE - (TILE_SIZE * 0.8)) / 2;
    player.style.transform = `translate(${playerPos.x * TILE_SIZE + offsetX}px, ${playerPos.y * TILE_SIZE + offsetX}px)`;
}

// --- 移動処理 ---
function movePlayer(dx, dy) {
    if (isMoving) return;
    isMoving = true;

    const nextX = playerPos.x + dx;
    const nextY = playerPos.y + dy;
    const mapData = stages[currentStage].map;

    if (nextY < 0 || nextY >= mapData.length || nextX < 0 || nextX >= mapData[0].length) {
        isMoving = false;
        return;
    }

    const destinationTile = mapData[nextY][nextX];
    playerPos = { x: nextX, y: nextY };
    updatePlayerPosition();

    setTimeout(() => {
        if (destinationTile === 0) { // 背景・落下マス
            resultTitle.textContent = '足場から落ちてしまいました…';
            resultMessage.textContent = `
                人によっては、この色の組み合わせが見分けにくいことがあります。
                これは「色覚特性」という個性です。もう一度挑戦しますか？
            `;
            resultModal.classList.remove('hidden');
        } else if (destinationTile === 3) { // ゴール
            currentStage++;
            if (currentStage >= stages.length) { // 全ステージクリア
                resultTitle.textContent = '全ステージクリア！';
                resultMessage.textContent = '素晴らしい！あなたは色の違いを見分ける達人です！';
                resultModal.classList.remove('hidden');
            } else { // 次のステージへ
                message.textContent = 'ステージクリア！';
                setTimeout(() => setupStage(currentStage), 500);
            }
        } else { // 足場 or スタート
            isMoving = false;
        }
    }, 150);
}

// --- イベントリスナーの設定 ---
retryButton.addEventListener('click', startGame);

document.getElementById('btn-up').addEventListener('click', () => movePlayer(0, -1));
document.getElementById('btn-down').addEventListener('click', () => movePlayer(0, 1));
document.getElementById('btn-left').addEventListener('click', () => movePlayer(-1, 0));
document.getElementById('btn-right').addEventListener('click', () => movePlayer(1, 0));

window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': e.preventDefault(); movePlayer(0, -1); break;
        case 'ArrowDown': e.preventDefault(); movePlayer(0, 1); break;
        case 'ArrowLeft': e.preventDefault(); movePlayer(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePlayer(1, 0); break;
    }
});

// --- ゲーム開始 ---
startGame();