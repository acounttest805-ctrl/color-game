// --- ゲーム設定 ---
const stages = [
    null, // stages[1]から使う
    { count: 4, start: '#0000ff', end: '#00ffff' }, // Stage 1
    { count: 5, start: '#ff00ff', end: '#ffff00' }, // Stage 2
    { count: 6, start: '#3498db', end: '#2ecc71' }, // Stage 3
    { count: 7, start: '#f1c40f', end: '#e74c3c' }, // Stage 4
    { count: 8, start: '#a8d5ba', end: '#d5bba8' }, // Stage 5
    { count: 9, start: '#808A70', end: '#9A7C70' }, // Stage 6
];

let currentStage = 1;
let correctOrder = [];
let reversedCorrectOrder = [];

// --- HTML要素の取得 ---
const stageTitle = document.getElementById('stage-title');
const message = document.getElementById('message');
const chipContainer = document.getElementById('chip-container');
const checkButton = document.getElementById('check-button');
const showAnswerButton = document.getElementById('show-answer-button');
const nextStageButton = document.getElementById('next-stage-button');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const retryButton = document.getElementById('retry-button');

// --- ボタンの表示/非表示を管理する関数 ---
function updateButtonVisibility(state) {
    if (state === 'playing') {
        showAnswerButton.classList.remove('hidden');
        checkButton.classList.remove('hidden');
        nextStageButton.classList.add('hidden');
    } else if (state === 'answer_shown') {
        showAnswerButton.classList.add('hidden');
        checkButton.classList.add('hidden');
        nextStageButton.classList.remove('hidden');
    }
}

// --- ステージ設定処理 ---
function setupStage(stageNum) {
    stageTitle.textContent = `ステージ ${stageNum}`;
    message.textContent = 'カラーチップをドラッグして、正しいグラデーションに並べ替えよう。';
    updateButtonVisibility('playing');
    
    const stageData = stages[stageNum];
    correctOrder = generateGradient(stageData.start, stageData.end, stageData.count);
    reversedCorrectOrder = [...correctOrder].reverse();
    
    const shuffledOrder = [...correctOrder];
    shuffleArray(shuffledOrder);

    chipContainer.innerHTML = '';
    shuffledOrder.forEach(color => {
        const chip = document.createElement('div');
        chip.className = 'color-chip';
        chip.style.backgroundColor = color;
        chip.draggable = true;
        chipContainer.appendChild(chip);
    });

    addDragDropListeners();
}

// --- ドラッグ＆ドロップイベントリスナー設定 ---
function addDragDropListeners() {
    const chips = document.querySelectorAll('.color-chip');
    let draggedItem = null;

    chips.forEach(chip => {
        // --- PCのマウス操作用 ---
        chip.addEventListener('dragstart', () => {
            draggedItem = chip;
            setTimeout(() => chip.classList.add('dragging'), 0);
        });

        chip.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                draggedItem = null; // ★★★ この1行を追加 ★★★
            }
        });

        // --- スマホのタッチ操作用 ---
        chip.addEventListener('touchstart', (e) => {
            draggedItem = e.target;
            draggedItem.classList.add('dragging');
        }, { passive: false });

        chip.addEventListener('touchend', () => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
            }
        });
    });

    // --- 共通の移動処理 ---
    chipContainer.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(chipContainer, e.clientX);
        if (draggedItem) {
            if (afterElement == null) {
                chipContainer.appendChild(draggedItem);
            } else {
                chipContainer.insertBefore(draggedItem, afterElement);
            }
        }
    });

    chipContainer.addEventListener('touchmove', e => {
        e.preventDefault();
        if (draggedItem) {
            const x = e.touches[0].clientX;
            const afterElement = getDragAfterElement(chipContainer, x);
            if (afterElement == null) {
                chipContainer.appendChild(draggedItem);
            } else {
                chipContainer.insertBefore(draggedItem, afterElement);
            }
        }
    }, { passive: false });
}

