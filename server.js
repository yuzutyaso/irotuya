const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000; // 環境変数PORTがあればそれを使用、なければ3000

// パスワードを定数として定義 (本番環境では環境変数などを使うべきです)
const ADMIN_PASSWORD = "000728";

// EJSをテンプレートエンジンとして設定
app.set('view engine', 'ejs');
// viewsディレクトリを設定 (Glitchでは通常プロジェクトのルートにviewsを作成)
app.set('views', path.join(__dirname, 'views'));

// JSONボディをパースするためのミドルウェア
app.use(express.json());
// 静的ファイルを配信 (publicフォルダ以下のファイルを公開)
app.use(express.static('public'));

// 辞典のデータファイルパス
const DATA_FILE = path.join(__dirname, 'dictionary.json');

/**
 * 辞典データをJSONファイルから読み込む関数
 * ファイルが存在しない場合は空のオブジェクトを返します。
 */
const loadDictionary = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // ファイルが存在しない場合は空のオブジェクトを返す
      return {};
    }
    console.error('Error loading dictionary:', error);
    return {};
  }
};

/**
 * 辞典データをJSONファイルに保存する関数
 */
const saveDictionary = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving dictionary:', error);
  }
};

// =========================================================================
// API エンドポイント
// =========================================================================

/**
 * GET /api/dictionary
 * 辞典の全エントリーを取得します。
 * クライアント側で表示や検索のために使用されます。
 */
app.get('/api/dictionary', (req, res) => {
  const dictionary = loadDictionary();
  // オブジェクトの値を配列として返す (クライアント側で扱いやすいため)
  res.json(Object.values(dictionary));
});

/**
 * POST /api/dictionary
 * 新しい言葉を追加したり、既存の言葉を更新します。
 * パスワード認証が必要です。
 */
app.post('/api/dictionary', (req, res) => {
  const { name, description, password } = req.body;

  // パスワードチェック
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ message: '不正なパスワードです。' });
  }

  // 必須フィールドのチェック
  if (!name || !description) {
    return res.status(400).json({ message: '名前と説明は必須です。' });
  }

  const dictionary = loadDictionary();
  // 名前を小文字に変換してキーとして保存することで、検索時に大文字・小文字を区別しなくする
  // ただし、nameプロパティ自体は元の文字列を保持する
  dictionary[name.toLowerCase()] = { name, description };
  saveDictionary(dictionary);

  res.status(201).json({ message: '言葉が追加/更新されました。', entry: { name, description } });
});

/**
 * GET /entry/:name
 * 特定の言葉の詳細ページを表示します。
 * EJSテンプレートをレンダリングしてHTMLを返します。
 */
app.get('/entry/:name', (req, res) => {
  const entryName = req.params.name; // URLから言葉の名前を取得
  const dictionary = loadDictionary();
  // 小文字のキーで辞典を検索
  const entry = dictionary[entryName.toLowerCase()];

  if (entry) {
    // 言葉が見つかったら、views/entry.ejs をレンダリングし、entryオブジェクトを渡す
    res.render('entry', { entry: entry });
  } else {
    // 見つからなければ404 Not Foundを返す
    res.status(404).send('指定された言葉が見つかりませんでした。');
  }
});

// サーバーを起動
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
