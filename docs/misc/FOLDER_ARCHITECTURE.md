# 📁 Folder Architecture Guide: Context vs Stores vs Hooks

## Overview

After migrating from Context API to Zustand, this document clarifies when to use each folder structure in the Charity Coin application. This guide helps developers choose the right approach for different types of state and functionality.

## 🏗️ Current Architecture Status

### ✅ Modern Architecture (Use This)
- **`src/stores/`** - Zustand-based global state management
- **`src/hooks/`** - Utility and UI behavior hooks

### ⚠️ Legacy Architecture (Being Deprecated)
- **`src/contexts/`** - Old Context API implementation (will be removed)

---

## 📊 When to Use Each Folder

### 🎯 `src/stores/` - Global State Management
**✅ Primary choice for all new development**

#### Structure:
```
src/stores/
├── authStore.js              # User authentication & session
├── transactionStore.js       # Financial transactions & history  
├── raffleStore.js           # Raffle state & operations
├── notificationStore.js     # Global UI notifications
├── hooks/                   # Store-specific custom hooks
│   ├── useAuth.js          # Enhanced auth patterns & helpers
│   ├── useTransactions.js  # Transaction utilities & pagination
│   ├── useRaffle.js        # Raffle management & calculations
│   └── useNotifications.js # Notification helpers & types
├── services/               # Business logic & external APIs
│   └── firebaseService.js  # Centralized Firestore operations
└── index.js               # Central export point
```

#### When to Use:
- ✅ **Global application state** (user data, auth status, notifications)
- ✅ **Complex state** that needs DevTools debugging and performance optimization
- ✅ **Real-time data** that requires Firestore synchronization
- ✅ **Cross-component state** shared between multiple pages/components
- ✅ **Cached data** that benefits from automatic cache management
- ✅ **All new features** - this is the modern approach

#### Examples:
```javascript
// ✅ Good: Global state management
import { useAuth, useTransactions, useNotifications } from '../stores';

function MyComponent() {
  const { user, signOut } = useAuth();
  const { transactions, loading } = useTransactions();
  const { notifySuccess } = useNotifications();
  
  // ... component logic
}
```

#### Benefits:
- 🚀 **Performance**: Automatic caching, optimized re-renders
- 🔧 **DevTools**: Full Redux DevTools integration for debugging
- 📊 **Real-time**: Automatic Firestore synchronization
- 🎯 **Type Safety**: Better TypeScript support
- 🧪 **Testing**: Easier to mock and test

---

### 🪝 `src/hooks/` - Utility & UI Behavior Hooks
**✅ Use for reusable utilities and UI behavior**

#### Current Contents:
- `useScrollToTop.js` - Router scroll restoration ✅ **Keep**
- `useFirebase.js` - Firebase configuration & utilities ✅ **Keep**
- `useApp.js` - Context API bridge ❌ **Remove after migration**

#### When to Use:
- ✅ **UI behavior hooks** (scroll management, animations, DOM interactions)
- ✅ **Browser API utilities** (localStorage, sessionStorage, window events)
- ✅ **Input utilities** (debouncing, validation, formatting)
- ✅ **Third-party integrations** (non-state related)
- ✅ **Reusable logic** that doesn't manage global state

#### Examples of Good Hooks:
```javascript
// ✅ Good: UI utility hook
export function useLocalStorage(key, defaultValue) {
  // localStorage management logic
}

// ✅ Good: Input utility hook  
export function useDebounce(value, delay) {
  // debouncing logic
}

// ✅ Good: Browser API hook
export function useWindowSize() {
  // window resize handling
}

// ✅ Good: Router utility hook (existing)
export function useScrollToTop() {
  // scroll restoration on route change
}
```

#### What NOT to Put Here:
```javascript
// ❌ Bad: Global state (belongs in stores/)
export function useUserData() {
  const [user, setUser] = useState(null);
  // This should be in authStore instead
}

// ❌ Bad: Complex business logic (belongs in stores/services/)
export function useDonationProcessing() {
  // Complex donation logic should be in stores
}
```

---

### 🔄 `src/contexts/` - Legacy Context API (DEPRECATED)
**⚠️ Status: Being phased out - DO NOT USE for new features**

#### Current Contents:
- `AppProvider.jsx` - Legacy global state provider (460+ lines of code)
- `index.js` - Context exports

#### Current Usage:
Still being used by **10 components** that need migration:
- `src/pages/Admin/index.jsx`
- `src/pages/Admin/NonprofitManagement.jsx`
- `src/pages/Home.jsx`
- `src/components/Navbar.jsx`
- And 6 others...

