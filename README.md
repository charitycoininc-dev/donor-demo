# Charity Coin 🪙

**Gamified charitable giving for The Black History Foundation—donate, earn Charity Coins, enter drawings, and fund mission-aligned nonprofits.**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Ready-orange)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Ready-black)](https://vercel.com/)

## 🎯 What is Charity Coin?

**Charity Coin** is operated by [The Black History Foundation (TBHF)](https://www.tbhfdn.org/), a 501(c)(3) nonprofit (EIN 93-2176256). Donors support TBHF’s mission, receive Charity Coins as symbolic donor recognition, and may participate in drawings:

- **Donate** to TBHF and recommend a vetted, mission-aligned nonprofit
- **Earn Charity Coins** (Solana SPL tokens) as donor recognition—not cash, securities, or wagers
- **Enter drawings** based on where you live:
  - **Raffle-eligible states:** 50/50 raffle entries (where permitted by law)
  - **All other states:** sweepstakes entries instead of raffle entries
- **Optional giving:** donate without entering sweepstakes or raffles

**No purchase necessary** to enter the sweepstakes. A free mail-in method of entry (AMOE) is available and provides the same odds of winning. See the in-app [Official Rules](./src/pages/Rules.jsx).

## 🗺️ Raffles vs. Sweepstakes

State law determines whether a donor can enter the 50/50 raffle. Admins maintain the eligible-state list; the donate flow checks the donor’s state automatically.

| | Raffle-eligible states | All other states |
|---|---|---|
| **Entry type** | 50/50 raffle entries | Sweepstakes entries (1 per $1 donated) |
| **Donation split** | 50% to the recommended nonprofit / 50% to the raffle prize pool | **100%** to the recommended nonprofit |
| **Tax treatment** | 50% typically treated as the charitable portion | **100%** tax-deductible (to the extent allowed by law) |
| **Charity Coins** | Issued after admin approval | Issued after admin approval |
| **Prize pool** | Raffle prize pool | Separate sweepstakes prize pool |

Donors who prefer not to enter either drawing can use **Donate without entering sweepstakes or raffles**, which sends them to TBHF’s standard donate page.

Mail-in sweepstakes entrants do not receive Charity Coins.

## ✨ Core Features

- **🏆 Tier System**: Bronze → Silver → Gold → Platinum based on lifetime giving
- **🗺️ State Eligibility**: Admin-managed list of states permitted to enter raffles
- **🎟️ Sweepstakes**: Drawings for donors (and mail-in entrants) who are not raffle-eligible
- **🎲 Raffles**: Cryptographically secure drawings where raffles are allowed
- **💰 Charity Coins**: SPL tokens issued after donation approval; custodial Solana wallets created when needed
- **📜 Proof-of-Donation**: Donations and drawing results recorded on Solana
- **🏅 Prize Win Banner**: Site-wide congratulations banner when a donor wins
- **📊 Transparency**: Public drawing status, Solscan verification links, and admin audit trails
- **🔐 Admin Oversight**: Donations reviewed before coins and entries are issued
- **📧 Email**: Resend notifications for contact, donation confirmation, approval, and rejection
- **⚖️ Legal Pages**: Official Rules (including AMOE), FAQ, Privacy Policy, and cookie consent

## 🚀 Quick Start

### For Users

1. **Sign up** with email and complete your donor profile (including state)
2. **Recommend a nonprofit** from the curated list
3. **Donate** (admins approve → Charity Coins and raffle or sweepstakes entries are issued)
4. **Track coins, entries, and wins** in My Wallet and on the Raffles page

### For Developers

**Prerequisites**: Node.js 18+, a Firebase project, and (for full local API testing) the Vercel CLI

```bash
# Clone and install
git clone https://github.com/HelpKeepMyMoney/Charity-Coin.git
cd Charity-Coin
pnpm install

# Configure environment
cp .env.example .env
# Add your Firebase config (see below)

# Start the frontend
pnpm run dev
```

The Vite app runs at `http://localhost:3000`. Serverless API routes in `/api` are used in production on Vercel. For local API testing, also run `vercel dev --listen 3001` so Vite can proxy `/api` calls. See `QUICK_START.md`.

**Commands**:

```bash
pnpm run dev          # Development server (port 3000)
pnpm run build        # Production build
pnpm run preview      # Preview production build
pnpm run lint         # ESLint check
pnpm run lint:fix     # ESLint auto-fix
pnpm run format       # Prettier format
```

## 🔥 Firebase Configuration

Enable **Authentication** and **Firestore** on your Firebase project.

Set environment variables with the `VITE_` prefix. The app accepts both `VITE_FIREBASE_*` names and legacy `VITE_*` names (for Vercel compatibility):

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Server-side only (Vercel / API routes)
RESEND_API_KEY=your_resend_api_key
```

### Troubleshooting Connection Issues

1. Confirm all required Firebase variables are set (local `.env` and Vercel project settings)
2. Verify the Firebase project is active and Auth/Firestore are enabled
3. Check Firestore security rules
4. Inspect the browser console for missing-config or permission errors

### Development with Emulators

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase: `firebase init`
3. Start emulators: `firebase emulators:start`
4. Set `VITE_USE_FIREBASE_EMULATORS=true`

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite, React Router v7, Tailwind CSS v4
- **State**: Zustand stores with centralized hooks
- **Backend**: Firebase (Firestore, Auth, Analytics)
- **API**: Vercel serverless functions (`/api`)
- **Email**: Resend
- **Blockchain**: Solana (`@solana/web3.js`, wallet adapters, SPL tokens)
- **Quality**: ESLint v9, Prettier

**Architecture**:

```
src/
├── components/    # Layout, header/footer, banners, cookie consent
├── pages/         # Public and admin routes
├── stores/        # Zustand stores, Firebase service, hooks
├── router/        # React Router configuration
└── utils/         # Currency formatting, state eligibility, etc.
api/               # Vercel serverless endpoints (coins, email, raffles)
```

**Public routes**: Home, Donate, Raffles, My Wallet, About, Contact, Official Rules, FAQ, Privacy Policy

**Admin routes** (role `admin`): dashboard, users, donations/data, raffles, sweepstakes, state eligibility, nonprofits, transactions

## 👥 Who It's For

| Audience | Benefits |
|----------|----------|
| **Donors** | Tax-deductible giving, Charity Coin recognition, and drawings where allowed |
| **Nonprofits** | Recurring funding via TBHF grants (50% or 100% of a donation, based on eligibility) |
| **Communities** | Transparent, gamified engagement with published rules |
| **Organizations** | Modern CSR-style giving with admin controls and audit trails |

## 🛡️ Security & Trust

- **Firebase Auth** and role-based admin routes
- **Donation approval** before coins or entries are issued
- **Encrypted custodial wallets** (AES-256) when donors do not connect their own Solana wallet
- **On-chain Proof-of-Donation** and raffle verification on Solana
- **Official Rules**, AMOE disclosure, privacy policy, and cookie preferences
- **User account status** management for admins

## 🤝 Contributing

**Development**: Fork → feature branch → pull request  
**Non-development**: Test the demo, report bugs, or suggest mission-aligned nonprofits

Coding standards and architecture notes live in `CLAUDE.md` and `/docs`.

## 📚 Documentation

- **Development guide**: `CLAUDE.md`
- **API endpoints**: `api/README.md`
- **Local API testing**: `QUICK_START.md`
- **Vercel env setup**: `docs/VERCEL_SETUP.md`
- **Raffle / Solana notes**: `/docs`
- **Issues**: [GitHub Issues](https://github.com/HelpKeepMyMoney/Charity-Coin/issues)

## 🌟 Project Background

Built for **[The Black History Foundation](https://www.tbhfdn.org/)** to modernize charitable giving through technology.

**Mission**: Preserve and celebrate Black history while building stronger communities through innovative charitable programs.

---

**Live Platform**: [charity-coin-2.vercel.app](https://charity-coin-2.vercel.app/)  
**License**: ISC  
**Built With**: React, Firebase, Zustand, Solana, and ❤️
