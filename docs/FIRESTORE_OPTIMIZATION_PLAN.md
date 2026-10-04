# 🔥 Firestore Optimization Plan - Critical Fixes

## 🚨 **Current Problem: 86K Reads/Day (Exceeding Free Tier)**

Based on Firebase console data showing 86K reads in 24 hours, with a massive spike between 8-10 PM reaching ~100K reads/hour, we need immediate optimizations.

## 🧪 **Testing Impact: 52K Reads in 1 Hour**

During testing (donations + raffles), the app generated **52,000 reads in 1 hour**. This indicates severe inefficiencies in donation approval and raffle operations. See `docs/FIRESTORE_TESTING_ANALYSIS.md` for detailed breakdown.

## 📊 **Root Causes Identified**

### **1. CRITICAL: usePrizeWin Hook - 10 Second Refresh Interval**
- **Location**: `src/stores/hooks/usePrizeWin.js`
- **Problem**: Refreshes transactions every 10 seconds for EVERY authenticated user
- **Impact**: 
  - 10 users online = 360 reads/hour/user = 3,600 reads/hour
  - 50 users online = 18,000 reads/hour
  - This alone could cause the 8-10 PM spike!
- **Fix**: Increase interval to 60 seconds, use real-time listener instead, or only refresh when page is visible

### **2. CRITICAL: Transaction Fetching - No Limits**
- **Location**: `src/stores/transactionStore.js`
- **Problem**: Removed limits, fetching ALL transactions for every user
- **Impact**: If a user has 500 transactions, that's 500 reads per fetch
- **Fix**: Re-implement reasonable limits (50-100 most recent), use pagination

### **3. HIGH: Admin Transaction Management**
- **Location**: `src/pages/Admin/TransactionManagement.jsx`
- **Problem**: 
  - Fetches ALL users (no limit)
  - Fetches 1000 transactions per user
  - Fetches 500 donations
- **Impact**: If 100 users, that's 100,000+ reads in one admin page load
- **Fix**: Implement pagination, reduce limits, add caching

### **4. HIGH: Cache Duration Too Short**
- **Location**: `src/stores/transactionStore.js`
- **Problem**: Cache duration is 10 seconds (60,000ms)
- **Impact**: Transactions refetched too frequently
- **Fix**: Increase to 5 minutes (300,000ms) for regular users

### **5. MEDIUM: Admin Pages Fetching Entire Collections**
- **Location**: `src/pages/Admin/index.jsx`, `src/pages/Admin/UserManagement.jsx`
- **Problem**: Fetching all donations, all nonprofits, all users without limits
- **Impact**: Hundreds to thousands of reads per admin page load
- **Fix**: Add limits, implement pagination, add caching

### **6. MEDIUM: Multiple onSnapshot Listeners**
- **Location**: `src/stores/authStore.js`, `src/stores/raffleStore.js`
- **Problem**: Potential duplicate listeners, not properly cleaned up
- **Impact**: Each listener causes continuous reads
- **Fix**: Ensure proper cleanup, deduplicate listeners

## 🛠️ **Immediate Fixes (Priority Order)**

### **Fix 1: usePrizeWin Hook - Reduce Refresh Frequency** ⚡ CRITICAL
```javascript
// Change from 10 seconds to 60 seconds
const refreshInterval = setInterval(() => {
  // ...
}, 60000); // 60 seconds instead of 10000

// OR better: Only refresh when page is visible
const refreshInterval = setInterval(() => {
  if (document.visibilityState === 'visible') {
    refreshTransactions(userId);
  }
}, 30000); // 30 seconds, but only when visible
```

### **Fix 2: Transaction Store - Re-add Limits** ⚡ CRITICAL
```javascript
// Add reasonable limit back
txQuery = query(
  collection(db, "users", userId, "transactions"),
  orderBy("createdAt", "desc"),
  limit(50) // Limit to 50 most recent transactions
);
```

### **Fix 3: Increase Cache Duration** ⚡ CRITICAL
```javascript
cacheDuration: 300000, // 5 minutes instead of 1 minute
```

### **Fix 4: Admin Transaction Management - Add Limits** 🔥 HIGH
```javascript
// Limit users fetched
const usersQuery = query(
  collection(db, "users"),
  limit(50) // Only fetch first 50 users
);

// Reduce transaction limit per user
limit(50) // Instead of 1000

// Reduce donations limit
limit(100) // Instead of 500
```

### **Fix 5: Admin Pages - Add Limits and Caching** 🔥 HIGH
```javascript
// Add limits to all collection queries
const donationsQuery = query(
  collection(db, "donations"),
  orderBy("createdAt", "desc"),
  limit(100) // Already done in DataManagement, but check others
);
```

## 📈 **Expected Impact**

### **Before Optimizations:**
- usePrizeWin: ~18,000 reads/hour (50 users × 360 reads/hour)
- Transaction fetching: ~5,000 reads/hour (50 users × 100 reads/hour)
- Admin pages: ~10,000 reads per admin session
- **Total: ~23,000 reads/hour = 552,000 reads/day**

### **After Optimizations:**
- usePrizeWin: ~3,000 reads/hour (50 users × 60 reads/hour) - **83% reduction**
- Transaction fetching: ~2,500 reads/hour (50 users × 50 reads/hour with caching) - **50% reduction**
- Admin pages: ~500 reads per admin session - **95% reduction**
- **Total: ~5,500 reads/hour = 132,000 reads/day**

### **Target: Under 50,000 reads/day (Free tier limit)**

## 🎯 **Implementation Priority**

1. ✅ **Fix 1**: usePrizeWin refresh interval (IMMEDIATE)
2. ✅ **Fix 2**: Transaction limits (IMMEDIATE)
3. ✅ **Fix 3**: Cache duration (IMMEDIATE)
4. ✅ **Fix 4**: Admin transaction limits (HIGH)
5. ✅ **Fix 5**: Admin page limits (HIGH)

## 📝 **Additional Recommendations**

1. **Implement Page Visibility API**: Only refresh data when page is visible
2. **Use Real-time Listeners**: Replace polling with onSnapshot for prize wins
3. **Implement Pagination**: For all admin pages
4. **Add Request Debouncing**: Prevent rapid successive requests
5. **Monitor Usage**: Add Firebase usage tracking to identify future spikes

