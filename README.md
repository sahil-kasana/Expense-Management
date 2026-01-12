# My Buddy - Smart Savings Tracker

A full-stack financial companion with a premium, mobile-first design, secure app lock, and dynamic category tracking.

## 🚀 Key Features
- **Mobile-First Aesthetic**: Sleek Apple-style design for personal finance.
- **Income & Expense Tracking**: Full visibility into your cash flow and net balance.
- **Smart App Lock**: Secure your data with device-level authentication mimics.
- **Dynamic Categories**: Add your own spending categories on the fly.
- **Dual Visualizations**: Doughnut charts for spending and dual-line trends for Income vs Spending.
- **Dark Mode**: High-contrast dark mode for late-night budgeting.

## 🛠 Tech Stack
- **Frontend**: Vanilla JS, Tailwind CSS, FontAwesome, Chart.js.
- **Backend**: Node.js, Express.
- **Database**: MySQL.

---

## 🌐 Deployment Instructions

### 🔙 Backend (Render)
1. Push this repository to GitHub.
2. Link your repository to **Render** as a "Web Service".
3. Set the **Root Directory** to `backend`.
4. Add the following **Environment Variables**:
   - `PORT`: 5000 (usually default)
   - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`: Your MySQL credentials.
5. Once deployed, note the Render URL (e.g., `https://my-buddy.onrender.com`).

### 🔜 Frontend (Hostinger)
1. Open `frontend/js/app.js`.
2. Update the `BASE_URL` placeholder on line 3 with your actual Render URL.
3. Upload the contents of the `frontend` folder to your Hostinger `public_html` directory via FTP or File Manager.

---

## 💻 Local Setup
1. Clone the repo.
2. Run `npm install` in the `backend` folder.
3. Create a `.env` file in `backend` with your MySQL data.
4. Run `npm start` or `npm run dev`.
5. Open `frontend/index.html` in your browser.

Developed with ❤️ by Antigravity.
