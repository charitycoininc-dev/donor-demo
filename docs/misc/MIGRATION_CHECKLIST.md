# ✅ Context API → Zustand Migration Checklist

## 📋 Pre-Migration Setup

- [ ] **Create backup branch**: `git checkout -b pre-context-migration`
- [ ] **Document current functionality** of target component
- [ ] **Run existing tests** to establish baseline
- [ ] **Take screenshots** of UI functionality (if applicable)

---

## 🔄 Component Migration Process

### Step 1: Analyze Current Usage
- [ ] **Identify Context dependencies** in target component
  ```javascript
  // Look for these patterns:
  const { user, dispatch, currentRaffle, isAuthenticated } = useApp();
  ```
- [ ] **List all Context API calls** used in component
- [ ] **Note any dispatch actions** that need replacement
- [ ] **Document any complex state logic**

### Step 2: Plan Zustand Replacement
- [ ] **Map Context state to Zustand stores**:
  ```javascript
  // Context API → Zustand mapping:
  user, isAuthenticated → useAuth()
  currentRaffle → useRaffle()  
  transactions → useTransactions()
  notifications → useNotifications()
  ```
- [ ] **Identify required store actions**
- [ ] **Plan dispatch replacements** with store methods

### Step 3: Update Imports
- [ ] **Remove Context API import**:
  ```javascript
  // ❌ Remove this line
  import { useApp } from '../hooks/useApp';
  ```
- [ ] **Add Zustand store imports**:
  ```javascript
  // ✅ Add appropriate stores
  import { useAuth, useRaffle, useTransactions } from '../stores';
  ```

### Step 4: Replace Hook Usage
- [ ] **Replace useApp() call**:
  ```javascript
  // ❌ Old Context API usage
  const { user, dispatch, currentRaffle } = useApp();
  
  // ✅ New Zustand usage
  const { user, isAuthenticated } = useAuth();
  const { currentRaffle } = useRaffle();
  ```

### Step 5: Replace Dispatch Calls
- [ ] **Convert dispatch actions to store methods**:
  ```javascript
  // ❌ Old dispatch pattern
  dispatch({ type: 'UPDATE_USER', payload: userData });
  dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  
  // ✅ New store methods
  const { updateUser } = useAuth();
  const { notifySuccess } = useNotifications();
  updateUser(userData);
  notifySuccess('Profile updated!');
  ```

### Step 6: Update State Access
- [ ] **Verify all state access still works**
- [ ] **Check conditional rendering** based on auth state
- [ ] **Ensure user data access** is correct
- [ ] **Test loading states** and error handling

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] **Basic functionality** works as before
- [ ] **User authentication** flows work correctly
- [ ] **Data loading** and display works
- [ ] **User interactions** trigger correct responses
- [ ] **Error handling** displays appropriate messages
- [ ] **Loading states** show correctly

### State Management Testing
- [ ] **Real-time updates** still work (if applicable)
- [ ] **State persistence** across page refreshes
- [ ] **State sharing** between components works
- [ ] **State cleanup** on component unmount

### Performance Testing
- [ ] **Page load times** haven't regressed
- [ ] **Re-render frequency** is reasonable (check React DevTools)
- [ ] **Memory usage** is stable
- [ ] **Network requests** are optimized

### Edge Case Testing
- [ ] **Unauthenticated users** see correct content
- [ ] **Network errors** are handled gracefully
- [ ] **Empty states** display correctly
- [ ] **Permission-based content** shows/hides appropriately

---

## 🎯 Component-Specific Checklists

### Admin Components (`src/pages/Admin/*`)
- [ ] **Admin permissions** are checked correctly
- [ ] **User management** functions work
- [ ] **Data manipulation** (CRUD operations) work
- [ ] **Real-time updates** for admin data
- [ ] **Error messages** for failed operations

### Navigation Components (`src/components/Navbar.jsx`)
- [ ] **User display name** shows correctly
- [ ] **Authentication state** reflects in UI
- [ ] **Login/logout links** work properly
- [ ] **Route protection** functions correctly

### Page Components (`src/pages/*`)
- [ ] **Page-specific state** loads correctly
- [ ] **User-specific content** displays appropriately
- [ ] **Protected routes** work as expected
- [ ] **Data fetching** happens on page load

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot read properties of undefined"
**Problem**: Accessing user data before it's loaded
```javascript
// ❌ Problematic code
const userName = user.firstName; // user might be null

// ✅ Safe access
const userName = user?.firstName || 'Guest';
```
**Checklist**:
- [ ] Add null checks for user data
- [ ] Use optional chaining (`?.`) for nested properties
- [ ] Provide fallback values for undefined data

