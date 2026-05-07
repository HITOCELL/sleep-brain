/**
 * 睡眠傾差値診断アプリ — Google Apps Script (Webhook)
 * version: 3
 *
 * 【Webアプリとしてデプロイする手順】
 * 1. Apps Script エディタ右上「デプロイ」→「デプロイを管理」
 * 2. 鉛筆アイコン → バージョン「新しいバージョン」→「デプロイ」
 * 3. アクセス: 「全員（匿名ユーザーを含む）」
 */

const SPREADSHEET_ID    = '1fJIogtMdiSboOXJObQNU9TQ6QPlT8faElLMhkbDJQCs';
const SHEET_NAME         = 'シート1';
const TRACKING_SHEET_NAME = 'トラッキング';
const SUMMARY_SHEET_NAME  = 'サマリー';
const LINE_USERS_SHEET    = 'LINE_ユーザー';

// データのキー名（submit routeの送信キーと一致させる）
const COLUMNS = [
  'timestamp', 'sessionId',
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10',
  'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20',
  'totalScore', 'sleepDeviation', 'sleepZone', 'mainType', 'subType',
  'recommendedRoute', 'userAgent', 'createdAt',
  'utm_source', 'utm_medium', 'utm_campaign',
  'lineRegistered', 'programClicked', 'consultationClicked', 'sourcePage',
];

// シート1の表示用ヘッダー（日本語）
const COLUMN_HEADERS = [
  '日時', 'セッションID',
  'Q1: 年齢', 'Q2: 性別', 'Q3: 仕事・生活スタイル',
  'Q4: 平均睡眠時間', 'Q5: 寝つき', 'Q6: 夜中に目が覚める',
  'Q7: 朝起きた時の状態', 'Q8: 日中の眠気',
  'Q9: いびき・呼吸', 'Q10: 寝る前のスマホ・PC',
  'Q11: カフェイン摂取時間', 'Q12: 飲酒', 'Q13: 入浴',
  'Q14: 運動・活動量', 'Q15: ストレス・緊張',
  'Q16: 身体の不調', 'Q17: 美容面の悩み',
  'Q18: 集中力・パフォーマンス',
  'Q19: 一番改善したいこと', 'Q20: 睡眠改善への気持ち',
  '合計スコア', '睡眠偏差値', '睡眠ゾーン', 'メインタイプ', 'サブタイプ',
  '推奨ルート', 'ユーザーエージェント', '作成日時',
  'utm_source', 'utm_medium', 'utm_campaign',
  'LINE登録', 'プログラムクリック', '相談クリック', '流入ページ',
];

const TRACKING_COLUMNS = ['timestamp', 'sessionId', 'event', 'step', 'userAgent'];

// ============================================================
// Webhook エントリーポイント
// ============================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.type === 'tracking')           return handleTracking(data);
    if (data.type === 'line_register')      return handleLineRegister(data);
    if (data.type === 'line_get')           return handleLineGet(data);
    if (data.type === 'line_get_by_answers') return handleLineGetByAnswers(data);
    return handleSubmit(data);
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return buildResponse({ success: false, error: err.toString() });
  }
}

// ============================================================
// 診断結果保存（シート1）
// ============================================================