function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.color-chip:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- 「答えを見る」機能 ---
function showAnswer() {
    message.textContent = '正解は、この並びです。';
    chipContainer.innerHTML = ''; 

    correctOrder.forEach(color => {
        const chip = document.createElement('div');
        chip.className = 'color-chip';
        chip.style.backgroundColor = color;
        chip.draggable = false;
        chip.style.cursor = 'default';
        chipContainer.appendChild(chip);
    });

    if (currentStage >= stages.length - 1) {
        showAnswerButton.classList.add('hidden');
        checkButton.classList.add('hidden');
        setTimeout(() => {
            resultTitle.textContent = 'ゲーム終了';
            resultMessage.textContent = 'お疲れ様でした！このゲームが、ご自身の色の見え方について知るきっかけになれば幸いです。';
            resultModal.classList.remove('hidden');
        }, 2000);
    } else {
        updateButtonVisibility('answer_shown');
    }
}

// --- 「次のステージへ」ボタンの処理 ---
function goToNextStage() {
    currentStage++;
    if (currentStage < stages.length) {
        setupStage(currentStage);
    }
}

// --- 正解判定処理 ---
function checkAnswer() {
    const currentChips = [...chipContainer.querySelectorAll('.color-chip')];
    if (currentChips.length === 0) return;
    const currentOrder = currentChips.map(chip => rgbToHex(chip.style.backgroundColor));
    
    const isCorrectForward = currentOrder.every((color, i) => color === correctOrder[i]);
    const isCorrectBackward = currentOrder.every((color, i) => color === reversedCorrectOrder[i]);

    if (isCorrectForward || isCorrectBackward) {
        currentStage++;
        if (currentStage >= stages.length) {
            resultTitle.textContent = '全ステージクリア！';
            resultMessage.textContent = '素晴らしい色彩感覚です！人によっては、いくつかのステージは非常に難しく感じることがあります。';
            resultModal.classList.remove('hidden');
        } else {
            message.textContent = '正解！次のステージへ進みます。';
            setTimeout(() => setupStage(currentStage), 1000);
        }
    } else {
        message.textContent = 'うーん、まだ違うようです。もう一度並べ替えてみよう。';
    }
}

// --- ゲーム開始/リスタート処理 ---
function startGame() {
    resultModal.classList.add('hidden');
    currentStage = 1;
    setupStage(currentStage);
}

// --- イベントリスナー ---
checkButton.addEventListener('click', checkAnswer);
showAnswerButton.addEventListener('click', showAnswer);
nextStageButton.addEventListener('click', goToNextStage);
retryButton.addEventListener('click', startGame);

// --- ゲーム開始 ---
startGame();


// --- ここから下は変更のないヘルパー関数群です ---
function rgbToHex(rgb) {
    if (!rgb) return '';
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/\d+/g);
    if (!match) return '';
    const [r, g, b] = match.map(Number);
    const hex = (c) => `0${c.toString(16)}`.slice(-2);
    return `#${hex(r)}${hex(g)}${hex(b)}`;
}
function lerpColor(c1, c2, factor) {
    const hex = (c) => `0${c.toString(16)}`.slice(-2);
    const r1 = parseInt(c1.substring(1, 3), 16), g1 = parseInt(c1.substring(3, 5), 16), b1 = parseInt(c1.substring(5, 7), 16);
    const r2 = parseInt(c2.substring(1, 3), 16), g2 = parseInt(c2.substring(3, 5), 16), b2 = parseInt(c2.substring(5, 7), 16);
    const r = Math.round(r1 + factor * (r2 - r1)), g = Math.round(g1 + factor * (g2 - g1)), b = Math.round(b1 + factor * (b2 - b1));
    return `#${hex(r)}${hex(g)}${hex(b)}`;
}
function generateGradient(startColor, endColor, steps) {
    const gradient = [];
    for (let i = 0; i < steps; i++) {
        gradient.push(lerpColor(startColor, endColor, i / (steps - 1)));
    }
    return gradient;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}