/**
 * 睡眠傾差値診断アプリ — Google Apps Script (Webhook)
 *
 * 【初回セットアップ手順】
 * 1. Google スプレッドシートを新規作成する
 * 2. 1行目に以下のヘッダーを入力する（順番通りに）:
 *    timestamp, sessionId, email, age, gender, occupation,
 *    q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20,
 *    totalScore, sleepDeviation, sleepZone, mainType, subType, recommendedRoute,
 *    userAgent, createdAt,
 *    utm_source, utm_medium, utm_campaign, lineRegistered, programClicked,
 *    consultationClicked, sourcePage
 * 3. Apps Script エディタを開く（拡張機能 → Apps Script）
 * 4. このコードを貼り付け、SHEET_NAME を設定する
 * 5. 「ウェブアプリとしてデプロイ」する（下記手順参照）
 *
 * 【Webアプリとしてデプロイする手順】
 * 1. Apps Script エディタ右上「デプロイ」→「新しいデプロイ」
 * 2. 種類：「ウェブアプリ」
 * 3. 実行ユーザー：「自分」
 * 4. アクセスできるユーザー：「全員」
 * 5. 「デプロイ」をクリック
 * 6. 表示された「ウェブアプリのURL」をコピーする
 * 7. .env.local の GAS_WEBHOOK_URL= に貼り付ける
 */

const SHEET_NAME = 'シート1'; // シート名を合わせる

const COLUMNS = [
  'timestamp', 'sessionId', 'email', 'age', 'gender', 'occupation',
  'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12',
  'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20',
  'totalScore', 'sleepDeviation', 'sleepZone', 'mainType', 'subType',
  'recommendedRoute', 'userAgent', 'createdAt',
  'utm_source', 'utm_medium', 'utm_campaign',
  'lineRegistered', 'programClicked', 'consultationClicked', 'sourcePage',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return buildResponse({ success: false, error: 'sheet_not_found' });
    }

    const row = COLUMNS.map((col) => {
      const val = data[col];
      return val !== undefined && val !== null ? val : '';
    });

    sheet.appendRow(row);

    return buildResponse({ success: true });
  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ★ 初回だけ実行する：ヘッダー行を自動設定する関数
function setupHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('シートが見つかりません。SHEET_NAME を確認してください。');
    return;
  }
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
  SpreadsheetApp.getUi().alert('ヘッダーを設定しました！');
}

/**
 * 【動作確認手順】
 * 1. デプロイ後、curl でテスト:
 *    curl -L -X POST "YOUR_GAS_WEBHOOK_URL" \
 *      -H "Content-Type: application/json" \
 *      -d '{"timestamp":"2024-01-01T00:00:00Z","sessionId":"test123","email":"test@example.com","age":"B","gender":"A","occupation":"A","q4":"B","totalScore":30,"sleepDeviation":50,"sleepZone":"睡眠見直しゾーン","mainType":"fatigue","subType":"insomnia","recommendedRoute":"C","userAgent":"curl"}'
 * 2. スプレッドシートに行が追加されればOK
 * 3. Next.jsの .env.local に GAS_WEBHOOK_URL を設定して再起動
 * 4. アプリから実際に診断→メール入力→結果表示の流れを確認
 */
