# How to Run the Project (Monorepo Workspace)

This project has been reorganized into a monorepo containing a React + Vite frontend (`frontend/` workspace) and an Express backend API server (`backend/` workspace).

## Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

---

## 1. Setup Environment Variables
Create a file named `.env.local` in the **root** directory and define the following variables:

```env
# Gemini API Key (Required for the AI features in the frontend)
GEMINI_API_KEY=your_gemini_api_key_here

# Cashfree Credentials (Required for payment processing)
CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here

# Brevo API Key (Required for email communications)
BREVO_API_KEY=your_brevo_api_key_here

# Encryption Key (Required for encrypting assessment answers in the database)
# Generate a strong random key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_char_hex_encryption_key_here

# Google Calendar Integration (Optional/Required for Google Meet integrations)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_ID=your-google-calendar-id
```

---

## 2. Install Dependencies
Run the following command in the **root** directory. Since npm workspaces are configured, this will automatically install all dependencies for the root, frontend, and backend packages:
```bash
npm install
```

---

## 3. Run the Applications

You can run both the frontend and backend servers together concurrently, or run them in separate terminal tabs.

### Option A: Run Frontend & Backend Concurrently (Recommended)
To start both the frontend Vite development server and the backend Express API server at the same time, run:
```bash
npm run dev
```

- **Frontend Server:** Runs on [http://localhost:3000/](http://localhost:3000/)
- **Backend API Server:** Runs on [http://localhost:3001/](http://localhost:3001/)

### Option B: Run Frontend & Backend Separately
If you want to run or debug them in separate terminal tabs:

**Start the Frontend only:**
```bash
npm run dev:frontend
```

**Start the Backend only:**
```bash
npm run dev:backend
```

---

## 4. Verification

- **Frontend:** Open [http://localhost:3000/](http://localhost:3000/) in your browser. You should see the application load correctly.
- **Backend:** The backend console should output:
  `Cashfree Backend API Server running on port 3001`
  `Connected to SQLite database at .../backend/database.sqlite`
