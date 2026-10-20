const SPREADSHEET_ID = '1tjDyOxfcLcIyiocpGcrjw_THR6WRNYO71AGuUGlEpTQ';
const DRIVE_FOLDER_ID = '1mPSrYUe9r9fUZViJeHdOiDBpCGa3I1OQ';
const MAX_RESUME_MB = 20;
const HEADERS = [
  'Timestamp',
  'Name',
  'Scholar No.',
  'Academic Program',
  'Contact No.',
  'Email ID',
  'Branch',
  'Role',
  'Resume',
  'Why are you interested in this position?'
];

function doGet() {
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><body style="font-family:Arial;padding:24px">' +
    '<b>DARE Recruitment Backend Online</b>' +
    '<p>POST endpoint ready.</p>' +
    '</body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function testConnections() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  Logger.log('SHEET OK: ' + ss.getName());
  Logger.log('DRIVE FOLDER OK: ' + folder.getName());
  return 'SHEET OK: ' + ss.getName() + ' | DRIVE OK: ' + folder.getName();
}

function doPost(e) {
  let ok = false;
  let message = 'Unknown error.';
  let resumeUrl = '';

  try {
    if (!e || !e.parameter) {
      throw new Error('No form data received.');
    }

    const p = e.parameter;
    const required = [
      'name', 'scholarNo', 'academicProgram', 'contactNo', 'emailId',
      'branch', 'role', 'whyInterested'
    ];

    required.forEach(function (key) {
      if (!String(p[key] || '').trim()) {
        throw new Error('Missing field: ' + key);
      }
    });

    // BTech first-years are restricted to the volunteer path; they cannot select a team role.
    const academicProgram = String(p.academicProgram || '').trim();
    const selectedRole = String(p.role || '').trim();
    if (academicProgram === 'Btech 1st year' && selectedRole !== 'Volunteer') {
      throw new Error('BTech first-year applicants can apply as volunteers only.');
    }
    if (selectedRole === 'Volunteer' && academicProgram !== 'Btech 1st year') {
      throw new Error('The volunteer path is reserved for BTech first-year applicants.');
    }

    // Resume is optional. Upload it to Drive only when a file was provided.
    const base64 = String(p.resumeBase64 || '').trim();
    if (base64) {
      const approxBytes = Math.floor(base64.length * 3 / 4);
      const maxBytes = MAX_RESUME_MB * 1024 * 1024;

      if (approxBytes > maxBytes) {
        throw new Error('Resume exceeds ' + MAX_RESUME_MB + ' MB.');
      }

      const bytes = Utilities.base64Decode(base64);
      if (bytes.length > maxBytes) {
        throw new Error('Resume exceeds ' + MAX_RESUME_MB + ' MB.');
      }

      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const safeName = sanitizeFilename_(p.resumeName || 'resume');
      const safeApplicant = sanitizeFilename_(p.name || 'Applicant');
      const safeScholar = sanitizeFilename_(p.scholarNo || 'NA');
      const timestamp = Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        'yyyyMMdd_HHmmss'
      );
      const stampedName = safeApplicant + '_' + safeScholar + '_' + timestamp + '_' + safeName;
      const blob = Utilities.newBlob(
        bytes,
        String(p.resumeMimeType || 'application/octet-stream'),
        stampedName
      );
      const file = folder.createFile(blob);
      resumeUrl = file.getUrl();
    }

    // Sheet write
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    ensureHeaders_(sheet);

    const row = [
      new Date(),
      clean_(p.name),
      clean_(p.scholarNo),
      clean_(p.academicProgram),
      clean_(p.contactNo),
      clean_(p.emailId),
      clean_(p.branch),
      clean_(p.role),
      '',
      clean_(p.whyInterested)
    ];

    sheet.appendRow(row);
    const rowNumber = sheet.getLastRow();

    // Show the original resume filename in the Resume column as a clickable Drive link when provided.
    if (resumeUrl) {
      const visibleFileName = clean_(p.resumeName).replace(/"/g, '""');
      const escapedUrl = String(resumeUrl).replace(/"/g, '""');
      sheet.getRange(rowNumber, 9).setFormula(
        '=HYPERLINK("' + escapedUrl + '","' + visibleFileName + '")'
      );
    }

    SpreadsheetApp.flush();
    ok = true;
    message = 'Application submitted successfully.';
  } catch (err) {
    message = err && err.message ? err.message : String(err);
    console.error(message);
  }

  return response_(ok, message, resumeUrl);
}

function ensureHeaders_(sheet) {
  const current = sheet
    .getRange(1, 1, 1, HEADERS.length)
    .getValues()[0];

  if (HEADERS.some(function (h, i) { return current[i] !== h; })) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function sanitizeFilename_(value) {
  return String(value || '')
    .replace(/[\\/:*?"<>|#%{}]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

function clean_(value) {
  return String(value || '').trim().slice(0, 5000);
}

function response_(ok, message, resumeUrl) {
  const payload = JSON.stringify({
    source: 'axios-recruitment',
    ok: ok,
    message: message,
    resumeUrl: resumeUrl || ''
  });

  const html = '<!doctype html><html><body><script>' +
    'var payload=' + payload + ';' +
    'function send(){' +
      'try{window.parent.postMessage(payload,"*")}catch(e){}' +
      'try{window.top.postMessage(payload,"*")}catch(e){}' +
    '}' +
    'send();setTimeout(send,150);setTimeout(send,500);' +
    'document.title=payload.ok?"DARE_OK":"DARE_ERROR";' +
    '</script>DARE RESPONSE</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
