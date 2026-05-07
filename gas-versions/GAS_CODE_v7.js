/**
 * 睡眠傾差値診断アプリ — Google Apps Script (Webhook)
 * version: 7
 *
 * 【Webアプリとしてデプロイする手順】
 * 1. Apps Script エディタ右上「デプロイ」→「デプロイを管理」
 * 2. 鉛筆アイコン → バージョン「新しいバージョン」→「デプロイ」
 * 3. アクセス: 「全員（匿名ユーザーを含む）」
 */

var SPREADSHEET_ID      = '1fJIogtMdiSboOXJObQNU9TQ6QPlT8faElLMhkbDJQCs';
var SHEET_NAME          = 'シート1';
var TRACKING_SHEET_NAME = 'トラッキング';
var SUMMARY_SHEET_NAME  = 'サマリー';
var LINE_USERS_SHEET    = 'LINE_ユーザー';

// データキー（submit routeの送信キーと一致）
var COLUMNS = [
  'timestamp', 'sessionId',
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10',
  'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20',
  'totalScore', 'sleepDeviation', 'sleepZone', 'mainType', 'subType',
  'recommendedRoute', 'userAgent', 'createdAt',
  'utm_source', 'utm_medium', 'utm_campaign',
  'lineRegistered', 'programClicked', 'consultationClicked', 'sourcePage'
];

// シート1の日本語ヘッダー（実際の質問文）
var COLUMN_HEADERS = [
  '日時', 'セッションID',
  'Q1: 現在の年齢を教えてください。',
  'Q2: 性別を教えてください。',
  'Q3: 現在のお仕事・生活スタイルに近いものを教えてください。',
  'Q4: 平均の睡眠時間はどれくらいですか？',
  'Q5: 寝つきについて、最も近いものを選んでください。',
  'Q6: 夜中に目が覚めることはありますか？',
  'Q7: 朝起きた時の状態に近いものを選んでください。',
  'Q8: 日中の眠気について教えてください。',
  'Q9: いびきや呼吸について、当てはまるものはありますか？',
  'Q10: 寝る前のスマホ・PCの使用について教えてください。',
  'Q11: カフェインを摂る時間について教えてください。',
  'Q12: 飲酒について教えてください。',
  'Q13: 入浴について教えてください。',
  'Q14: 運動・活動量について教えてください。',
  'Q15: ストレスや緊張状態について教えてください。',
  'Q16: 身体の状態で当てはまるものを選んでください。',
  'Q17: 美容面で気になるものを選んでください。',
  'Q18: 最近の集中力・仕事のパフォーマンスについて教えてください。',
  'Q19: 今、一番改善したいことは何ですか？',
  'Q20: 睡眠改善に対して、今の気持ちに近いものを選んでください。',
  '合計スコア', '睡眠偏差値', '睡眠ゾーン', 'メインタイプ', 'サブタイプ',
  '推奨ルート', 'ユーザーエージェント', '作成日時',
  'utm_source', 'utm_medium', 'utm_campaign',
  'LINE登録', 'プログラムクリック', '相談クリック', '流入ページ'
];

var TRACKING_COLUMNS = ['timestamp', 'sessionId', 'event', 'step', 'userAgent'];

// ============================================================
// Webhook エントリーポイント
// ============================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.type === 'tracking')            return handleTracking(data);
    if (data.type === 'save_progress')       return handleSubmit(data);
    if (data.type === 'line_register')       return handleLineRegister(data);
    if (data.type === 'line_get')            return handleLineGet(data);
    if (data.type === 'line_get_by_answers') return handleLineGetByAnswers(data);
    return handleSubmit(data);
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return buildResponse({ success: false, error: err.toString() });
  }
}

// ============================================================
// 診断結果保存（シート1）— sessionIdでアップサート
// ============================================================

