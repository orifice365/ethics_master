let ethicsData = [];
let currentCategory = 'all';

// JSONの読み込み
fetch('js/person.json')
    .then(response => response.json())
    .then(data => {
        ethicsData = data.person;
        displayData('all');
    });

// 苦手な人のリストをlocalStorageから取得（なければ空配列）
function getWeakList() {
    return JSON.parse(localStorage.getItem('weakList')) || [];
}

// 苦手リストを保存
function toggleWeak(name) {
    let weakList = getWeakList();
    if (weakList.includes(name)) {
        weakList = weakList.filter(n => n !== name); // 削除
    } else {
        weakList.push(name); // 追加
    }
    localStorage.setItem('weakList', JSON.stringify(weakList));
}

// 画面表示
function displayData(category, dataToDisplay = null) {
    currentCategory = category;
    const container = document.getElementById('card-container');
    container.innerHTML = '';

    // dataToDisplayが指定されていなければ、カテゴリーでフィルタリング
    let filtered = dataToDisplay || (category === 'all'
        ? ethicsData
        : ethicsData.filter(p => p.category === category));

    const weakList = getWeakList();

    filtered.forEach(person => {
        const isWeak = weakList.includes(person.name);
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-cat', person.category);

        card.innerHTML = `
            <label class="weak-check-label" onclick="event.stopPropagation();">
                <input type="checkbox" ${isWeak ? 'checked' : ''} 
                    onchange="toggleWeak('${person.name}')">
                <span></span>
            </label>
            <h3>${person.name} <span>(${person.keywords.length})</span></h3>
            <div class="keywords">
                ${person.keywords.map(k => `・ ${k}`).join('<br>')}
            </div>
        `;

        card.onclick = () => card.classList.toggle('show');
        container.appendChild(card);
    });
}

// シャッフル機能
function shuffleData() {
    // 現在のカテゴリーに基づいてデータを抽出
    let filtered = currentCategory === 'all'
        ? [...ethicsData]
        : ethicsData.filter(p => p.category === currentCategory);

    // フィッシャー–イェーツのシャッフル
    for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    displayData(currentCategory, filtered);
}

// 苦手な人のみ表示
function displayWeakOnly() {
    const weakList = getWeakList();
    const filtered = ethicsData.filter(p => weakList.includes(p.name));

    if (filtered.length === 0) {
        alert("チェックされた「苦手な人」はいません。");
        return;
    }

    displayData('苦手のみ', filtered);
}