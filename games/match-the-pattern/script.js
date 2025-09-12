// --- Stage Data ---
const stages = [ /* ... (変更なし) ... */ ];

// --- Elements ---
const sampleBoard = document.getElementById('sample-board');
const userBoard = document.getElementById('user-board');
const stageTitle = document.getElementById('stage-title');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const nextStageButton = document.getElementById('next-stage-button');
const skipButton = document.getElementById('skip-button'); // ★追加

let currentStage = 1;
let currentPattern = [];
let isDragging = false; // ★追加：ドラッグ中かどうかのフラグ

// --- Functions ---
function setupStage(stageNum) {
    const stageData = stages[stageNum];
    stageTitle.textContent = `ステージ ${stageNum}`;
    
    // ★スキップボタンの表示/非表示を制御
    if (stageNum >= 1 && stageNum <= 5) {
        skipButton.style.display = 'inline-block';
    } else {
        skipButton.style.display = 'none';
    }

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

function generateRandomPattern(rows, cols) {
    const pattern = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(Math.round(Math.random()));
        }
        pattern.push(row);
    }
    return pattern;
}

function createBoard(container, stageData, isUserBoard) {
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${stageData.cols}, 1fr)`;
    
    const flatPattern = currentPattern.flat();

    for (let i = 0; i < stageData.rows * stageData.cols; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        if (isUserBoard) {
            cell.dataset.state = 0;
            // ★★★ なぞり操作（ドラッグ）対応のためのイベントリスナー変更 ★★★
            cell.addEventListener('mousedown', handleDragStart);
            cell.addEventListener('mouseenter', handleDragEnter);
            // スマホ用のタッチイベント
            cell.addEventListener('touchstart', handleDragStart, { passive: false });
            cell.addEventListener('touchmove', handleTouchMove, { passive: false });
        } else {
            if (flatPattern[i] === 1) {
                cell.style.backgroundColor = 'var(--highlight-color)';
            }
        }
        container.appendChild(cell);
    }
}

// --- ドラッグ（なぞり）操作のハンドラ ---
function handleDragStart(event) {
    event.preventDefault();
    isDragging = true;
    toggleCellColor(event.target); // 最初にクリックしたセルも色を変える
}

function handleDragEnter(event) {
    if (isDragging) {
        toggleCellColor(event.target);
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    if (isDragging) {
        const touch = event.touches[0];
        // 指の位置にある要素を取得
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.classList.contains('grid-cell')) {
            toggleCellColor(element);
        }
    }
}

// ドラッグ終了を検知するために、より広い範囲(window)にリスナーを設定
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('touchend', () => isDragging = false);


function toggleCellColor(cell) {
    // 既に処理済みのセルを再度処理しないようにする（任意）
    if (cell.isToggledInDrag) return;

    const currentState = parseInt(cell.dataset.state, 10);
    const newState = 1 - currentState;
    
    cell.dataset.state = newState;
    cell.style.backgroundColor = newState === 1 ? 'var(--highlight-color)' : 'var(--base-color)';
    
    // ドラッグ中に同じセルを何度も反転させないためのフラグ
    cell.isToggledInDrag = true;
    setTimeout(() => { delete cell.isToggledInDrag; }, 100);

    // 色を変えた直後に毎回チェックすると重くなる可能性があるので、
    // ドラッグ終了時にチェックするなど最適化も可能ですが、まずはこの実装で。
    checkWinCondition();
}

function checkWinCondition() {
    const userCells = userBoard.querySelectorAll('.grid-cell');
    const flatPattern = currentPattern.flat();

    const isMatch = Array.from(userCells).every((cell, i) => {
        return parseInt(cell.dataset.state, 10) === flatPattern[i];
    });

    if (isMatch) {
        if (currentStage >= stages.length - 1) {
            resultTitle.textContent = '全ステージクリア！';
            nextStageButton.textContent = 'もう一度挑戦する';
        } else {
            resultTitle.textContent = `ステージ ${currentStage} クリア！`;
            nextStageButton.textContent = '次のステージへ';
        }
        resultModal.classList.remove('hidden');
    }
}

function skipStage() {
    // 念のため最終ステージではスキップできないようにする
    if (currentStage < stages.length - 1) {
        currentStage++;
        setupStage(currentStage);
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
skipButton.addEventListener('click', skipStage); // ★追加

// --- Initial Start ---
setupStage(currentStage);


// --- Stage Data (変更なし) ---
const stages = [
    null,
    { rows: 11, cols: 8, colors: { base: '#3465a4', highlight: '#a9cce3' }, pattern: [ [0,1,1,1,1,1,1,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,0,0,0,0,1,0,0],[0,0,0,0,1,0,0,0],[0,0,0,1,0,0,0,0],[0,0,1,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,1,1,1,1,1,0], ] },
    { rows: 11, cols: 8, colors: { base: '#8f7b66', highlight: '#a18a72' }, pattern: [ [0,0,1,1,1,1,0,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,1,1,1,1,0,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,0,1,1,1,1,0,0],[0,0,0,0,0,0,0,0], ] },
    { rows: 11, cols: 10, colors: { base: '#7f9d92', highlight: '#7294a0' }, pattern: [ [0,0,0,0,0,0,0,0,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,1,0],[0,0,1,0,0,0,0,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0], ] },
    { rows: 11, cols: 10, colors: { base: '#d3b8ae', highlight: '#c7aca1' }, pattern: [ [0,0,0,0,1,1,0,0,0,0],[0,0,0,1,1,0,0,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,1,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0], ] },
    { rows: 12, cols: 10, colors: { base: '#555555', highlight: '#6a6a6a' }, pattern: [ [0,0,0,0,0,0,0,0,0,0],[0,1,1,1,0,0,1,1,1,0],[0,0,1,0,0,0,0,1,0,0],[0,0,1,0,1,1,1,1,1,0],[0,0,1,0,0,0,0,1,0,0],[0,1,1,1,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,0,0,0],[0,1,0,0,0,0,0,1,0,0],[0,1,0,0,0,0,0,1,0,0],[0,0,1,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0], ] },
    { rows: 11, cols: 11, colors: { base: '#808A70', highlight: '#9A7C70' }, pattern: 'random' }
];
