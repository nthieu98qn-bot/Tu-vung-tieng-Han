// Google Apps Script cho Hangul Deck - Google Sheets Sync
// Sheet ID đã lấy từ link bạn gửi:
const SPREADSHEET_ID = '1MnQIk1dKy-NLMkXlWkitkj5imo9PZfneo8dav8zAyec';
const SYNC_SHEET_NAME = 'HangulDeckSync';

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'load';
    const syncId = sanitizeSyncId_(params.syncId || 'main');

    if (action === 'ping') {
      return json_({ ok: true, message: 'Apps Script sync is working.', time: new Date().toISOString() });
    }

    if (action === 'meta') {
      const row = getRowBySyncId_(syncId);
      if (!row) return json_({ ok: true, exists: false, syncId });
      return json_({
        ok: true,
        exists: true,
        syncId,
        updatedAtMs: Number(row.updatedAtMs || 0),
        updatedBy: row.updatedBy || '',
        updatedAt: row.updatedAt || ''
      });
    }

    if (action === 'load') {
      const row = getRowBySyncId_(syncId);
      if (!row) return json_({ ok: true, exists: false, syncId });
      let state = null;
      try {
        state = JSON.parse(row.stateJson || '{}');
      } catch (error) {
        throw new Error('Không đọc được JSON trong Google Sheet: ' + error.message);
      }
      return json_({
        ok: true,
        exists: true,
        syncId,
        state,
        updatedAtMs: Number(row.updatedAtMs || 0),
        updatedBy: row.updatedBy || '',
        updatedAt: row.updatedAt || ''
      });
    }

    return json_({ ok: false, error: 'Unknown action: ' + action });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
    const action = body.action || 'save';
    const syncId = sanitizeSyncId_(body.syncId || 'main');

    if (action !== 'save') {
      return json_({ ok: false, error: 'Unknown POST action: ' + action });
    }

    if (!body.state || !body.state.decks) {
      return json_({ ok: false, error: 'Missing state.decks' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSyncSheet_();
      const rowNumber = findRowNumber_(sheet, syncId);
      const updatedAtMs = Number(body.updatedAtMs || Date.now());
      const updatedAt = new Date(updatedAtMs).toISOString();
      const updatedBy = String(body.updatedBy || 'unknown');
      const stateJson = JSON.stringify(body.state);

      const values = [syncId, updatedAtMs, updatedAt, updatedBy, stateJson];
      if (rowNumber) sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);
      else sheet.appendRow(values);

      return json_({ ok: true, exists: true, syncId, updatedAtMs, updatedAt, updatedBy });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function setupSheet() {
  getSyncSheet_();
}

function getSyncSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SYNC_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SYNC_SHEET_NAME);

  const headers = ['syncId', 'updatedAtMs', 'updatedAt', 'updatedBy', 'stateJson'];
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needHeader = headers.some((h, i) => current[i] !== h);
  if (needHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowNumber_(sheet, syncId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const index = values.findIndex(value => String(value) === String(syncId));
  return index >= 0 ? index + 2 : null;
}

function getRowBySyncId_(syncId) {
  const sheet = getSyncSheet_();
  const rowNumber = findRowNumber_(sheet, syncId);
  if (!rowNumber) return null;
  const values = sheet.getRange(rowNumber, 1, 1, 5).getValues()[0];
  return {
    syncId: values[0],
    updatedAtMs: values[1],
    updatedAt: values[2],
    updatedBy: values[3],
    stateJson: values[4]
  };
}

function sanitizeSyncId_(value) {
  const cleaned = String(value || 'main')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return cleaned || 'main';
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