#### Migration Strategy:
1. **Identify** components using `useApp()` hook
2. **Replace** Context API calls with appropriate Zustand stores
3. **Test** functionality after migration
4. **Remove** Context API files once all components are migrated

#### Will Be Deleted:
```javascript
// ❌ These files will be removed:
src/contexts/AppProvider.jsx  // 460+ lines
src/contexts/index.js
src/hooks/useApp.js
```

---

## 🎯 Quick Decision Tree

```
Need to add functionality?
│
├─ Global state management?
│  ├─ User auth/session? ────────────→ useAuth (stores/)
│  ├─ Financial data? ──────────────→ useTransactions (stores/)
│  ├─ UI notifications? ────────────→ useNotifications (stores/)
│  └─ Other global state? ──────────→ Create new store (stores/)
│
├─ Reusable UI utility?
│  ├─ Browser API interaction? ─────→ src/hooks/
│  ├─ Input processing? ────────────→ src/hooks/
│  └─ UI behavior? ─────────────────→ src/hooks/
│
└─ Working with legacy code?
   └─ Migrate to Zustand ASAP ─────→ src/stores/
```

---

## 🧹 Cleanup Roadmap

### Phase 1: Complete Migration (High Priority)
- [ ] **Identify** all 10 components using Context API
- [ ] **Migrate** each component to appropriate Zustand stores
- [ ] **Test** functionality after each migration
- [ ] **Update** imports and remove `useApp()` calls

### Phase 2: Remove Legacy Code (High Priority)
- [ ] **Delete** `src/contexts/AppProvider.jsx` (460+ lines saved!)
- [ ] **Delete** `src/contexts/index.js`
- [ ] **Delete** `src/hooks/useApp.js`
- [ ] **Remove** Context provider from `src/index.jsx`

### Phase 3: Optimize Architecture (Medium Priority)
- [ ] **Consolidate** Firebase operations to use `firebaseService.js`
- [ ] **Add** utility hooks to `src/hooks/` as needed
- [ ] **Review** store organization and optimize

### Phase 4: Documentation (Low Priority)
- [ ] **Update** component documentation
- [ ] **Create** migration guides for future developers
- [ ] **Document** best practices and patterns

---

## 🏆 Best Practices

### For Stores (`src/stores/`)
- ✅ Keep stores focused on specific domains (auth, transactions, etc.)
- ✅ Use custom hooks for common patterns
- ✅ Leverage caching and real-time listeners
- ✅ Use DevTools middleware for debugging
- ✅ Implement proper error handling

### For Hooks (`src/hooks/`)
- ✅ Keep hooks pure and reusable
- ✅ Focus on utilities, not global state
- ✅ Use proper dependency arrays
- ✅ Handle cleanup in useEffect
- ✅ Make hooks composable

### General Guidelines
- ✅ **Prefer stores** for any state that persists across routes
- ✅ **Prefer hooks** for reusable utilities and UI behavior
- ✅ **Avoid** mixing state management approaches in the same component
- ✅ **Test** thoroughly when migrating from Context API
- ✅ **Document** any new patterns or complex logic

---

## 📈 Migration Impact

### Before Cleanup:
- **3 different approaches** for state management
- **460+ lines** of duplicate/deprecated code
- **Confusion** about which pattern to use
- **Performance issues** with Context API re-renders

### After Cleanup:
- **1 clear approach** for global state (Zustand)
- **Clean separation** between state and utilities  
- **Better performance** with optimized re-renders
- **Improved developer experience** with DevTools
- **~500 lines** of code reduction

---

## 🚀 Quick Start for New Features

### Adding Global State:
```javascript
// 1. Create or extend a store
import useAuthStore from '../stores/authStore';

// 2. Use in components
import { useAuth } from '../stores';

function MyComponent() {
  const { user, signIn } = useAuth();
  // ...
}
```

### Adding Utility Hook:
```javascript
// 1. Create in src/hooks/
export function useMyUtility(input) {
  // utility logic
  return result;
}

// 2. Use in components
import useMyUtility from '../hooks/useMyUtility';
```

### Working with Legacy Code:
```javascript
// ❌ Old way (being deprecated)
import { useApp } from '../hooks/useApp';

// ✅ New way (migrate to this)
import { useAuth, useTransactions } from '../stores';
```

---

## 📞 Need Help?

- **State management questions**: Check existing stores in `src/stores/`
- **Utility hook questions**: Look at `src/hooks/useScrollToTop.js` as example
- **Migration questions**: Follow the patterns in already-migrated components
- **Performance issues**: Use Zustand DevTools to debug state changes

Remember: **When in doubt, use `src/stores/` for global state and `src/hooks/` for utilities!**