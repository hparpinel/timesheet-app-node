# Timesheet Web App (Hosted on Render & Netlify)

A full-stack timesheet application designed for nonprofits or educational organizations to track teaching and administrative hours, upload reimbursement receipts, and automate email confirmations. It features a **Node.js backend deployed on Render** and a **frontend hosted on Netlify**.

**Live Demo:** [https://classy-wisp-01980a.netlify.app/](https://classy-wisp-01980a.netlify.app/)

## Features

- Separate forms for **Teaching** and **Admin** submissions  
- Required field validation with client-side logic  
- File uploads for reimbursement receipts (stored in Firebase Storage)  
- Dynamic dropdowns for location and language (sourced from Google Sheets)  
- Google Sheets integration for logging timesheets  
- Confirmation emails sent to employees and HR using Resend API  
- Responsive UI with toasts and submission feedback  

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript (Vanilla, hosted on Netlify)  
- **Backend**: Node.js + Express (deployed on Render)  
- **Storage**: Firebase Cloud Storage  
- **Email Delivery**: Resend API  
- **Data Logging**: Google Sheets API  
- **Deployment**: Render (backend), Netlify (frontend)  

## Project Structure

```bash
.
├── api/                     # Node.js backend
│   └── index.js             # Express API logic
├── frontend/                # Static web UI
│   ├── index.html
│   ├── script.js
│   └── style.css
├── .env                     # Environment variables
├── firebase-service-account.json
├── google-service-account.json
├── README.md
```

## How It Works

1. **Initial Input**  
   The user enters their name and email to activate the form.

2. **Form Filling**  
   Depending on form type (Teaching/Admin), they fill in the table with date, location, hours worked, and reimbursements. Location and language values are loaded from a Google Sheet.

3. **Attach Receipts**  
   Files are uploaded to Firebase and stored in a receipts directory.

4. **Submission**  
   - Timesheet entry is appended to the relevant Google Sheet  
   - Email confirmation is sent to the employee  
   - Email notification with receipt links is sent to HR  

## Setup & Deployment

**Note:** The following instructions are intended for local development. For production deployment (e.g., on Render and Netlify), environment variables and service account files should be securely added via each platform’s settings (not committed to the project directory).

### Environment Configuration

Create a `.env` file in the root directory with the following keys:

```env
PORT=3000
SPREADSHEET_ID=your-google-sheet-id
FIREBASE_STORAGE_BUCKET=your-firebase-bucket.appspot.com
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=your-sender@example.com
HR_EMAIL=hr@example.com
```

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/timesheet-app.git
   cd timesheet-app
   ```
2. For local development, place firebase-service-account.json and google-service-account.json in the root directory.

⚠️ Do not upload these files to your Git repo. For deployment, add them as secret files or environment files in your hosting dashboard.

3. Add your `.env` file to the root directory.  
4. Install backend dependencies:
   ```bash
   cd api
   npm install
   ```

5. Run locally:
   ```bash
   node index.js
   ```

6. Deploy backend to **Render** (add your `.env` in dashboard settings).  
7. Deploy frontend to **Netlify**.  
   Update `script.js`:
   ```js
   window.API_BASE_URL = 'https://your-backend.onrender.com';
   ```

