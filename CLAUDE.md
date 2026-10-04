# CLAUDE.md - Charity Coin Development Guide

**This file provides essential context for Claude Code instances working on the Charity Coin project.**

## Project Overview

Charity Coin is a gamified charitable giving platform that transforms donations into engaging community experiences. Users donate to vetted nonprofits, earn digital coins as perpetual raffle entries, and compete for prizes while supporting sustainable charitable giving with a 50/50 split model.

## Technology Stack

- **Frontend**: React 19, Vite, React Router v7, Tailwind CSS v4
- **State Management**: Zustand stores with centralized hooks
- **Backend**: Firebase (Firestore, Auth, Analytics)
- **Blockchain**: Solana integration (@solana/web3.js, wallet adapters)
- **Build Tool**: Vite with node polyfills for Solana compatibility
- **Package Manager**: pnpm with workspace configuration
- **Code Quality**: ESLint v9, Prettier (configured in package.json)

## Key Commands

```bash
# Development
pnpm run dev          # Start development server on port 3000
pnpm run build        # Production build
pnpm run preview      # Preview production build

# Code Quality
pnpm run lint         # ESLint check (src/ directory)
pnpm run lint:fix     # ESLint auto-fix
pnpm run format       # Prettier format (src/ directory)
pnpm run format:check # Prettier check
```

## Project Architecture

### Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── AppLayout.jsx    # Main layout with Header/Footer/Notifications
│   ├── Header.jsx       # Navigation header
│   └── ErrorBoundary.jsx # Error handling wrapper
├── pages/               # Route-based page components
│   ├── Home.jsx         # Landing page
│   ├── Donate.jsx       # Donation flow with Solana wallet integration
│   ├── Wallet.jsx       # User wallet/coin management
│   ├── Raffle.jsx       # Raffle entry and management
│   └── Admin/           # Admin-only pages (role-based access)
│       ├── index.jsx    # Admin dashboard
│       ├── UserManagement.jsx
│       ├── DataManagement.jsx
│       ├── RaffleManagement.jsx
│       └── NonprofitManagement.jsx
├── router/
│   └── index.jsx        # React Router v7 configuration
├── stores/              # Zustand state management
│   ├── config/
│   │   └── firebase.js  # Firebase initialization
│   ├── services/
│   │   └── firebaseService.js # Centralized Firestore operations
│   ├── hooks/           # Custom hooks wrapping stores
│   ├── authStore.js     # Authentication state and methods
│   ├── transactionStore.js # Transaction history management
│   ├── raffleStore.js   # Raffle data and entries
│   ├── notificationStore.js # In-app notifications
│   └── index.js         # Central export for all stores/hooks
└── index.jsx            # React 19 app entry point
```

### State Management Architecture

The project uses **Zustand** with a centralized store pattern:

1. **Store Files**: Each domain has its own store (auth, transactions, raffles, notifications)
2. **Custom Hooks**: Wrapper hooks in `stores/hooks/` provide enhanced functionality and patterns
3. **Central Exports**: All stores and hooks exported from `src/stores/index.js`
4. **Firebase Service**: Centralized Firestore operations in `firebaseService.js`

**Key Stores:**
- `authStore.js`: User authentication, profile management, role-based permissions
- `transactionStore.js`: Donation history, transaction types, caching
- `raffleStore.js`: Raffle entries, current raffle data
- `notificationStore.js`: Toast notifications, success/error messages

### Firebase Integration

**Configuration**: Firebase config in `src/stores/config/firebase.js` using environment variables
**Service Layer**: `firebaseService.js` provides consistent CRUD operations
**Collections Structure**:
- `users/` - User profiles and data
- `users/{id}/transactions/` - Individual user transaction history
- `donations/` - All donations with status tracking
- `raffles/` - Raffle data and entries
- `nonprofits/` - Vetted nonprofit organizations

### Authentication Flow

1. Firebase Auth integration with real-time user state listening
2. User document creation/sync in Firestore on signup
3. Role-based access control (admin/user roles)
4. Automatic tier calculation based on donation amounts
5. Session persistence and cleanup on logout

### Admin System

**Access Control**: Role-based (user.role === "admin")
**Protected Routes**: Admin pages check authentication and role
**Key Features**:
- User profile management
- Donation approval workflow
- Raffle management
- Nonprofit organization management
- Data cleanup utilities

## Configuration Files

### Vite Configuration (`vite.config.js`)
- Tailwind CSS v4 plugin integration
- Node.js polyfills for Solana compatibility (Buffer, process, global)
- Environment variable injection for Firebase
- Path alias: `@` → `/src`
- Optimizations for lucide-react exclusion

### ESLint Configuration (`eslint.config.js`)
- ESLint v9 flat config format
- React, React Hooks, and React Refresh plugins
- Prettier integration via eslint-config-prettier
- Ignores: dist/, node_modules/
- Disabled prop-types and react-in-jsx-scope rules

### Tailwind Configuration (`src/index.css`)
- Tailwind CSS v4 with @theme directive
- Custom color palettes: deep-red-* and gold-*  
- Custom animations: fadeIn, slideUp, bounceGentle
- Solana wallet adapter styling overrides

### pnpm Configuration
- Workspace configuration in `pnpm-workspace.yaml`
- Binary dependencies optimization for Solana packages

## Key Patterns and Conventions

### Component Patterns
1. **Function components** with hooks (React 19)
2. **Error boundaries** for robust error handling
3. **Loading states** with skeleton UI
4. **Responsive design** with Tailwind breakpoints

### State Management Patterns
1. **Store actions** return promises for async operations
2. **Custom hooks** provide business logic and error handling
3. **Cache management** with TTL for expensive operations
4. **Real-time listeners** for Firebase data synchronization

### Data Flow Patterns
1. **Optimistic updates** for immediate UI feedback
2. **Transaction validation** before Firebase writes
3. **Batch operations** for multi-step processes
4. **Error boundaries** with user-friendly messages

## Environment Variables

Required environment variables (prefix with `VITE_`):
- `VITE_FIREBASE_API_KEY`
- `VITE_AUTH_DOMAIN`
- `VITE_PROJECT_ID`
- `VITE_STORAGE_BUCKET`
- `VITE_SENDER_ID`
- `VITE_APP_ID`
- `VITE_MEASUREMENT_ID`

## Development Workflow

1. **Branch Management**: Feature branches off `main`, current working branch is `frank`
2. **Code Style**: Prettier configured with double quotes, ESLint for React best practices
3. **Testing**: Manual testing workflow, admin approval system for donations
4. **Deployment**: Production build with `pnpm run build`

## Security Considerations

1. **Firebase Security Rules**: Enforce user-based data access
2. **Admin Role Verification**: Server-side role checking required
3. **Input Validation**: Client-side validation with server-side verification
4. **Environment Variables**: Sensitive config via environment variables
5. **CORS and CSP**: Configured for Firebase and Solana endpoints

## Important Implementation Notes

1. **React 19**: Uses latest React features and concurrent rendering
2. **Solana Integration**: Wallet adapters configured for Phantom/Solflare
3. **Real-time Updates**: Firebase listeners for live data synchronization
4. **Mobile Responsive**: Tailwind responsive design throughout
5. **Accessibility**: Semantic HTML and ARIA labels where needed
6. **Performance**: Zustand devtools, component memoization, lazy loading

## Debugging and Troubleshooting

1. **Redux DevTools**: Zustand stores have DevTools integration
2. **Firebase Console**: Monitor Firestore operations and auth
3. **Network Tab**: Check API calls and WebSocket connections
4. **React DevTools**: Component state and performance profiling

## Recent Architecture Changes

The project recently underwent a major refactor consolidating Firebase operations and moving from Context API to Zustand stores. Key changes include:
- Centralized Firebase service layer
- Zustand stores replacing React Context
- Enhanced admin management structure
- Improved error handling and loading states

For detailed migration notes, see `/docs/misc/` directory.