function handleSubmit(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length)
      .setBackground('#14244A').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var row = COLUMNS.map(function(col) {
    var v = data[col];
    return (v !== undefined && v !== null) ? v : '';
  });

  // sessionId で既存行を検索してアップサート
  var sidIdx = 1; // COLUMNS内のsessionIdの位置（0始まり）
  if (data.sessionId) {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var sidValues = sheet.getRange(2, sidIdx + 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < sidValues.length; i++) {
        if (sidValues[i][0] === data.sessionId) {
          // 既存行: 空でない値だけ上書き
          var existing = sheet.getRange(i + 2, 1, 1, COLUMNS.length).getValues()[0];
          var merged = row.map(function(v, idx) { return v !== '' ? v : existing[idx]; });
          sheet.getRange(i + 2, 1, 1, COLUMNS.length).setValues([merged]);
          return buildResponse({ success: true });
        }
      }
    }
  }

  sheet.appendRow(row);
  Logger.log('handleSubmit: 新規追加 sessionId=' + (data.sessionId || ''));
  return buildResponse({ success: true });
}

// ============================================================
// トラッキング
// ============================================================

function handleTracking(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TRACKING_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TRACKING_SHEET_NAME);
    sheet.getRange(1, 1, 1, TRACKING_COLUMNS.length).setValues([TRACKING_COLUMNS]);
  }

  var sidIdx  = 1; // sessionId = index 1
  var stepIdx = 3; // step = index 3

  var lastRow = sheet.getLastRow();
  var existingRow  = -1;
  var existingStep = -1;

  if (lastRow > 1) {
    var allSids = sheet.getRange(2, sidIdx + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < allSids.length; i++) {
      if (allSids[i][0] === data.sessionId) {
        existingRow  = i + 2;
        var sv = sheet.getRange(existingRow, stepIdx + 1).getValue();
        existingStep = (sv !== '' && sv !== null) ? Number(sv) : -1;
        break;
      }
    }
  }

  var newStep = (data.step !== null && data.step !== undefined && data.step !== '') ? Number(data.step) : -1;
  var row = TRACKING_COLUMNS.map(function(col) {
    var v = data[col];
    return (v !== undefined && v !== null) ? v : '';
  });

  if (existingRow > 0) {
    if (newStep >= existingStep) {
      sheet.getRange(existingRow, 1, 1, TRACKING_COLUMNS.length).setValues([row]);
    }
  } else {
    sheet.appendRow(row);
  }

  return buildResponse({ success: true });
}

// ============================================================
// LINE ユーザー管理
// ============================================================

function handleLineRegister(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(LINE_USERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(LINE_USERS_SHEET);
    sheet.getRange(1, 1, 1, 3).setValues([['lineUserId', 'encodedAnswers', 'createdAt']]);
  }
  var all = sheet.getDataRange().getValues();
  for (var i = 1; i < all.length; i++) {
    if (all[i][0] === data.lineUserId) {
      sheet.getRange(i + 1, 2).setValue(data.encodedAnswers || '');
      sheet.getRange(i + 1, 3).setValue(new Date());
      return buildResponse({ success: true });
    }
  }
  sheet.appendRow([data.lineUserId, data.encodedAnswers || '', new Date()]);
  return buildResponse({ success: true });
}

function handleLineGet(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(LINE_USERS_SHEET);
  if (!sheet) return buildResponse({ success: false, encodedAnswers: null });
  var all = sheet.getDataRange().getValues();
  for (var i = 1; i < all.length; i++) {
    if (all[i][0] === data.lineUserId) {
      return buildResponse({ success: true, encodedAnswers: all[i][1] || null });
    }
  }
  return buildResponse({ success: false, encodedAnswers: null });
}

function handleLineGetByAnswers(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(LINE_USERS_SHEET);
  if (!sheet) return buildResponse({ success: false, lineUserId: null });
  var all = sheet.getDataRange().getValues();
  for (var i = all.length - 1; i >= 1; i--) {
    if (all[i][1] === data.encodedAnswers) {
      return buildResponse({ success: true, lineUserId: all[i][0] });
    }
  }
  return buildResponse({ success: false, lineUserId: null });
}

