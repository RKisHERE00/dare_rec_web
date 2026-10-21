const SPREADSHEET_ID = '10HHXen5gHTj0G3uysX51w78SYLEfLhXIsO7eIQ75ToI';
const DRIVE_FOLDER_ID = '1vZf28-Eoo7OBy1hAb-9lKKsBZ0INkPnU';
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

// Run once from the Apps Script editor to grant permission for confirmation emails.
function authorizeConfirmationEmail() {
  return 'Email authorization ready. Remaining daily recipients: ' +
    MailApp.getRemainingDailyQuota();
}

function doPost(e) {
  let ok = false;
  let message = 'Unknown error.';
  let resumeUrl = '';
  let emailSent = false;

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

    // BTech first-years can choose only from the three approved paths.
    const academicProgram = String(p.academicProgram || '').trim();
    const selectedRole = String(p.role || '').trim();
    const firstYearRoles = ['Volunteer', 'Graphic Designer', 'Video Editor'];
    if (academicProgram === 'Btech 1st year' && firstYearRoles.indexOf(selectedRole) === -1) {
      throw new Error('BTech first-years may choose Volunteer, Graphic Designer, or Video Editor.');
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
      "'" + clean_(p.contactNo), // Force phone numbers such as +91... to remain plain text in Sheets.
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

    // Send confirmation after the application is safely written to the sheet.
    // A mail delivery issue must not turn a saved application into a failed submission.
    try {
      sendApplicantConfirmation_(p);
      emailSent = true;
    } catch (emailErr) {
      console.error('Application saved, but confirmation email failed: ' +
        (emailErr && emailErr.message ? emailErr.message : emailErr));
    }
  } catch (err) {
    message = err && err.message ? err.message : String(err);
    console.error(message);
  }

  return response_(ok, message, resumeUrl, emailSent);
}

function sendApplicantConfirmation_(p) {
  const applicant = clean_(p.name);
  const recipient = clean_(p.emailId);
  const role = clean_(p.role);
  const program = clean_(p.academicProgram);
  const safeApplicant = escapeHtml_(applicant || 'Applicant');
  const safeRole = escapeHtml_(role || 'Volunteer');
  const safeProgram = escapeHtml_(program);
  const subject = 'DARE Recruitment — application received';
  const body = 'Hi ' + (applicant || 'there') + ',\n\n' +
    'Your DARE Recruitment application has been received.\n\n' +
    'Academic program: ' + program + '\n' +
    'Selected role: ' + role + '\n\n' +
    'Thank you for applying. The DARE team will contact you with updates.\n\n' +
    '— DARE Recruitment Team';
  const htmlBody = '<div style="font-family:Georgia,serif;color:#192b3d;line-height:1.6">' +
    '<h2 style="color:#234c69">Your application has reached the Great Hall</h2>' +
    '<p>Hi ' + safeApplicant + ',</p>' +
    '<p>Your DARE Recruitment application has been received.</p>' +
    '<p><strong>Academic program:</strong> ' + safeProgram + '<br>' +
    '<strong>Selected role:</strong> ' + safeRole + '</p>' +
    '<p>Thank you for applying. The DARE team will contact you with updates.</p>' +
    '<p>— DARE Recruitment Team</p></div>';

  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Applicant email address is missing or invalid.');
  }
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: body,
    htmlBody: htmlBody,
    name: 'DARE Recruitment'
  });
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>"']/g, function (char) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
  });
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

function response_(ok, message, resumeUrl, emailSent) {
  const payload = JSON.stringify({
    source: 'axios-recruitment',
    ok: ok,
    message: message,
    resumeUrl: resumeUrl || '',
    emailSent: Boolean(emailSent)
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
