// --- ゲーム設定 ---
// 各ステージの設定: [マスの数(N*N), 不正解の色, 正解の色]
const stages = [
    null, // stages[1]から使うため0番目は空にする
    { grid: 2, wrongColor: "#0000FF", correctColor: "#FFFF00" }, // Stage 1: 誰でもわかる青と黄色
    { grid: 3, wrongColor: "#f08080", correctColor: "#f49a9a" }, // Stage 2: 少し似た色
    { grid: 4, wrongColor: "#808A70", correctColor: "#9A7C70" }, // Stage 3: 赤緑色覚の人に難しい色
    { grid: 5, wrongColor: "#7f9d92", correctColor: "#7294a0" }, // Stage 4: 別の難しい色の組み合わせ
    // ... ここにさらに難しいステージを追加していく
];

let currentStage = 1;
let timerId;
let timeLeft = 30;

// --- HTML要素の取得 ---
const board = document.getElementById('game-board');
const stageDisplay = document.getElementById('stage-display');
const timerDisplay = document.getElementById('timer-display');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const retryButton = document.getElementById('retry-button');


// --- ゲーム開始処理 ---
function startGame() {
    // モーダルを隠す
    resultModal.classList.add('hidden');
    currentStage = 1;
    timeLeft = 30;
    setupStage(currentStage);
    startTimer();
}

// --- ステージ設定処理 ---
function setupStage(stageNum) {
    if (stageNum >= stages.length) {
        gameClear();
        return;
    }

    const stageData = stages[stageNum];
    const gridSize = stageData.grid;
    const totalTiles = gridSize * gridSize;

    // 正解のタイルの位置をランダムに決める
    const correctTileIndex = Math.floor(Math.random() * totalTiles);

    // ボードをクリアし、グリッドのレイアウトを設定
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // タイルを生成してボードに追加
    for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('div');
        tile.classList.add('color-tile');

        if (i === correctTileIndex) {
            tile.style.backgroundColor = stageData.correctColor;
            tile.dataset.correct = "true"; // 正解タイルに印をつける
        } else {
            tile.style.backgroundColor = stageData.wrongColor;
        }

        tile.addEventListener('click', handleTileClick);
        board.appendChild(tile);
    }

    // 表示を更新
    stageDisplay.textContent = `ステージ: ${stageNum}`;
}

// --- タイルクリック処理 ---
function handleTileClick(event) {
    if (event.target.dataset.correct === "true") {
        // 正解！
        currentStage++;
        setupStage(currentStage);
    } else {
        // 不正解
        gameOver(currentStage);
    }
}

// --- タイマー処理 ---
function startTimer() {
    timerId = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `時間: ${timeLeft}`;
        if (timeLeft <= 0) {
            gameOver(currentStage);
        }
    }, 1000);
}

// --- ゲームオーバー処理 ---
function gameOver(stageNum) {
    clearInterval(timerId); // タイマーを止める
    resultModal.classList.remove('hidden');
    resultTitle.textContent = `ステージ ${stageNum} で時間切れです`;
    
    // ここで丁寧なメッセージを表示
    resultMessage.textContent = `
        人によっては、特定の色と色の組み合わせが見分けにくいことがあります。
        これは「色覚特性」と呼ばれる個性の一つです。
        このアプリは医学的な診断を行うものではありませんが、もしご自身の色の見え方に興味を持たれた場合は、眼科などの専門機関に相談することをお勧めします。
    `;
}

// --- ゲームクリア処理 ---
function gameClear() {
    clearInterval(timerId);
    resultModal.classList.remove('hidden');
    resultTitle.textContent = "全ステージクリア！";
    resultMessage.textContent = "素晴らしい！あなたは色の違いを見分ける達人です！";
}

// --- リトライボタンの処理 ---
retryButton.addEventListener('click', startGame);

// --- ゲーム開始 ---
startGame();
