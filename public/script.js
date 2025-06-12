document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const entriesList = document.getElementById('entries');
    const passwordInput = document.getElementById('password');
    const showEditFormButton = document.getElementById('show-edit-form-button');
    const addEditForm = document.getElementById('add-edit-form');
    const entryNameInput = document.getElementById('entry-name');
    const entryDescriptionInput = document.getElementById('entry-description');
    const addEntryButton = document.getElementById('add-entry-button');
    const messageParagraph = document.getElementById('message');

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const clearSearchButton = document.getElementById('clear-search-button');
    const searchMessage = document.getElementById('search-message');

    let allDictionaryEntries = []; // 全てのエントリーを保存する配列

    /**
     * 辞典の全エントリーをサーバーから読み込み、表示を更新する関数。
     */
    const loadDictionaryEntries = async () => {
        try {
            const response = await fetch('/api/dictionary');
            const entries = await response.json();
            allDictionaryEntries = entries; // 取得した全エントリーを保存
            displayEntries(allDictionaryEntries); // 最初は全て表示
        } catch (error) {
            console.error('Failed to load dictionary entries:', error);
            entriesList.innerHTML = '<li>辞典の読み込みに失敗しました。</li>';
        }
    };

    /**
     * 指定されたエントリー配列をリストに表示する関数。
     * 説明文の長さによる表示調整と、詳細ページへのリンク設定を行います。
     * @param {Array<Object>} entriesToDisplay - 表示するエントリーの配列
     */
    const displayEntries = (entriesToDisplay) => {
        entriesList.innerHTML = ''; // リストをクリア
        if (entriesToDisplay.length === 0) {
            entriesList.innerHTML = '<li>一致する言葉は見つかりませんでした。</li>';
            return;
        }
        entriesToDisplay.forEach(entry => {
            const li = document.createElement('li');
            const nameSpan = document.createElement('strong'); // 名称を太字にする
            nameSpan.textContent = entry.name;

            const descriptionSpan = document.createElement('span');
            let displayedDescription = entry.description;

            // 説明が15文字を超える場合、省略表示し、詳細ページへのリンクにする
            if (entry.description.length > 15) {
                displayedDescription = entry.description.substring(0, 15) + '...';
                const link = document.createElement('a');
                // URLに特殊文字が含まれる場合のためにencodeURIComponentを使用
                link.href = `/entry/${encodeURIComponent(entry.name)}`;
                link.textContent = displayedDescription;
                link.title = 'クリックで全て表示'; // ホバー時のツールチップ
                link.style.textDecoration = 'none'; // 下線を除去
                link.style.color = '#007bff'; // リンクの色
                link.style.cursor = 'pointer'; // カーソルをポインターに
                descriptionSpan.appendChild(link);
            } else {
                descriptionSpan.textContent = displayedDescription;
            }

            li.appendChild(nameSpan);
            li.appendChild(document.createTextNode(': ')); // 「: 」を追加
            li.appendChild(descriptionSpan);
            entriesList.appendChild(li);
        });
    };

    // =========================================================================
    // イベントリスナー
    // =========================================================================

    /**
     * 「編集フォームを表示」ボタンのクリックイベント。
     * パスワードが一致すれば編集フォームを表示します。
     */
    showEditFormButton.addEventListener('click', () => {
        // パスワードはクライアントサイドにも直接記述 (簡易的な認証)
        if (passwordInput.value === "000728") {
            addEditForm.style.display = 'block'; // フォームを表示
            messageParagraph.textContent = ''; // メッセージをクリア
        } else {
            messageParagraph.textContent = '不正なパスワードです。';
            messageParagraph.style.color = 'red';
            addEditForm.style.display = 'none'; // フォームを非表示
        }
    });

    /**
     * 「追加/更新」ボタンのクリックイベント。
     * 新しい言葉を追加または既存の言葉を更新します。
     */
    addEntryButton.addEventListener('click', async () => {
        const name = entryNameInput.value.trim();
        const description = entryDescriptionInput.value.trim();
        const password = passwordInput.value; // パスワードも送信

        if (!name || !description) {
            messageParagraph.textContent = '名前と説明は必須です。';
            messageParagraph.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('/api/dictionary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, password }) // パスワードを含めて送信
            });

            const data = await response.json(); // サーバーからのレスポンスをJSONとしてパース

            if (response.ok) { // HTTPステータスコードが2xxの場合
                messageParagraph.textContent = data.message;
                messageParagraph.style.color = 'green';
                entryNameInput.value = ''; // 入力欄をクリア
                entryDescriptionInput.value = '';
                loadDictionaryEntries(); // 辞典を再読み込みして表示を更新
            } else {
                // エラーメッセージを表示
                messageParagraph.textContent = data.message || 'エラーが発生しました。';
                messageParagraph.style.color = 'red';
            }
        } catch (error) {
            console.error('Failed to add/update entry:', error);
            messageParagraph.textContent = '追加/更新中にエラーが発生しました。';
            messageParagraph.style.color = 'red';
        }
    });

    /**
     * 「検索」ボタンのクリックイベント。
     * 入力されたキーワードで辞典の名称を検索し、結果を表示します。
     */
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim().toLowerCase(); // 検索キーワードを小文字に変換
        if (searchTerm === '') {
            displayEntries(allDictionaryEntries); // キーワードが空なら全て表示
            searchMessage.textContent = '';
            return;
        }

        // 名称のみでフィルタリング
        const filteredEntries = allDictionaryEntries.filter(entry =>
            entry.name.toLowerCase().includes(searchTerm)
        );
        displayEntries(filteredEntries); // フィルタリングされたエントリーを表示
        searchMessage.textContent = `${filteredEntries.length}件見つかりました。`;
        searchMessage.style.color = 'black';
    });

    /**
     * 「クリア」ボタンのクリックイベント。
     * 検索入力欄と検索結果をクリアし、全てのエントリーを表示します。
     */
    clearSearchButton.addEventListener('click', () => {
        searchInput.value = ''; // 検索入力欄をクリア
        displayEntries(allDictionaryEntries); // 全てのエントリーを表示
        searchMessage.textContent = ''; // メッセージをクリア
    });

    // =========================================================================
    // 初期ロード
    // =========================================================================

    // ページロード時に辞典のエントリーを読み込む
    loadDictionaryEntries();
});
