// Description: This code handles the submission of timesheets, including uploading files to Firebase and sending emails using Resend.

// ----------------------
// Required dependencies
// ----------------------
const express = require('express'); // Web framework for setting up the server
const bodyParser = require('body-parser'); // Middleware to parse JSON request bodies
const cors = require('cors'); // Middleware to allow cross-origin requests
const { google } = require('googleapis'); // Google API client for Sheets access
const admin = require('firebase-admin'); // Firebase Admin SDK for file uploads
const path = require('path'); // Node.js utility for handling file paths
const fs = require('fs'); // File system module for saving temporary files
const { v4: uuidv4 } = require('uuid'); // Library to generate unique IDs for file names and tokens
const { Resend } = require('resend'); // Resend email API client
require('dotenv').config(); // Loads environment variables from a .env file

const app = express();
const PORT = process.env.PORT || 3000; // Default port for local server

// Enable CORS and JSON parsing
app.use(cors());
// Increase payload limit to 10MB (or more if needed)
app.use(bodyParser.json({ limit: '10mb' }));

// -------------------------------
// Firebase Admin SDK Initialization
// -------------------------------
const firebaseServiceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(firebaseServiceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
const bucket = admin.storage().bucket();
//console.log('📦 Firebase bucket:', process.env.FIREBASE_STORAGE_BUCKET);

// -------------------------------------
// Google Sheets API Initialization
// -------------------------------------
const sheetsAuth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../google-service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// -------------------------------------
// Resend Email API Initialization
// -------------------------------------
const resend = new Resend(process.env.RESEND_API_KEY);

// --------------------------------------------------------------------
// Helper Function: Upload base64 file to Firebase and return public URL
// --------------------------------------------------------------------
async function uploadBase64File(base64, fileName, mimeType) {
  const buffer = Buffer.from(base64, 'base64');
  //const tempFilePath = path.join('/tmp', `${uuidv4()}-${fileName}`); // Temporary file path
  const tempFilePath = path.join(require('os').tmpdir(), `${uuidv4()}-${fileName}`);
  fs.writeFileSync(tempFilePath, buffer); // Save file temporarily

  const uploadedFile = await bucket.upload(tempFilePath, {
    destination: `receipts/${fileName}`, // Upload to 'receipts/' folder
    metadata: {
      contentType: mimeType,
      metadata: { 
        firebaseStorageDownloadTokens: uuidv4(), // Token to make file publicly accessible
      },
    },
  });

  // Construct a public download URL
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadedFile[0].name)}?alt=media&token=${uploadedFile[0].metadata.metadata.firebaseStorageDownloadTokens}`; 
}

// ------------------------------------------------------------------------
// Main API Endpoint: POST /api/submit-timesheet
// Accepts form data and processes the submission
// ------------------------------------------------------------------------
app.post('/api/submit-timesheet', async (req, res) => {
  const { name, email, type, notes, timesheetEntries, attachments } = req.body;

  if (!name || !email || !type || !timesheetEntries) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const SHEET_NAME = type === 'teaching' ? 'Instructors Hours' : 'Admin Hours'; // Choose sheet tab based on type

  try {
    const authClient = await sheetsAuth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const timestamp = new Date().toLocaleString();
    let emailBody = `Dear ${name},\n\nThank you for submitting your timesheet. Below is a copy of your submission:\n\n`;
    const rows = [];

    timesheetEntries.forEach((entry, i) => {
      const formattedDate = entry.date.split('-').reverse().join('/');
      let row;

      if (type === 'teaching') {
        row = [
          timestamp,
          name,
          email,
          formattedDate,
          entry.location,
          entry.hours,
          entry.bridgeToll ? 'Yes' : 'No',
          entry.reimbursementAmount,
          entry.mileageReimbursement,
          entry.language,
          entry.supervision ? 'Yes' : 'No',
          entry.substitution ? 'Yes' : 'No',
          notes
        ];
        emailBody += `Entry ${i + 1} (Teaching):\nDate: ${formattedDate}\nLocation: ${entry.location}\nHours: ${entry.hours}\nBridge Toll: ${entry.bridgeToll ? 'Yes' : 'No'}\nReimbursement: ${entry.reimbursementAmount}\nMileage: ${entry.mileageReimbursement}\nLanguage: ${entry.language}\nSupervision: ${entry.supervision ? 'Yes' : 'No'}\nSubstitution: ${entry.substitution ? 'Yes' : 'No'}\n\n`;
      } else {
        row = [
          timestamp,
          name,
          email,
          formattedDate,
          entry.location,
          entry.hours,
          entry.bridgeToll ? 'Yes' : 'No',
          entry.reimbursementAmount,
          entry.mileageReimbursement,
          notes
        ];
        emailBody += `Entry ${i + 1} (Admin):\nDate: ${formattedDate}\nLocation: ${entry.location}\nHours: ${entry.hours}\nBridge Toll: ${entry.bridgeToll ? 'Yes' : 'No'}\nReimbursement: ${entry.reimbursementAmount}\nMileage: ${entry.mileageReimbursement}\n\n`;
      }

      rows.push(row);
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    });

    const fileUrls = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const url = await uploadBase64File(file.base64, file.name, file.mimeType);
        fileUrls.push(url);
      }
    }

    const htmlBody = `
      <p>A new timesheet has been submitted by ${name}.</p>
      <pre>${emailBody}</pre>
      ${fileUrls.length > 0 ? '<h4>Receipts:</h4>' + fileUrls.map((url, i) => `<a href="${url}">Receipt ${i + 1}</a><br>`).join('') : ''}
    `;

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Timesheet Submission Confirmation',
      html: htmlBody
    });

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.HR_EMAIL,
      subject: `New ${type} timesheet submission from ${name}`,
      html: htmlBody
    });

    res.json({ success: true, message: 'Timesheet submitted and emailed successfully.' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error submitting timesheet.' });
  }
});
// GET /api/locations - Reads from the 'locations' sheet
app.get('/api/locations', async (req, res) => {
  try {
    const authClient = await sheetsAuth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'locations!A:A', // assuming locations are in column A
    });

    const values = result.data.values || [];
    const list = values.flat().filter(Boolean);
    res.json(list);
  } catch (err) {
    console.error('Failed to load locations:', err);
    res.status(500).json({ error: 'Failed to load locations' });
  }
});

// GET /api/languages - Reads from the 'languages' sheet
app.get('/api/languages', async (req, res) => {
  try {
    const authClient = await sheetsAuth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'languages!A:A', // assuming languages are in column A
    });

    const values = result.data.values || [];
    const list = values.flat().filter(Boolean);
    res.json(list);
  } catch (err) {
    console.error('Failed to load languages:', err);
    res.status(500).json({ error: 'Failed to load languages' });
  }
});

// GET /api/teams - Reads from the 'teams' sheet
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