function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// シート1ヘッダー設定（GASエディタから実行）
// ============================================================

function setupSheet1Headers() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
  sheet.getRange(1, 1, 1, COLUMN_HEADERS.length)
    .setBackground('#14244A').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, COLUMN_HEADERS.length, 160);
  sheet.setColumnWidth(1, 180); // 日時
  sheet.setColumnWidth(2, 140); // セッションID

  Logger.log('setupSheet1Headers 完了: ' + COLUMN_HEADERS.length + '列');
  try {
    SpreadsheetApp.getUi().alert('完了', 'シート1のヘッダーを設定しました（' + COLUMN_HEADERS.length + '列）', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch(_) {}
}

// ============================================================
// サマリー作成（GASエディタから実行）
// ============================================================
// 集計方式: ファネル形式
//   到達数 = そのステップ以上に進んだセッション数（COUNTIF step >= N）
//   離脱数 = 到達数(N) - 到達数(N+1)
//   離脱率 = 離脱数 / 到達数(N)
// ============================================================

function buildSummary() {
  Logger.log('buildSummary 開始');

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // サマリーシート初期化
  var sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SUMMARY_SHEET_NAME);
  } else {
    sheet.clearContents();
    sheet.clearFormats();
  }

  // トラッキングデータ読み込み
  var trackSheet = ss.getSheetByName(TRACKING_SHEET_NAME);
  var finalSteps = []; // 各セッションの最終ステップ

  if (!trackSheet || trackSheet.getLastRow() < 2) {
    Logger.log('トラッキングデータなし');
  } else {
    var lastRow = trackSheet.getLastRow();
    // D列（4列目）= step
    var stepValues = trackSheet.getRange(2, 4, lastRow - 1, 1).getValues();
    for (var i = 0; i < stepValues.length; i++) {
      var raw = stepValues[i][0];
      if (raw !== '' && raw !== null) {
        var n = Number(raw);
        if (!isNaN(n)) finalSteps.push(n);
      }
    }
  }

  var totalSessions = finalSteps.length;
  Logger.log('総セッション数: ' + totalSessions + ' / 最終ステップ分布: ' + JSON.stringify(
    finalSteps.reduce(function(acc, s) { acc[s] = (acc[s]||0)+1; return acc; }, {})
  ));

  // ステップ定義
  var stepDefs = [
    [0,  'クイズ開始'],
    [1,  'Q1回答'],
    [2,  'Q2回答'],
    [3,  'Q3回答'],
    [4,  'Q4回答'],
    [5,  'Q5回答'],
    [6,  'Q6回答'],
    [7,  'Q7回答'],
    [8,  'Q8回答'],
    [9,  'Q9回答'],
    [10, 'Q10回答'],
    [11, 'Q11回答'],
    [12, 'Q12回答'],
    [13, 'Q13回答'],
    [14, 'Q14回答'],
    [15, 'Q15回答'],
    [16, 'Q16回答'],
    [17, 'Q17回答'],
    [18, 'Q18回答'],
    [19, 'Q19回答'],
    [20, '全20問完了'],
    [21, 'LINEページ表示'],
    [22, 'LINEボタンクリック'],
    [23, 'LINE登録完了・結果表示'],
    [24, '神睡眠プログラムクリック']
  ];

  // 各ステップの「到達数」を計算（最終ステップ >= N の件数）
  var arrivals = {};
  for (var di = 0; di < stepDefs.length; di++) {
    var stepN = stepDefs[di][0];
    var count = 0;
    for (var fi = 0; fi < finalSteps.length; fi++) {
      if (finalSteps[fi] >= stepN) count++;
    }
    arrivals[stepN] = count;
  }

  // ヘッダー
  var headers = ['ステップ', 'ラベル', '到達数', '離脱数', '離脱率(%)'];
  sheet.getRange(1, 1, 1, 5).setValues([headers]);
  sheet.getRange(1, 1, 1, 5)
    .setBackground('#14244A').setFontColor('#FFFFFF').setFontWeight('bold');

  // データ行
  var tableRows = [];
  var dropoutCounts = [];

  for (var ri = 0; ri < stepDefs.length; ri++) {
    var sn    = stepDefs[ri][0];
    var label = stepDefs[ri][1];
    var arr   = arrivals[sn] || 0;

    // 離脱数 = 到達数(N) - 到達数(N+1)  ※最後のステップは離脱なし
    var nextStep = ri < stepDefs.length - 1 ? stepDefs[ri + 1][0] : -1;
    var dropout  = nextStep >= 0 ? arr - (arrivals[nextStep] || 0) : 0;
    var dropRate = arr > 0 ? Math.round(dropout / arr * 1000) / 10 : 0;

    tableRows.push([sn, label, arr, dropout, dropRate]);
    dropoutCounts.push(dropout);
  }

  sheet.getRange(2, 1, tableRows.length, 5).setValues(tableRows);

  // 列幅
  sheet.setColumnWidth(1, 65);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 70);
  sheet.setColumnWidth(4, 70);
  sheet.setColumnWidth(5, 80);

  // 行背景
  for (var bi = 0; bi < tableRows.length; bi++) {
    var rowNum = bi + 2;
    if (bi === 0)       sheet.getRange(rowNum, 1, 1, 5).setBackground('#DBEAFE').setFontWeight('bold');
    else if (bi === 20) sheet.getRange(rowNum, 1, 1, 5).setBackground('#DCFCE7').setFontWeight('bold');
    else if (bi >= 21)  sheet.getRange(rowNum, 1, 1, 5).setBackground('#EDE9FE');
  }

  // 離脱数セルの色分け（Q1〜Q20の離脱が多いほど赤）
  var maxDropout = 0;
  for (var mi = 1; mi <= 20; mi++) {
    if (dropoutCounts[mi] > maxDropout) maxDropout = dropoutCounts[mi];
  }

  for (var ci = 1; ci <= 20; ci++) {
    var d = dropoutCounts[ci];
    var bg = '#F3F4F6';
    if (maxDropout > 0 && d > 0) {
      var ratio = d / maxDropout;
      if (ratio >= 0.8)      bg = '#EF4444';
      else if (ratio >= 0.6) bg = '#F97316';
      else if (ratio >= 0.4) bg = '#EAB308';
      else if (ratio >= 0.2) bg = '#84CC16';
      else                   bg = '#22C55E';
    }
    sheet.getRange(ci + 1, 4)
      .setBackground(bg)
      .setFontColor(d > 0 ? '#FFFFFF' : '#6B7280')
      .setFontWeight('bold');
  }

  // 最終更新
  var infoRow = tableRows.length + 3;
  sheet.getRange(infoRow, 1).setValue(
    '最終更新: ' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss')
  ).setFontColor('#9CA3AF').setFontSize(10);
  sheet.getRange(infoRow, 2).setValue('総セッション数: ' + totalSessions)
    .setFontColor('#4B5563').setFontSize(10);

  Logger.log('buildSummary 完了');
}

