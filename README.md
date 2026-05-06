
# SKILLX: Elite Peer-to-Peer Skill Exchange

SKILLX is a decentralized, high-fidelity skill-exchange marketplace designed to solve the "cold start" trust problem in peer-to-peer economies. Users trade expertise (e.g., coding for design) using a proprietary **time-credit currency**, backed by a robust, mathematically driven trust and dispute resolution engine.

## 🎯 The Problem Solved
In traditional P2P networks, new users face an impossible hurdle: how do you get hired without reputation, and how do you build reputation without getting hired? Furthermore, how does a platform prevent reciprocal rating fraud (users trading fake reviews)?

SKILLX solves this by implementing a **Trust Bootstrapping Mechanism**, a **Time-Credit Ledger**, and an **Anti-Exploitation Layer**.

---

## ⚙️ Core Architecture & Features

### 1. Time-Credit Ledger & Matching
*   **Skill Currency:** All transactions run on "Credits" rather than fiat currency. Users earn credits by teaching/sharing and spend them to learn.
*   **Immutable Ledger:** Every transfer is recorded atomically in a PostgreSQL transaction ledger, ensuring no credits are double-spent.

### 2. Trust Bootstrapping & Decay
*   **Cold Start Logic:** New users begin with a baseline 10% trust score and an initial micro-grant of 3.0 credits. They are restricted from high-tier platform actions until they prove reliability.
*   **Reputation Decay:** The algorithmic trust engine (`trustService.js`) calculates scores dynamically. Trust decays over periods of inactivity and takes severe mathematical penalties upon losing a formal dispute.

### 3. Anti-Exploitation & Fraud Detection
*   **Reciprocal Fraud Prevention:** The backend actively scans the ledger for "farming" behavior (e.g., User A and User B repeatedly trading the same credit back and forth to artificially inflate their ratings) and automatically flags suspicious accounts.

### 4. Admin Mediation & Dispute Resolution
*   **Evidence-Based Disputes:** If a live session or video course is sub-par, users can raise a "Formal Quality Dispute." They must attach physical evidence (images/PDFs) and a written claim.
*   **Admin Dashboard:** A dedicated portal allows administrators to review evidence and execute forced credit refunds, ensuring marketplace safety.

---

## 🚀 Additional "Elite" Ecosystem Features

To elevate SKILLX from a prototype to a production-ready product, we built a comprehensive surrounding ecosystem:

*   **The Skill Gallery (Asynchronous Marketplace):** Beyond hard-to-schedule live 1-on-1 sessions, users can upload pre-recorded Masterclasses. Other users pay 1 Credit to unlock them, allowing creators to build passive credit income.
*   **Admin Curation Pipeline:** Uploaded Masterclasses enter a "Pending" queue. Admins use a cinematic "Screening Room" to watch and approve/reject content before it reaches the public gallery.
*   **Real-Time Live Chat:** Integrated WebSockets (`Socket.IO`) power real-time, private chat rooms for users to conduct their 1-on-1 live skill exchanges.
*   **Passwordless Authentication:** Secure, frictionless login using Email OTPs (One-Time Passwords) or one-click Google OAuth.
*   **Automated Email Infrastructure:** Automated SMTP notifications for OTP logins, video approvals/rejections, credit purchases, and dispute verdicts.
*   **Supreme UI/UX:** A museum-grade aesthetic featuring cinematic typography (Instrument Serif), deep glassmorphism, Framer Motion micro-animations, and a highly polished slate-and-gold dark mode palette.

---

## 🛠️ Technology Stack

**Frontend:**
*   React (TypeScript)
*   Vite
*   Framer Motion (Animations)
*   Lucide React (Iconography)

**Backend:**
*   Node.js & Express.js
*   PostgreSQL (pg pool for atomic transactions)
*   Socket.IO (Real-time WebSockets)
*   Passport.js (Google OAuth20)
*   Nodemailer (SMTP Emails)

**Infrastructure & Assets:**
*   Cloudinary (Secure Video & Image/PDF Evidence Hosting)
*   Multer (Multipart Form Handling)
*   JSON Web Tokens (JWT) for secure session management

---

## 📦 Local Setup Instructions

1.  **Clone the repository.**
2.  **Database Setup:** Run the `schema.sql` file in your PostgreSQL instance to create the necessary tables and relationships.
3.  **Backend Configuration:**
    *   Navigate to `/backend`.
    *   Create a `.env` file with `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, and Cloudinary credentials.
    *   Run `npm install` followed by `node src/index.js` (runs on port 3001).
4.  **Frontend Configuration:**
    *   Navigate to `/frontend`.
    *   Ensure API endpoints point to `http://localhost:3001`.
    *   Run `npm install` followed by `npm run dev` (runs on port 5173).

*Built for the 2026 Hackathon.*

