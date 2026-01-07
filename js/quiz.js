let ethicsData = [];
let quizPool = []; // そのモードで出題可能な人物のリスト
let currentQuestion = null;
let hintIndex = 0;
let shuffledKeywords = []; // 今回の問題用にシャッフルされたキーワードを保持
let streak = 0; // 連勝記録用の変数を追加

// 1. URLからモードを取得 (例: quiz.html?mode=quote)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'normal';

fetch('js/person.json')
    .then(res => res.json())
    .then(data => {
        ethicsData = data.person;
        setupMode(); // モードに応じた準備
        nextQuestion();
    });

// 2. モードに応じてクイズ対象を絞り込む
function setupMode() {
    const titleMap = {
        'normal': '通常クイズ',
        'quote': '名言クイズ',
        'book': '著作クイズ'
    };
    document.querySelector('h1').innerText = titleMap[mode];

    if (mode === 'quote') {
        // 「 」から始まるキーワードを持つ人だけを抽出
        quizPool = ethicsData.filter(p => p.keywords.some(k => k.startsWith('「')));
    } else if (mode === 'book') {
        // 『 』から始まるキーワードを持つ人だけを抽出
        quizPool = ethicsData.filter(p => p.keywords.some(k => k.startsWith('『')));
    } else {
        quizPool = ethicsData;
    }
}

function nextQuestion() {
    // 表示のリセット
    document.getElementById('result-message').innerText = '';
    document.getElementById('next-btn').style.display = 'none';
    const hintBtn = document.getElementById('hint-btn');
    hintBtn.style.visibility = 'visible';
    hintBtn.disabled = false;
    hintIndex = 0;

    // 3. quizPool から正解を選択
    currentQuestion = quizPool[Math.floor(Math.random() * quizPool.length)];

    // 4. キーワードの選定（モードに合わせてフィルタリング）
    if (mode === 'quote') {
        shuffledKeywords = currentQuestion.keywords.filter(k => k.startsWith('「'));
    } else if (mode === 'book') {
        shuffledKeywords = currentQuestion.keywords.filter(k => k.startsWith('『'));
    } else {
        shuffledKeywords = [...currentQuestion.keywords];
    }
    // シャッフル
    shuffledKeywords.sort(() => 0.5 - Math.random());

    // キーワードボックスの準備
    const box = document.getElementById('keywords-box');
    box.innerHTML = shuffledKeywords.map(k => `<div class="hint-item">・${k}</div>`).join('');

    // 5. 選択肢の作成（選択肢は全データからランダムに持ってきてOK）
    let distractors = ethicsData
        .filter(p => p.name !== currentQuestion.name)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    let choices = [currentQuestion, ...distractors].sort(() => 0.5 - Math.random());

    const choicesArea = document.getElementById('choices-area');
    choicesArea.innerHTML = '';
    choices.forEach(person => {
        const btn = document.createElement('button');
        btn.className = 'quiz-choice';
        btn.innerText = person.name;
        btn.onclick = () => checkAnswer(person.name);
        choicesArea.appendChild(btn);
    });

    displayHints(false);
}

// displayHints, showNextHint, checkAnswer は前回と同じで動作します
// (ただし displayHints 内のドット表示などは自動的に shuffledKeywords.length に合わせられます)

/**
 * ヒントを表示する関数
 * @param {boolean} showAll - trueなら全てのヒントを強制的に表示する
 */

function displayHints(showAll = false) {
    const counter = document.getElementById('hint-counter');
    const hintElements = document.querySelectorAll('.hint-item'); // 生成済みの全ヒント取得
    
    const total = shuffledKeywords.length;
    const current = showAll ? total : hintIndex + 1;
    
    // カウンターの更新
    let dots = "";
    for (let i = 0; i < total; i++) {
        dots += (i < current) ? "● " : "○ ";
    }
    counter.innerText = `（ヒント ${current} / ${total}） ${dots}`;

    // 各ヒント要素の表示・非表示を切り替え
    hintElements.forEach((el, i) => {
        if (showAll || i <= hintIndex) {
            el.classList.add('is-visible'); // 見えるようにする
        } else {
            el.classList.remove('is-visible');
        }
    });

    // ボタンの状態制御
    const hintBtn = document.getElementById('hint-btn');
    if (showAll || hintIndex >= total - 1) {
        hintBtn.disabled = true;
        hintBtn.innerText = "ヒントは以上です";
    } else {
        hintBtn.innerText = "+ 次のヒントを出す";
    }
}

function showNextHint() {
    hintIndex++;
    displayHints(false);
}

function checkAnswer(selectedName) {
    const isCorrect = selectedName === currentQuestion.name;
    const resultMsg = document.getElementById('result-message');
    const streakDisplay = document.getElementById('streak-count');
    
    // 全てのヒントを表示して復習できるようにする
    displayHints(true);

    // 全てのボタンを取得して正誤の色を付ける
    const buttons = document.querySelectorAll('#choices-area button');
    buttons.forEach(btn => {
        btn.disabled = true; // ボタンを無効化（CSSの :not(:disabled) 設定でhoverも止まります）
        
        if (btn.innerText === currentQuestion.name) {
            // 正解の人物のボタン
            btn.classList.add('choice-btn-correct');
        } else {
            // 不正解の人物のボタン
            btn.classList.add('choice-btn-incorrect');
        }
    });

    // メッセージの表示（ユーザー様の指定色：正解=青、不正解=赤を維持）
    if (isCorrect) {
        streak++; // 正解ならカウントアップ
        resultMsg.innerHTML = `<span style="color:green; font-size:2em;">正解！</span>`;
    } else {
        streak = 0; // 間違えたら0にリセット
        resultMsg.innerHTML = `<span style="color:red; font-size:2em;">不正解……</span><br><span>正解は：<b>${currentQuestion.name}</b></span>`;
    }

    // 画面の連勝表示を更新
    // streakDisplay.innerText = streak;

    // 「次の問題へ」ボタンを表示
    document.getElementById('next-btn').style.display = 'block';

    // 「ヒントを出す」ボタンを「透明」にする（場所は確保したまま）
    // これにより、選択肢やメッセージが上にガタッと詰まるのを防ぎます
    document.getElementById('hint-btn').style.visibility = 'hidden';
}