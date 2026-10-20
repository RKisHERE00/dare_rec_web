DARE RECRUITMENT — DEPLOYMENT NOTES

1) Review the backend before using it
- config.js still contains the endpoint from the original project. Confirm that the Google Apps Script, spreadsheet, and Drive folder belong to DARE before collecting applications.
- If DARE needs its own backend, copy google-apps-script/Code.gs into a DARE-owned Apps Script project, set the intended spreadsheet and Drive folder IDs, then deploy a new web app version.
- Run testConnections() and authorize Sheets and Drive when prompted.
- Deploy with Execute as: Me. Choose access settings appropriate for public recruitment.
- Put the DARE deployment /exec URL in config.js.

2) Preview the website
- Open this folder in VS Code and use Live Server on index.html.

3) Publish after configuration
- Deploy the folder to a static host such as Vercel or Netlify.
- Submit a small test application and confirm the expected spreadsheet row and Drive upload.