function handleSubmit(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // ヘッダー行を書く
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setBackground('#14244A').setFontColor('#FFFFFF').setFontWeight('bold');
    Logger.log('handleSubmit: シート1を新規作成しました');
  }
  var row = COLUMNS.map(function(col) {
    var val = data[col];
    return (val !== undefined && val !== null) ? val : '';
  });
  sheet.appendRow(row);
  Logger.log('handleSubmit: 書き込み完了 sessionId=' + (data.sessionId || ''));
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
    Logger.log('handleTracking: トラッキングシートを新規作成');
  }

  var sessionIdIdx = TRACKING_COLUMNS.indexOf('sessionId'); // 1
  var stepIdx      = TRACKING_COLUMNS.indexOf('step');      // 3
  var allValues    = sheet.getDataRange().getValues();

  var existingRow  = -1;
  var existingStep = -1;
  for (var i = 1; i < allValues.length; i++) {
    if (allValues[i][sessionIdIdx] === data.sessionId) {
      existingRow  = i + 1;
      existingStep = Number(allValues[i][stepIdx] !== '' ? allValues[i][stepIdx] : -1);
      break;
    }
  }

  var newStep = Number(data.step !== undefined && data.step !== '' ? data.step : -1);
  var row = TRACKING_COLUMNS.map(function(col) {
    var val = data[col];
    return (val !== undefined && val !== null) ? val : '';
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
  var lineUserId     = data.lineUserId;
  var encodedAnswers = data.encodedAnswers || '';
  var allValues      = sheet.getDataRange().getValues();
  for (var i = 1; i < allValues.length; i++) {
    if (allValues[i][0] === lineUserId) {
      sheet.getRange(i + 1, 2).setValue(encodedAnswers);
      sheet.getRange(i + 1, 3).setValue(new Date());
      return buildResponse({ success: true });
    }
  }
  sheet.appendRow([lineUserId, encodedAnswers, new Date()]);
  return buildResponse({ success: true });
}

function handleLineGet(data) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(LINE_USERS_SHEET);
  if (!sheet) return buildResponse({ success: false, encodedAnswers: null });
  var allValues = sheet.getDataRange().getValues();
  for (var i = 1; i < allValues.length; i++) {
    if (allValues[i][0] === data.lineUserId) {
      return buildResponse({ success: true, encodedAnswers: allValues[i][1] || null });
    }
  }
  return buildResponse({ success: false, encodedAnswers: null });
}

function handleLineGetByAnswers(data) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(LINE_USERS_SHEET);
  if (!sheet) return buildResponse({ success: false, lineUserId: null });
  var allValues = sheet.getDataRange().getValues();
  // 最新を優先するため末尾から検索
  for (var i = allValues.length - 1; i >= 1; i--) {
    if (allValues[i][1] === data.encodedAnswers) {
      return buildResponse({ success: true, lineUserId: allValues[i][0] });
    }
  }
  return buildResponse({ success: false, lineUserId: null });
}

// ============================================================
// ユーティリティ
// ============================================================

function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// サマリー作成（GASエディタから手動実行）
// ============================================================