### Issue 2: "Hook not found" or Import Errors
**Problem**: Incorrect import paths after migration
```javascript
// ❌ Old import (now broken)
import { useApp } from '../hooks/useApp';

// ✅ Correct new import
import { useAuth } from '../stores';
```
**Checklist**:
- [ ] Update all import paths
- [ ] Remove unused imports
- [ ] Check relative path correctness

### Issue 3: State Updates Not Working
**Problem**: Using old dispatch patterns instead of store actions
```javascript
// ❌ Old dispatch (won't work)
dispatch({ type: 'UPDATE_USER', payload: data });

// ✅ New store action
const { updateUser } = useAuth();
updateUser(data);
```
**Checklist**:
- [ ] Replace all dispatch calls with store actions
- [ ] Verify store actions are imported correctly
- [ ] Test that state updates trigger re-renders

### Issue 4: Real-time Updates Stopped
**Problem**: Real-time listeners not set up correctly
**Solution**: Zustand stores auto-handle listeners, but verify setup
**Checklist**:
- [ ] Check that store hooks are used in components
- [ ] Verify Firestore listeners are active (check DevTools)
- [ ] Test real-time updates with multiple browser tabs

---

## 📊 Migration Progress Tracking

### Component Status Template
Copy this template for each component:

```markdown
## [Component Name] Migration Status

**File**: `src/path/to/component.jsx`
**Priority**: High/Medium/Low
**Complexity**: Low/Medium/High

### Current Context Usage:
- [ ] `user` 
- [ ] `isAuthenticated`
- [ ] `dispatch`
- [ ] `currentRaffle`
- [ ] Other: ___________

### Migration Plan:
- [ ] Replace `useApp()` with appropriate Zustand hooks
- [ ] Update imports
- [ ] Replace dispatch calls
- [ ] Test functionality

### Testing Complete:
- [ ] Functional testing passed
- [ ] State management testing passed
- [ ] Performance testing passed
- [ ] Edge case testing passed

**Status**: Not Started / In Progress / Testing / Complete
**Notes**: ________________________________
```

---

## 🎉 Post-Migration Cleanup

### After ALL Components Are Migrated:
- [ ] **Remove Context API files**:
  ```bash
  rm src/contexts/AppProvider.jsx
  rm src/contexts/index.js
  rm src/hooks/useApp.js
  ```
- [ ] **Remove AppProvider from root**:
  ```javascript
  // In src/index.jsx, remove:
  import { AppProvider } from './contexts';
  // And remove <AppProvider> wrapper
  ```
- [ ] **Clean up unused imports** across the codebase
- [ ] **Update documentation** to reflect new architecture
- [ ] **Run final tests** to ensure everything works

### Verification Steps:
- [ ] **Search codebase** for any remaining Context API usage:
  ```bash
  grep -r "useApp\|AppProvider\|AppContext" src/
  # Should return no results
  ```
- [ ] **Run build** to ensure no import errors
- [ ] **Run tests** to ensure functionality is preserved
- [ ] **Performance check** to verify improvements

---

## 📈 Success Metrics

### Before vs After Comparison:
- **Lines of Code**: Track reduction (~500 lines saved)
- **Bundle Size**: Measure any changes
- **Page Load Time**: Should improve with better state management
- **Re-render Count**: Should decrease with optimized updates

### Quality Improvements:
- [ ] **Consistent state management** across entire app
- [ ] **Better developer experience** with DevTools
- [ ] **Improved performance** with optimized re-renders
- [ ] **Cleaner architecture** with clear separation of concerns

---

## 🆘 Emergency Procedures

### If Migration Breaks Critical Functionality:
1. **Immediate rollback**:
   ```bash
   git checkout pre-context-migration
   ```
2. **Identify the issue** in a safe environment
3. **Fix the problem** on a separate branch
4. **Re-attempt migration** with the fix

### If Partial Migration Needed:
- Keep both systems running temporarily
- Use feature flags to switch between approaches
- Migrate incrementally over multiple releases

### Need Help?
- Check existing migrated components for patterns
- Review Zustand store documentation
- Test in development environment first
- Ask for code review before merging

---

**Remember**: Take your time, test thoroughly, and migrate one component at a time. The goal is a cleaner, more maintainable codebase! 🚀