# Trackyo — AI Expense Tracker

<div align="center">

**"Track Smart. Spend Wise. That's Trackyo."**

[![🚀 Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20Trackyo-6366f1?style=for-the-badge&logo=github)](https://lenin1050.github.io/trackyo_project/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-trackyo__project-24292f?style=for-the-badge&logo=github)](https://github.com/lenin1050/trackyo_project)

[![Deploy to GitHub Pages](https://github.com/lenin1050/trackyo_project/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/lenin1050/trackyo_project/actions/workflows/deploy-pages.yml)
[![E2E Tests](https://github.com/lenin1050/trackyo_project/actions/workflows/verify_e2e_reports.yml/badge.svg)](https://github.com/lenin1050/trackyo_project/actions/workflows/verify_e2e_reports.yml)
[![Security Audit](https://github.com/lenin1050/trackyo_project/actions/workflows/verify_vulnerability_reports.yml/badge.svg)](https://github.com/lenin1050/trackyo_project/actions/workflows/verify_vulnerability_reports.yml)
[![Frontend Build](https://github.com/lenin1050/trackyo_project/actions/workflows/webpack.yml/badge.svg)](https://github.com/lenin1050/trackyo_project/actions/workflows/webpack.yml)

</div>

---

Trackyo is a production-ready, full-stack personal finance and automated expense tracking platform designed for Indian users. The system automates personal bookkeeping by scanning receipts with client-side OCR, simulated bank transaction SMS reading, and auto-categorization using Google's **Gemini AI API**, all wrapped inside a sleek, premium fintech dashboard with custom visual themes.

---

## 🌐 Live Deployment

| Environment | URL | Status |
|---|---|---|
| **GitHub Pages (Frontend)** | [https://lenin1050.github.io/trackyo_project/](https://lenin1050.github.io/trackyo_project/) | [![Deploy](https://github.com/lenin1050/trackyo_project/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/lenin1050/trackyo_project/actions/workflows/deploy-pages.yml) |
| **GitHub Repository** | [https://github.com/lenin1050/trackyo_project](https://github.com/lenin1050/trackyo_project) | ![GitHub](https://img.shields.io/badge/public-repo-green) |
| **GitHub Actions CI** | [View Workflow Runs](https://github.com/lenin1050/trackyo_project/actions) | ![CI](https://img.shields.io/badge/CI-active-brightgreen) |

> **Note:** The live demo connects to a demo backend. For full functionality including AI features, run the backend locally and configure your Gemini API key.

---

## ✅ Test Results

### 🔬 E2E Selenium Test Suite — Web Application
> **Full test suite file:** [`test results/E2E_Test_Report_Trackyo_2026-06-14T15-41-16.xlsx`](test%20results/E2E_Test_Report_Trackyo_2026-06-14T15-41-16.xlsx)

| Category | Tests | Status |
|---|:---:|:---:|
| **Authentication & Registration** | 16 | ✅ PASSED |
| **Dashboard & Statistics** | 12 | ✅ PASSED |
| **Expense Transactions (CRUD)** | 14 | ✅ PASSED |
| **CSV Ledger Export** | 4 | ✅ PASSED |
| **SMS Parser Simulator** | 16 | ✅ PASSED |
| **OCR Receipt Scanner** | 16 | ✅ PASSED |
| **Budgets & Limit Alerts** | 14 | ✅ PASSED |
| **Wishlist & Savings Goals** | 16 | ✅ PASSED |
| **Admin Metrics Panel** | 8 | ✅ PASSED |
| **Notifications System** | 4 | ✅ PASSED |
| **🎯 TOTAL** | **120** | **✅ 120/120 PASSED** |

> **Test Framework:** Selenium WebDriver 4.22 • MongoDB Memory Server • Headless Chrome
> **Duration:** ~12 minutes full suite • **Pass Rate:** 100%

---

### 📱 Appium Mobile E2E Tests — Android App
> **Full test report:** [`test results/Trackyo_Appium_E2E_Report_2026-06-15T03-49-04.xlsx`](test%20results/Trackyo_Appium_E2E_Report_2026-06-15T03-49-04.xlsx)

| Category | Tests | Status |
|---|:---:|:---:|
| **App Launch & Login** | 4 | ✅ PASSED |
| **Dashboard Navigation** | 4 | ✅ PASSED |
| **SMS Parsing (Mobile)** | 4 | ✅ PASSED |
| **Expense Entry Flow** | 4 | ✅ PASSED |
| **Budget Overview** | 4 | ✅ PASSED |
| **🎯 TOTAL** | **20** | **✅ 20/20 PASSED** |

> **Test Framework:** Appium 2.x • UiAutomator2 • Android APK (`tracko.apk`)

---

### 🔒 Security Vulnerability Audit Report
> **Full audit report:** [`Vulnerability Test Results/security_audit_report.xlsx`](trackyo_website/Vulnerability%20Test%20Results/security_audit_report.xlsx) | [`security_audit_report.md`](trackyo_website/Vulnerability%20Test%20Results/security_audit_report.md)

| Severity | Count | Risk Level | Required Action |
|---|:---:|---|---|
| 🔴 **Critical** | 3 | CVSS 9.0–10.0 | Immediate — Fix before any use |
| 🟠 **High** | 7 | CVSS 7.0–8.9 | Fix before deployment |
| 🟡 **Medium** | 9 | CVSS 4.0–6.9 | Address within sprint |
| 🟢 **Low** | 4 | CVSS 0.1–3.9 | Low priority hardening |
| **Total** | **23** | OWASP Top 10 + API Security | Standard: Academic Demo |

**Top 3 Critical Attack Paths Identified:**
1. 🔑 Hardcoded JWT fallback secret → anyone can forge valid auth tokens
2. 🔓 `forgotPassword` API returns hardcoded `123456` → authenticate as any user
3. 🌐 CORS wildcard `*` → any website can make authenticated cross-origin API requests

> **Audit Standard:** OWASP Top 10 · API Security Top 10 · CVSS Scoring
> **Scope:** `backend/` directory — all controllers, middleware, routes, models

---

## 🚀 Core Features

1. **User Authentication** — Secure JWT-based registration, login, persistent sessions, theme/currency preferences
2. **Home Dashboard** — Balance summary, monthly limits, weekly charts, Gemini AI financial tips
3. **SMS Parser Simulator** — Auto-extracts amounts & merchants from Indian bank SMS (SBI/HDFC/etc.)
4. **Receipt Scanner (OCR)** — Tesseract.js client-side OCR + AI prefill for expense forms
5. **Budgets & Limit Alerts** — Color-coded gauges (Green < 85%, Amber ≥ 85%, Red > 100%)
6. **Wishlist & Milestones** — Savings targets with custom deposits and completion celebrations
7. **4 Premium Themes** — Dark Slate · Light Mode · Cyber Neon · Terminal Mono
8. **Admin Panel** — Metrics on users, global transactions, averages, live transaction grids

---

## 📂 Project Structure

```text
trackyo_project/
├── .github/workflows/
│   ├── deploy-pages.yml            ← GitHub Pages auto-deploy
│   ├── verify_e2e_reports.yml      ← Selenium E2E CI runner
│   ├── verify_vulnerability_reports.yml ← Security report generator
│   └── webpack.yml                 ← Frontend build matrix (Node 18/20/22)
│
├── trackyo_website/
│   ├── backend/
│   │   ├── config/                 # MongoDB connection helpers
│   │   ├── controllers/            # Auth, Expense, AI, Budgets, Admin handlers
│   │   ├── middleware/             # JWT protect & admin role filters
│   │   ├── models/                 # User, Expense, Budget, SavingsGoal, Notification
│   │   ├── routes/                 # Express API routers
│   │   ├── selenium-tests/         # Full 120-test Selenium E2E suite
│   │   │   ├── test-cases.js       # All 120 test case definitions
│   │   │   ├── run-tests.js        # Test runner (MongoDB Memory Server)
│   │   │   └── report-generator.js # Excel report generator
│   │   ├── utils/seedData.js       # Rich demo data seeder
│   │   └── server.js               # Express app entry point
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/         # StatCard, GlassCard, Modals, Toast
│   │   │   ├── context/            # Auth, Theme, Notifications state
│   │   │   ├── pages/              # Dashboard, Transactions, Budgets, Wishlist, Admin
│   │   │   └── services/api.js     # Axios client
│   │   └── vite.config.js          # Vite + GitHub Pages base path
│   │
│   ├── test results/               # Static E2E & Appium Excel reports
│   └── Vulnerability Test Results/ # Security audit reports + generators
│
└── appium-tests/                   # Android Appium test suite
```

---

## 🛠️ Installation & Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas URI)

### 1. Configure Environment
```bash
# backend/.env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/trackyo
JWT_SECRET=trackyosecretjwt12345!@#
GEMINI_API_KEY=                    # Optional — leave blank for offline AI fallback
```

### 2. Seed Demo Database
```bash
cd trackyo_website/backend
npm install
npm run seed
```

**Demo Accounts:**
| Name | Email | Password | Role |
|---|---|---|---|
| Rahul Sharma | `rahul@trackyo.in` | `password123` | Normal User |
| Priya Patel | `priya@trackyo.in` | `password123` | Normal User |
| Admin Master | `admin@trackyo.in` | `adminpassword` | Super Admin |

### 3. Start Backend
```bash
cd trackyo_website/backend
npm run dev          # Starts on http://localhost:5000
```

### 4. Start Frontend
```bash
cd trackyo_website/frontend
npm install
npm run dev          # Opens http://localhost:5173
```

### 5. Run E2E Test Suite
```bash
cd trackyo_website/backend/selenium-tests
npm install
npm run test         # Runs all 120 Selenium tests + generates Excel report
```

---

## ⚙️ CI/CD Pipeline

| Workflow | Trigger | Description |
|---|---|---|
| **Deploy to GitHub Pages** | Push to `main` | Builds React frontend → deploys live to GitHub Pages |
| **E2E Selenium Tests** | Push to `main` | Runs 120 headless Selenium tests, uploads `.xlsx` report |
| **Security Audit** | Push to `main` | Generates vulnerability Excel report via Node.js + exceljs |
| **Frontend Build Matrix** | Push to `main` | Validates build across Node.js 18.x / 20.x / 22.x |

---

## 🖥️ Verification Walkthrough

1. **Multi-Theme Swap** — Toggle Dark / Light / Neon / Minimal via navbar dropdown
2. **AI SMS Reader** — Dashboard → *Simulate Bank SMS* → load preset → *AI Parse SMS* → Confirm
3. **Receipt Scanner** — Dashboard → *Scan Receipt with OCR* → pick template → *Run AI OCR Scans*
4. **Budget Alerts** — Budgets → Set cap to ₹2000 → Add exceeding expense → alert triggers
5. **CSV Export** — Transactions → *Export CSV* → download spreadsheet instantly