// ============================================================
// シート修復（消えたシートを再作成）
// ============================================================

function repairSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var created = [];

  var sheet1 = ss.getSheetByName(SHEET_NAME);
  if (!sheet1) {
    var s1 = ss.insertSheet(SHEET_NAME);
    s1.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
    s1.getRange(1, 1, 1, COLUMN_HEADERS.length)
      .setBackground('#14244A').setFontColor('#FFFFFF').setFontWeight('bold');
    s1.setFrozenRows(1);
    created.push(SHEET_NAME);
  }

  var trackSheet = ss.getSheetByName(TRACKING_SHEET_NAME);
  if (!trackSheet) {
    var ts = ss.insertSheet(TRACKING_SHEET_NAME);
    ts.getRange(1, 1, 1, TRACKING_COLUMNS.length).setValues([TRACKING_COLUMNS]);
    created.push(TRACKING_SHEET_NAME);
  }

  var lineSheet = ss.getSheetByName(LINE_USERS_SHEET);
  if (!lineSheet) {
    var ls = ss.insertSheet(LINE_USERS_SHEET);
    ls.getRange(1, 1, 1, 3).setValues([['lineUserId', 'encodedAnswers', 'createdAt']]);
    created.push(LINE_USERS_SHEET);
  }

  var msg = created.length > 0 ? '再作成: ' + created.join(', ') : '全シート正常（修復不要）';
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert('シート修復', msg, SpreadsheetApp.getUi().ButtonSet.OK); } catch(_) {}
}

