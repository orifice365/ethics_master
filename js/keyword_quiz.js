let ethicsData = [];
let currentPerson = null;
let foundCorrect = 0;

// JSONデータの取得
fetch('js/person.json')
    .then(res => res.json())
    .then(data => {
        ethicsData = data.person; 
        nextQuestion();
    });

function nextQuestion() {
    foundCorrect = 0;
    document.getElementById('correct-count').innerText = "0";
    document.getElementById('result-message').innerText = "";
    document.getElementById('next-btn').style.display = 'none';
    const cluster = document.getElementById('keyword-cluster');
    cluster.innerHTML = '';

    // 1. キーワードが3つ以上ある人物をランダムに選ぶ
    const validPeople = ethicsData.filter(p => p.keywords.length >= 3); 
    currentPerson = validPeople[Math.floor(Math.random() * validPeople.length)];
    document.getElementById('person-display-card').innerText = currentPerson.name;

    // 2. 正解キーワードをその人物のリストから3つ選ぶ
    const correctChoices = [...currentPerson.keywords]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3); 

    // 3. 不正解キーワードを5つ選ぶ（厳密な重複防止）
    const allIncorrectCandidates = ethicsData
        .filter(p => p.name !== currentPerson.name) 
        .flatMap(p => p.keywords) 
        .filter(k => !currentPerson.keywords.includes(k)); // 正解人物が持つワードは他人の物でも出さない

    // ユニークなものから6つ抽出
    const incorrectChoices = Array.from(new Set(allIncorrectCandidates)) 
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

    // 4. 合計9つを混ぜる
    const finalChoices = [
        ...correctChoices.map(text => ({ text, isCorrect: true })),
        ...incorrectChoices.map(text => ({ text, isCorrect: false }))
    ].sort(() => 0.5 - Math.random());

    // 5. ボタン生成
    finalChoices.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'keyword-choice';
        btn.innerText = item.text;
        btn.onclick = () => checkSelect(btn, item.isCorrect);
        cluster.appendChild(btn);
    });
}

function checkSelect(btn, isCorrect) {
    if (btn.disabled) return;

    if (isCorrect) {
        // 正解の挙動（緑色に変化）
        btn.classList.add('correct-mark');
        btn.disabled = true;
        foundCorrect++;
        document.getElementById('correct-count').innerText = foundCorrect;

        if (foundCorrect === 3) {
            handleCompletion();
        }
    } else {
        // 不正解の挙動（赤色に変化、押し直し可能）
        btn.classList.add('wrong-mark');
        // 少し時間をおいて色を戻す演出を入れても良いですが、画像に合わせて維持します
    }
}

function handleCompletion() {
    document.getElementById('result-message').innerHTML = "<span style='color:red; font-weight:bold;'>⭕ 正解のキーワードをすべて見つけました！</span>";
    document.getElementById('next-btn').style.display = 'block';
    
    // 他の全てのボタンを無効化
    const buttons = document.querySelectorAll('.keyword-choice');
    buttons.forEach(b => b.disabled = true);
}