function buildSummary() {
  Logger.log('buildSummary 開始');
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // サマリーシート取得・初期化
    var sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SUMMARY_SHEET_NAME);
      Logger.log('サマリーシートを新規作成');
    } else {
      sheet.clearContents();
      sheet.clearFormats();
      Logger.log('サマリーシートをクリア');
    }

    // ---- トラッキングデータ集計 ----
    var stepCounts = {};
    var totalSessions = 0;

    var trackSheet = ss.getSheetByName(TRACKING_SHEET_NAME);
    if (!trackSheet) {
      Logger.log('トラッキングシートが存在しない');
    } else {
      var lastDataRow = trackSheet.getLastRow();
      Logger.log('トラッキング行数: ' + lastDataRow);
      if (lastDataRow > 1) {
        // D列 = step（TRACKING_COLUMNSのindex 3）
        var stepCol = trackSheet.getRange(2, 4, lastDataRow - 1, 1).getValues();
        for (var i = 0; i < stepCol.length; i++) {
          var raw = stepCol[i][0];
          if (raw !== '' && raw !== null && raw !== undefined) {
            var s = parseInt(raw, 10);
            if (!isNaN(s)) {
              stepCounts[s] = (stepCounts[s] || 0) + 1;
              totalSessions++;
            }
          }
        }
      }
    }
    Logger.log('集計結果: ' + JSON.stringify(stepCounts) + ' total=' + totalSessions);

    // ---- テーブル定義 ----
    var stepDefs = [
      [0,  'クイズ開始（Q1で即離脱）'],
      [1,  '1問回答 → Q2で離脱'],
      [2,  '2問回答 → Q3で離脱'],
      [3,  '3問回答 → Q4で離脱'],
      [4,  '4問回答 → Q5で離脱'],
      [5,  '5問回答 → Q6で離脱'],
      [6,  '6問回答 → Q7で離脱'],
      [7,  '7問回答 → Q8で離脱'],
      [8,  '8問回答 → Q9で離脱'],
      [9,  '9問回答 → Q10で離脱'],
      [10, '10問回答 → Q11で離脱'],
      [11, '11問回答 → Q12で離脱'],
      [12, '12問回答 → Q13で離脱'],
      [13, '13問回答 → Q14で離脱'],
      [14, '14問回答 → Q15で離脱'],
      [15, '15問回答 → Q16で離脱'],
      [16, '16問回答 → Q17で離脱'],
      [17, '17問回答 → Q18で離脱'],
      [18, '18問回答 → Q19で離脱'],
      [19, '19問回答 → Q20で離脱'],
      [20, '全20問完了'],
      [21, 'LINEページ到達（未クリック）'],
      [22, 'LINEボタンクリック'],
      [23, 'LINE登録完了・結果表示'],
      [24, '神睡眠プログラムクリック'],
    ];

    var startCount = stepCounts[0] || totalSessions || 1;

    // ---- データ行を構築 ----
    var tableData = [['ステップ', 'ラベル', '件数', '割合(%)']];
    var counts = [];
    for (var di = 0; di < stepDefs.length; di++) {
      var stepNum = stepDefs[di][0];
      var label   = stepDefs[di][1];
      var cnt     = stepCounts[stepNum] || 0;
      var pct     = startCount > 0 ? Math.round(cnt / startCount * 1000) / 10 : 0;
      tableData.push([stepNum, label, cnt, pct]);
      counts.push(cnt);
    }

    // ---- 一括書き込み ----
    sheet.getRange(1, 1, tableData.length, 4).setValues(tableData);
    Logger.log('値の書き込み完了 rows=' + tableData.length);

    // ---- 列幅 ----
    sheet.setColumnWidth(1, 70);
    sheet.setColumnWidth(2, 240);
    sheet.setColumnWidth(3, 70);
    sheet.setColumnWidth(4, 80);

    // ---- ヘッダー装飾 ----
    sheet.getRange(1, 1, 1, 4)
      .setBackground('#14244A')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');

    // ---- 行背景 ----
    for (var ri = 0; ri < counts.length; ri++) {
      var r = ri + 2;
      if (ri === 0)       sheet.getRange(r, 1, 1, 4).setBackground('#DBEAFE').setFontWeight('bold');
      else if (ri === 20) sheet.getRange(r, 1, 1, 4).setBackground('#DCFCE7').setFontWeight('bold');
      else if (ri >= 21)  sheet.getRange(r, 1, 1, 4).setBackground('#EDE9FE');
    }

    // ---- 件数セルの色分け（離脱ステップ 1〜19 を比較基準に） ----
    var maxCnt = 0;
    for (var ci = 1; ci <= 19; ci++) {
      if (counts[ci] > maxCnt) maxCnt = counts[ci];
    }
    Logger.log('maxCnt=' + maxCnt);

    for (var ki = 1; ki <= 19; ki++) {
      var c = counts[ki];
      var cellBg = '#F3F4F6';
      if (maxCnt > 0 && c > 0) {
        var ratio = c / maxCnt;
        if (ratio >= 0.8)      cellBg = '#EF4444';
        else if (ratio >= 0.6) cellBg = '#F97316';
        else if (ratio >= 0.4) cellBg = '#EAB308';
        else if (ratio >= 0.2) cellBg = '#84CC16';
        else                   cellBg = '#22C55E';
      }
      sheet.getRange(ki + 1, 3)
        .setBackground(cellBg)
        .setFontColor(c > 0 ? '#FFFFFF' : '#6B7280')
        .setFontWeight('bold');
    }

    // ---- 最終更新 ----
    var infoRow = tableData.length + 2;
    sheet.getRange(infoRow, 1).setValue(
      '最終更新: ' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss')
    ).setFontColor('#9CA3AF').setFontSize(10);
    sheet.getRange(infoRow, 2).setValue('総セッション数: ' + totalSessions)
      .setFontColor('#4B5563').setFontSize(10);

    Logger.log('buildSummary 完了');

  } catch (e) {
    Logger.log('buildSummary エラー: ' + e.toString());
    Logger.log('スタック: ' + e.stack);
    // エラー内容をサマリーシートに書く
    try {
      var errSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SUMMARY_SHEET_NAME);
      if (errSheet) errSheet.getRange(1, 1).setValue('エラー: ' + e.toString());
    } catch (_) {}
    throw e;
  }
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
    s1.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    s1.getRange(1, 1, 1, COLUMNS.length).setBackground('#14244A').setFontColor('#FFFFFF').setFontWeight('bold');
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

  var msg = created.length > 0
    ? '再作成: ' + created.join(', ')
    : '全シート正常（修復不要）';
  Logger.log(msg);

  try {
    SpreadsheetApp.getUi().alert('シート修復', msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (_) {}
}

// ============================================================
// データリセット（GASエディタから実行）
// ============================================================

function resetTrackingData() {
  var ui;
  try { ui = SpreadsheetApp.getUi(); } catch (_) { ui = null; }

  if (ui) {
    var resp = ui.alert(
      'データリセット確認',
      'トラッキングとシート1のデータ行を全削除します。\nLINE_ユーザーは保持されます。\nよろしいですか？',
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) { Logger.log('キャンセル'); return; }
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var deleted = [];

  var trackSheet = ss.getSheetByName(TRACKING_SHEET_NAME);
  if (trackSheet && trackSheet.getLastRow() > 1) {
    trackSheet.deleteRows(2, trackSheet.getLastRow() - 1);
    deleted.push(TRACKING_SHEET_NAME);
  }

  var sheet1 = ss.getSheetByName(SHEET_NAME);
  if (sheet1 && sheet1.getLastRow() > 0) {
    sheet1.clearContents();
    deleted.push(SHEET_NAME);
  }

  var msg = deleted.length > 0 ? '削除完了: ' + deleted.join(', ') : '削除対象データなし';
  Logger.log(msg);
  if (ui) ui.alert('完了', msg, ui.ButtonSet.OK);
}

// ============================================================
// 動作確認（GASエディタから実行）
// ============================================================

function runDiagnostics() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('=== 診断開始 ===');
  Logger.log('シート1 存在: '         + (ss.getSheetByName(SHEET_NAME) !== null)         + ' 行数: ' + (ss.getSheetByName(SHEET_NAME) ? ss.getSheetByName(SHEET_NAME).getLastRow() : '-'));
  Logger.log('トラッキング 存在: '     + (ss.getSheetByName(TRACKING_SHEET_NAME) !== null) + ' 行数: ' + (ss.getSheetByName(TRACKING_SHEET_NAME) ? ss.getSheetByName(TRACKING_SHEET_NAME).getLastRow() : '-'));
  Logger.log('LINE_ユーザー 存在: '   + (ss.getSheetByName(LINE_USERS_SHEET) !== null)   + ' 行数: ' + (ss.getSheetByName(LINE_USERS_SHEET) ? ss.getSheetByName(LINE_USERS_SHEET).getLastRow() : '-'));
  Logger.log('サマリー 存在: '         + (ss.getSheetByName(SUMMARY_SHEET_NAME) !== null));

  // トラッキングにテスト書き込み
  var trackSheet = ss.getSheetByName(TRACKING_SHEET_NAME);
  if (!trackSheet) {
    trackSheet = ss.insertSheet(TRACKING_SHEET_NAME);
    trackSheet.getRange(1, 1, 1, TRACKING_COLUMNS.length).setValues([TRACKING_COLUMNS]);
  }
  var testId = 'DIAG_' + Date.now();
  trackSheet.appendRow([new Date(), testId, 'diagnostic', 99, 'GAS-Test']);
  Logger.log('テスト行書き込み完了: ' + testId);
  Logger.log('=== 診断完了 ===');
}

/**
 * 【step値の意味】
 *   0       → クイズ開始
 *   1〜19   → N問回答済み（その後離脱）
 *   20      → 全20問完了
 *   21      → LINEページ表示
 *   22      → LINEボタンクリック
 *   23      → LINE登録完了・結果表示
 *   24      → 神睡眠プログラムクリック
 */
