// --- Stage Data ---
const stages = [
    null, // stages[1]から
    { // ステージ1: 変更なし
        rows: 11, cols: 8, colors: { base: '#3465a4', highlight: '#a9cce3' }, 
        pattern: [ /* 2 */ [0,1,1,1,1,1,1,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,0,0,0,0,1,0,0],[0,0,0,0,1,0,0,0],[0,0,0,1,0,0,0,0],[0,0,1,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,1,1,1,1,1,0], ] 
    },
    { // ★ステージ2: 配色を変更して難易度UP
        rows: 11, cols: 8, colors: { base: '#8f7b66', highlight: '#a18a72' }, 
        pattern: [ /* 6 */ [0,0,1,1,1,1,0,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,1,1,1,1,0,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,0,1,1,1,1,0,0],[0,0,0,0,0,0,0,0], ] 
    },
    { // ★ステージ3: 配色を変更して難易度UP
        rows: 11, cols: 10, colors: { base: '#7f9d92', highlight: '#7294a0' }, 
        pattern: [ /* smile */ [0,0,0,0,0,0,0,0,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,1,0],[0,0,1,0,0,0,0,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0], ] 
    },
    { // ★ステージ4: 配色を変更して難易度UP
        rows: 11, cols: 10, colors: { base: '#d3b8ae', highlight: '#c7aca1' }, 
        pattern: [ /* apple */ [0,0,0,0,1,1,0,0,0,0],[0,0,0,1,1,0,0,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,1,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0], ] 
    },
    { // ★ステージ5: 配色を変更して難易度UP
        rows: 12, cols: 10, colors: { base: '#555555', highlight: '#6a6a6a' }, 
        pattern: [ /* 色 */ [0,0,0,0,0,0,0,0,0,0],[0,1,1,1,0,0,1,1,1,0],[0,0,1,0,0,0,0,1,0,0],[0,0,1,0,1,1,1,1,1,0],[0,0,1,0,0,0,0,1,0,0],[0,1,1,1,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,0,0,0],[0,1,0,0,0,0,0,1,0,0],[0,1,0,0,0,0,0,1,0,0],[0,0,1,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0], ] 
    },
    { // ★★★ ステージ6: 新規追加 ★★★
        rows: 11, cols: 11, colors: { base: '#808A70', highlight: '#9A7C70' }, 
        pattern: 'random' // 'random'という特別なキーワードを設定
    }
];

// --- Elements ---
const sampleBoard = document.getElementById('sample-board');
const userBoard = document.getElementById('user-board');
const stageTitle = document.getElementById('stage-title');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const nextStageButton = document.getElementById('next-stage-button');

let currentStage = 1;
let currentPattern = []; // ★追加: 現在のステージのパターンを保持する変数

// --- Functions ---
function setupStage(stageNum) {
    const stageData = stages[stageNum];
    stageTitle.textContent = `ステージ ${stageNum}`;
    
    // ★ステージ6のランダム生成処理を追加
    if (stageData.pattern === 'random') {
        currentPattern = generateRandomPattern(stageData.rows, stageData.cols);
    } else {
        currentPattern = stageData.pattern;
    }

    const root = document.documentElement;
    root.style.setProperty('--base-color', stageData.colors.base);
    root.style.setProperty('--highlight-color', stageData.colors.highlight);

    createBoard(sampleBoard, stageData, false);
    createBoard(userBoard, stageData, true);
}

// ★追加：ランダムなパターンを生成する関数
function generateRandomPattern(rows, cols) {
    const pattern = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(Math.round(Math.random())); // 0か1をランダムに生成
        }
        pattern.push(row);
    }
    return pattern;
}

function createBoard(container, stageData, isUserBoard) {
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${stageData.cols}, 1fr)`;
    
    const flatPattern = currentPattern.flat(); // ★修正: グローバルなcurrentPatternを参照

    for (let i = 0; i < stageData.rows * stageData.cols; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        if (isUserBoard) {
            cell.dataset.state = 0;
            cell.addEventListener('click', handleCellClick);
        } else {
            if (flatPattern[i] === 1) {
                cell.style.backgroundColor = 'var(--highlight-color)';
            }
        }
        container.appendChild(cell);
    }
}

function handleCellClick(event) {
    const cell = event.target;
    const currentState = parseInt(cell.dataset.state, 10);
    const newState = 1 - currentState;
    
    cell.dataset.state = newState;
    cell.style.backgroundColor = newState === 1 ? 'var(--highlight-color)' : 'var(--base-color)';
    
    checkWinCondition();
}

function checkWinCondition() {
    const userCells = userBoard.querySelectorAll('.grid-cell');
    const flatPattern = currentPattern.flat(); // ★修正: グローバルなcurrentPatternを参照

    const isMatch = Array.from(userCells).every((cell, i) => {
        return parseInt(cell.dataset.state, 10) === flatPattern[i];
    });

    if (isMatch) {
        if (currentStage >= stages.length - 1) { // 最終ステージの場合
            resultTitle.textContent = '全ステージクリア！';
            nextStageButton.textContent = 'もう一度挑戦する';
        } else {
            resultTitle.textContent = `ステージ ${currentStage} クリア！`;
            nextStageButton.textContent = '次のステージへ';
        }
        resultModal.classList.remove('hidden');
    }
}

function goToNextStage() {
    resultModal.classList.add('hidden');
    currentStage++;
    if (currentStage >= stages.length) {
        currentStage = 1;
    }
    setupStage(currentStage);
}

// --- Event Listeners ---
nextStageButton.addEventListener('click', goToNextStage);

// --- Initial Start ---
setupStage(currentStage);
