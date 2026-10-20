# DARE — Leadership Recruitment 2026

A magical-school visual direction for the DARE recruitment site, with the supplied club logo and nine square-cropped character portraits. Open `index.html` with VS Code Live Server to preview it.

## Project files

- `index.html`, `styles.css`, and `app.js` make up the frontend.
- `assets/dare-club-logo.png` is the supplied DARE logo. `assets/characters/` contains square-cropped character photos matched to the nine leadership roles, plus Voldemort for the first-year volunteer path. `assets/harry-potter-audio.m4a` is the supplied background track.
- `google-apps-script/Code.gs` is the optional Google Sheets/Drive backend.
- `config.js` currently contains the URL from the original project. Confirm it points to a DARE-owned backend before accepting applications.

The form keeps its existing submission flow and offers nine leadership roles. BTech first-years are automatically assigned to Volunteer and cannot select a team role; the frontend and Apps Script source both enforce this rule. Redeploy `google-apps-script/Code.gs` to apply the server-side check to an existing Apps Script deployment. The supplied track attempts to autoplay and loop on page load, and the form-opening click also starts it when autoplay was blocked. The music button remains available for play/pause. The deep blue background echoes the cyan-blue in the DARE logo.
