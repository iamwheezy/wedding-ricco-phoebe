/**
 * Wedding RSVP — Google Apps Script backend
 * -----------------------------------------
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this whole file into Code.gs, click Save
 * 3. Run  setup  once (select it in the toolbar, click Run, allow permissions)
 * 4. Deploy → New deployment → type "Web app"
 *      Execute as: Me      Who has access: Anyone
 * 5. Copy the Web app URL (ends with /exec) into assets/js/config.js → scriptURL
 *
 * After editing this code later: Deploy → Manage deployments → ✏️ Edit →
 * Version: "New version" → Deploy  (the URL stays the same).
 */

const SHEET_NAME = 'RSVP';
const HEADERS = ['Timestamp', 'Name', 'Attendance', 'Guests', 'Message', 'Invited As', 'Show Wish'];
const MAX_WISHES = 200;

/** Run once to create the sheet + header row. */
function setup() {
  const sheet = getSheet_();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#2f3b2b').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(5, 400);
  sheet.getRange('G2:G').insertCheckboxes();
}

/** Receives RSVP submissions (POST, JSON body). */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const name = clean_(d.name, 80);
    if (name.length < 2) return json_({ result: 'error', error: 'Name is required' });
    const attendance = d.attendance === 'Not Attending' ? 'Not Attending' : 'Attending';
    const guests = attendance === 'Attending' ? Math.min(Math.max(parseInt(d.guests, 10) || 1, 1), 10) : 0;
    const message = clean_(d.message, 500);
    const invitedAs = clean_(d.invitedAs, 60);

    const sheet = getSheet_();

    // Ignore exact duplicates sent within the last 2 minutes
    const last = sheet.getLastRow();
    if (last > 1) {
      const start = Math.max(2, last - 9);
      const rows = sheet.getRange(start, 1, last - start + 1, 5).getValues();
      const now = Date.now();
      const dup = rows.some(r => r[1] === name && r[4] === message &&
        now - new Date(r[0]).getTime() < 2 * 60 * 1000);
      if (dup) return json_({ result: 'success', duplicate: true });
    }

    sheet.appendRow([new Date(), name, attendance, guests, message, invitedAs, true]);
    return json_({ result: 'success' });
  } catch (err) {
    return json_({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Returns the wishes list (GET ?action=wishes). */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action !== 'wishes') return json_({ result: 'ok', message: 'Wedding RSVP API is running.' });

  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return json_({ result: 'ok', wishes: [] });

  const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const wishes = rows
    .filter(r => r[1] && String(r[4]).trim() !== '' && r[6] !== false) // untick "Show Wish" to hide
    .map(r => ({
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1]),
      attendance: String(r[2]),
      message: String(r[4])
    }))
    .reverse()               // newest first
    .slice(0, MAX_WISHES);

  return json_({ result: 'ok', wishes: wishes });
}

/* ---------- helpers ---------- */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}
function clean_(v, max) {
  // strip leading = + - @ so Sheets never treats input as a formula
  return String(v == null ? '' : v).replace(/[\u0000-\u001F]/g, ' ').trim().replace(/^[=+\-@]+/, '').slice(0, max);
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
