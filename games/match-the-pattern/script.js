// --- Stage Data ---
const stages = [
    null, // stages[1]から
    { rows: 11, cols: 8, colors: { base: '#3465a4', highlight: '#a9cce3' }, pattern: [ /* 2 */ [0,1,1,1,1,1,1,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,0,0,0,0,1,0,0],[0,0,0,0,1,0,0,0],[0,0,0,1,0,0,0,0],[0,0,1,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,1,1,1,1,1,0], ] },
    { rows: 11, cols: 8, colors: { base: '#b58900', highlight: '#e99f00' }, pattern: [ /* 6 */ [0,0,1,1,1,1,0,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,1,1,1,1,1,0,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,1,0,0,0,0,1,0],[0,0,1,1,1,1,0,0],[0,0,0,0,0,0,0,0], ] },
    { rows: 11, cols: 10, colors: { base: '#aab8c2', highlight: '#66757f' }, pattern: [ /* smile */ [0,0,0,0,0,0,0,0,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,1,0],[0,0,1,0,0,0,0,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0], ] },
    { rows: 11, cols: 10, colors: { base: '#fff1a8', highlight: '#f7e58b' }, pattern: [ /* apple */ [0,0,0,0,1,1,0,0,0,0],[0,0,0,1,1,0,0,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,1,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0], ] },
    { rows: 12, cols: 10, colors: { base: '#292f33', highlight: '#4a5459' }, pattern: [ /* 色 */ [0,0,0,0,0,0,0,0,0,0],[0,1,1,1,0,0,1,1,1,0],[0,0,1,0,0,0,0,1,0,0],[0,0,1,0,1,1,1,1,1,0],[0,0,1,0,0,0,0,1,0,0],[0,1,1,1,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,1,1,0,0,0],[0,1,0,0,0,0,0,1,0,0],[0,1,0,0,0,0,0,1,0,0],[0,0,1,1,1,1,1,0,0,0],[0,0,0,0,0,0,0,0,0,0], ] },
];

// --- Elements ---
const sampleBoard = document.getElementById('sample-board');
const userBoard = document.getElementById('user-board');
const stageTitle = document.getElementById('stage-title');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const nextStageButton = document.getElementById('next-stage-button');

let currentStage = 1;

// --- Functions ---
function setupStage(stageNum) {
    const stageData = stages[stageNum];
    stageTitle.textContent = `ステージ ${stageNum}`;
    
    // Apply colors using CSS variables
    const root = document.documentElement;
    root.style.setProperty('--base-color', stageData.colors.base);
    root.style.setProperty('--highlight-color', stageData.colors.highlight);

    createBoard(sampleBoard, stageData, false);
    createBoard(userBoard, stageData, true);
}

function createBoard(container, stageData, isUserBoard) {
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${stageData.cols}, 1fr)`;
    
    const flatPattern = stageData.pattern.flat();

    for (let i = 0; i < stageData.rows * stageData.cols; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        if (isUserBoard) {
            cell.dataset.state = 0; // All start with base color
            cell.addEventListener('click', handleCellClick);
        } else {
            // Setup sample board
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
    const newState = 1 - currentState; // Toggle 0 and 1
    
    cell.dataset.state = newState;
    cell.style.backgroundColor = newState === 1 ? 'var(--highlight-color)' : 'var(--base-color)';
    
    checkWinCondition();
}

function checkWinCondition() {
    const stageData = stages[currentStage];
    const userCells = userBoard.querySelectorAll('.grid-cell');
    const flatPattern = stageData.pattern.flat();

    const isMatch = Array.from(userCells).every((cell, i) => {
        return parseInt(cell.dataset.state, 10) === flatPattern[i];
    });

    if (isMatch) {
        if (currentStage >= stages.length -1) {
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
        currentStage = 1; // Loop back to start
    }
    setupStage(currentStage);
}

// --- Event Listeners ---
nextStageButton.addEventListener('click', goToNextStage);

// --- Initial Start ---
setupStage(currentStage);