// ============================================================
// データリセット（GASエディタから実行）
// ============================================================

function resetTrackingData() {
  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch(_) { ui = null; }

  if (ui) {
    var resp = ui.alert('確認', 'トラッキングとシート1のデータ行を全削除します。よろしいですか？', ui.ButtonSet.YES_NO);
    if (resp !== ui.Button.YES) return;
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var deleted = [];

  var trackSheet = ss.getSheetByName(TRACKING_SHEET_NAME);
  if (trackSheet && trackSheet.getLastRow() > 1) {
    trackSheet.deleteRows(2, trackSheet.getLastRow() - 1);
    deleted.push(TRACKING_SHEET_NAME);
  }

  var sheet1 = ss.getSheetByName(SHEET_NAME);
  if (sheet1 && sheet1.getLastRow() > 1) {
    sheet1.deleteRows(2, sheet1.getLastRow() - 1);
    deleted.push(SHEET_NAME);
  }

  var msg = deleted.length > 0 ? '削除完了: ' + deleted.join(', ') : '削除対象なし';
  Logger.log(msg);
  if (ui) ui.alert('完了', msg, ui.ButtonSet.OK);
}

// ============================================================
// 動作確認（GASエディタから実行）
// ============================================================

function runDiagnostics() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('=== 診断 ===');

  var names = [SHEET_NAME, TRACKING_SHEET_NAME, LINE_USERS_SHEET, SUMMARY_SHEET_NAME];
  for (var i = 0; i < names.length; i++) {
    var s = ss.getSheetByName(names[i]);
    Logger.log(names[i] + ': ' + (s ? '存在 行数=' + s.getLastRow() : '存在しない'));
  }

  // トラッキングにダミーデータを書いてbuildSummaryが動くか確認
  var trackSheet = ss.getSheetByName(TRACKING_SHEET_NAME);
  if (!trackSheet) {
    trackSheet = ss.insertSheet(TRACKING_SHEET_NAME);
    trackSheet.getRange(1, 1, 1, TRACKING_COLUMNS.length).setValues([TRACKING_COLUMNS]);
  }

  // テスト用ダミーセッション（各ステップ）
  var dummySteps = [0,3,8,15,20,21,22,23];
  for (var di = 0; di < dummySteps.length; di++) {
    trackSheet.appendRow([
      new Date(), 'DIAG_' + Date.now() + '_' + di,
      'diagnostic', dummySteps[di], 'GAS-Test'
    ]);
  }
  Logger.log('ダミーデータ追加: ' + dummySteps.length + '行');

  buildSummary();
  Logger.log('=== 診断完了 ===');
}

/**
 * 【step値の意味】
 *   0       → クイズ開始
 *   1〜19   → N問回答済み
 *   20      → 全20問完了
 *   21      → LINEページ表示
 *   22      → LINEボタンクリック
 *   23      → LINE登録完了・結果表示
 *   24      → 神睡眠プログラムクリック
 */
