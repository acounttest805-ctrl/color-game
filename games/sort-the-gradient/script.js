// --- ゲーム設定 ---
const stages = [
    null, // stages[1]から使う
    { count: 4, start: '#0000ff', end: '#00ffff' }, // Stage 1: 青 -> シアン (4枚)
    { count: 5, start: '#ff00ff', end: '#ffff00' }, // Stage 2: マゼンタ -> 黄 (5枚)
    { count: 6, start: '#3498db', end: '#2ecc71' }, // Stage 3: 青 -> 緑 (6枚)
    { count: 7, start: '#f1c40f', end: '#e74c3c' }, // Stage 4: 黄 -> 赤 (7枚)
    { count: 8, start: '#a8d5ba', end: '#d5bba8' }, // Stage 5: くすんだ緑 -> くすんだオレンジ (8枚)
    { count: 9, start: '#808A70', end: '#9A7C70' }, // Stage 6: 最難関の緑系 -> 茶系 (9枚)
];

let currentStage = 1;
let correctOrder = [];

// --- HTML要素の取得 ---
const stageTitle = document.getElementById('stage-title');
const message = document.getElementById('message');
const chipContainer = document.getElementById('chip-container');
const checkButton = document.getElementById('check-button');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const retryButton = document.getElementById('retry-button');

// --- 色の補間関数 ---
function lerpColor(c1, c2, factor) {
    const hex = (c) => `0${c.toString(16)}`.slice(-2);
    const r1 = parseInt(c1.substring(1, 3), 16);
    const g1 = parseInt(c1.substring(3, 5), 16);
    const b1 = parseInt(c1.substring(5, 7), 16);
    const r2 = parseInt(c2.substring(1, 3), 16);
    const g2 = parseInt(c2.substring(3, 5), 16);
    const b2 = parseInt(c2.substring(5, 7), 16);
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    return `#${hex(r)}${hex(g)}${hex(b)}`;
}

// --- グラデーション生成関数 ---
function generateGradient(startColor, endColor, steps) {
    const gradient = [];
    for (let i = 0; i < steps; i++) {
        gradient.push(lerpColor(startColor, endColor, i / (steps - 1)));
    }
    return gradient;
}

// --- 配列シャッフル関数 ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- ステージ設定処理 ---
function setupStage(stageNum) {
    stageTitle.textContent = `ステージ ${stageNum}`;
    message.textContent = 'カラーチップをドラッグして、正しいグラデーションに並べ替えよう。';
    
    const stageData = stages[stageNum];
    correctOrder = generateGradient(stageData.start, stageData.end, stageData.count);
    
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
        chip.addEventListener('dragstart', () => {
            draggedItem = chip;
            setTimeout(() => chip.classList.add('dragging'), 0);
        });

        chip.addEventListener('dragend', () => {
            draggedItem.classList.remove('dragging');
        });

        chip.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(chipContainer, e.clientX);
            if (afterElement == null) {
                chipContainer.appendChild(draggedItem);
            } else {
                chipContainer.insertBefore(draggedItem, afterElement);
            }
        });
    });
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


// --- 正解判定処理 ---
function checkAnswer() {
    const currentChips = [...chipContainer.querySelectorAll('.color-chip')];
    const currentOrder = currentChips.map(chip => chip.style.backgroundColor);
    
    // RGB値を比較するため、HEXからRGBに変換して比較
    const isCorrect = currentOrder.every((color, i) => {
        return correctOrder[i] === rgbToHex(color);
    });

    if (isCorrect) {
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

// RGB(r, g, b)形式をHEX形式に変換するヘルパー関数
function rgbToHex(rgb) {
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    const hex = (c) => `0${c.toString(16)}`.slice(-2);
    return `#${hex(r)}${hex(g)}${hex(b)}`;
}

// --- ゲーム開始/リスタート処理 ---
function startGame() {
    resultModal.classList.add('hidden');
    currentStage = 1;
    setupStage(currentStage);
}

// --- イベントリスナー ---
checkButton.addEventListener('click', checkAnswer);
retryButton.addEventListener('click', startGame);

// --- ゲーム開始 ---
startGame();