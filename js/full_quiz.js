let ethicsData = [];
let quizPool = []; // シャッフルされた出題順リスト（1周分）
let currentIndex = 0; // 現在何人目か
let currentQuestion = null;
let hintIndex = 0;
let shuffledKeywords = [];
let streak = 0;

// URLからモードを取得 (例: full_quiz.html?mode=quote)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'normal';

fetch('js/person.json')
    .then(res => res.json())
    .then(data => {
        ethicsData = data.person;
        setupFullQuiz(); // 1周モード用の準備（フィルタリングとシャッフル）
        nextQuestion();
    });

/**
 * 1. モードに応じて対象を絞り込み、全対象者をランダムに並び替える
 */
function setupFullQuiz() {
    const titleMap = {
        'normal': '通常クイズ（全範囲）',
        'quote': '名言クイズ（全範囲）',
        'book': '著作クイズ（全範囲）'
    };
    if (document.querySelector('h1')) {
        document.querySelector('h1').innerText = titleMap[mode];
    }

    let pool = [];
    if (mode === 'quote') {
        pool = ethicsData.filter(p => p.keywords.some(k => k.startsWith('「')));
    } else if (mode === 'book') {
        pool = ethicsData.filter(p => p.keywords.some(k => k.startsWith('『')));
    } else {
        pool = [...ethicsData];
    }

    // フィッシャー–イェーツのシャッフルで出題順を完全にランダム化
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    quizPool = pool;
    currentIndex = 0;

    // 全体の数を表示（HTMLに total-pos というIDがある前提）
    if (document.getElementById('total-pos')) {
        document.getElementById('total-pos').innerText = quizPool.length;
    }
}

/**
 * 2. 次の問題を表示する（配列の currentIndex 番目を出す）
 */
function nextQuestion() {
    // 全員解き終わったか判定
    if (currentIndex >= quizPool.length) {
        showFinishScreen();
        return;
    }

    // 表示のリセット
    document.getElementById('result-message').innerText = '';
    document.getElementById('next-btn').style.display = 'none';
    const hintBtn = document.getElementById('hint-btn');
    hintBtn.style.visibility = 'visible';
    hintBtn.disabled = false;
    hintIndex = 0;

    // 進捗表示の更新（HTMLに current-pos というIDがある前提）
    if (document.getElementById('current-pos')) {
        document.getElementById('current-pos').innerText = currentIndex + 1;
    }

    // 1周用リストから現在の人物を取得
    currentQuestion = quizPool[currentIndex];

    // キーワードの選定
    if (mode === 'quote') {
        shuffledKeywords = currentQuestion.keywords.filter(k => k.startsWith('「'));
    } else if (mode === 'book') {
        shuffledKeywords = currentQuestion.keywords.filter(k => k.startsWith('『'));
    } else {
        shuffledKeywords = [...currentQuestion.keywords];
    }
    shuffledKeywords.sort(() => 0.5 - Math.random());

    // ヒントの準備
    const box = document.getElementById('keywords-box');
    box.innerHTML = shuffledKeywords.map(k => `<div class="hint-item">・${k}</div>`).join('');

    // 選択肢の作成
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

/**
 * 3. ヒント表示制御
 */
function displayHints(showAll = false) {
    const counter = document.getElementById('hint-counter');
    const hintElements = document.querySelectorAll('.hint-item');
    
    const total = shuffledKeywords.length;
    const current = showAll ? total : hintIndex + 1;
    
    if (counter) {
        let dots = "";
        for (let i = 0; i < total; i++) {
            dots += (i < current) ? "● " : "○ ";
        }
        counter.innerText = `（ヒント ${current} / ${total}） ${dots}`;
    }

    hintElements.forEach((el, i) => {
        if (showAll || i <= hintIndex) {
            el.classList.add('is-visible');
        } else {
            el.classList.remove('is-visible');
        }
    });

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

/**
 * 4. 正誤判定
 */
function checkAnswer(selectedName) {
    const isCorrect = selectedName === currentQuestion.name;
    const resultMsg = document.getElementById('result-message');
    
    displayHints(true);

    const buttons = document.querySelectorAll('#choices-area button');
    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.innerText === currentQuestion.name) {
            btn.classList.add('choice-btn-correct');
        } else {
            btn.classList.add('choice-btn-incorrect');
        }
    });

    if (isCorrect) {
        streak++;
        resultMsg.innerHTML = `<span style="color:green; font-size:2em;">正解！</span>`;
    } else {
        streak = 0;
        resultMsg.innerHTML = `<span style="color:red; font-size:2em;">不正解……</span><br><span>正解は：<b>${currentQuestion.name}</b></span>`;
    }

    // 次に進むためにインデックスを加算
    currentIndex++;

    document.getElementById('next-btn').style.display = 'block';
    document.getElementById('hint-btn').style.visibility = 'hidden';
}

/**
 * 5. 終了画面の表示
 */
function showFinishScreen() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = `
        <div style="text-align:center; padding:50px 20px;">
            <h2 style="font-size: 2.5em; color: #f39c12;">🎉 1周クリア！</h2>
            <p style="font-size: 1.2em; margin-bottom: 30px;">
                全ての思想家（${quizPool.length}名）の学習が完了しました。<br>
                お疲れ様でした！
            </p>
            <button class="menu-card" onclick="location.reload()" style="margin-bottom:15px; width:100%; max-width:300px;">
                もう1周挑戦する
            </button>
            <button class="menu-card" onclick="location.href='index.html'" style="width:100%; max-width:300px; background:#eee;">
                トップへ戻る
            </button>
        </div>
    `;
}