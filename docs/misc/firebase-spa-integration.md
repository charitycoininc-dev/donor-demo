# Database Access Patterns in SPA (React + Firebase)

## 🔍 **Current Database Access Pattern in Your Project**

### **Your Architecture: Frontend → Firebase**
```
React SPA (Browser) → Firebase SDK → Firestore Database
```

## 📊 **How Your Project Currently Handles Database Access**

### **1. Firebase Configuration (src/Firebase.jsx)**
```javascript
// This is your database connection setup
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  // Your config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);  // ← Database connection
export const auth = getAuth(app);     // ← Authentication
```

### **2. Database Queries in Components**

#### **Reading Data (src/context/AppContext.jsx)**
```javascript
import { onSnapshot, doc } from 'firebase/firestore';

// Real-time listener for user data
const userRef = doc(db, 'users', user.uid);
onSnapshot(userRef, (userDoc) => {
  if (userDoc.exists()) {
    dispatch({ type: 'SET_USER', payload: userDoc.data() });
  }
});
```

#### **Writing Data (src/pages/Donate.jsx)**
```javascript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Add new donation
const handleDonate = async (donationData) => {
  try {
    await addDoc(collection(db, 'donations'), {
      ...donationData,
      createdAt: serverTimestamp(),
      status: 'pending'
    });
  } catch (error) {
    console.error('Donation failed:', error);
  }
};
```

#### **Complex Queries (Admin Pages)**
```javascript
import { getDocs, query, where, orderBy } from 'firebase/firestore';

// Get filtered data
const getPendingDonations = async () => {
  const q = query(
    collection(db, 'donations'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

## 🏗️ **Database Access Patterns in SPAs**

### **Pattern 1: Direct Firebase SDK (Your Current Approach)**
```javascript
// ✅ Pros: Real-time updates, offline support, simple setup
// ❌ Cons: Client-side security rules, larger bundle size

// Example from your project:
import { db } from '../Firebase.jsx';
import { collection, addDoc } from 'firebase/firestore';

const saveUser = async (userData) => {
  await addDoc(collection(db, 'users'), userData);
};
```

### **Pattern 2: REST API Backend (Alternative)**
```javascript
// ✅ Pros: Server-side security, smaller client bundle
// ❌ Cons: No real-time updates, more complex setup

// Example (not your current approach):
const saveUser = async (userData) => {
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
};
```

### **Pattern 3: GraphQL (Alternative)**
```javascript
// ✅ Pros: Efficient queries, type safety
// ❌ Cons: Learning curve, setup complexity

// Example (not your current approach):
const SAVE_USER = gql`
  mutation SaveUser($userData: UserInput!) {
    saveUser(userData: $userData) { id }
  }
`;
```

## 🔐 **Security in Your SPA**

### **Firestore Security Rules (Server-side)**
```javascript
// firestore.rules - Runs on Firebase servers
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Only admins can manage donations
    match /donations/{donationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### **Client-side Authentication Check**
```javascript
// Your AppContext.jsx handles this
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is authenticated - can access database
    dispatch({ type: 'SET_USER', payload: user });
  } else {
    // User not authenticated - redirect to login
    dispatch({ type: 'LOGOUT' });
  }
});
```

## 📱 **Real-time vs One-time Queries**

### **Real-time Listeners (Live Updates)**
```javascript
// Used in your AppContext.jsx
import { onSnapshot } from 'firebase/firestore';

// Updates automatically when data changes
const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
  setUser(doc.data());
});

// Don't forget to cleanup!
return () => unsubscribe();
```

### **One-time Queries (Fetch Once)**
```javascript
// Used in your admin pages
import { getDoc, getDocs } from 'firebase/firestore';

// Get single document
const getUserData = async (userId) => {
  const docSnap = await getDoc(doc(db, 'users', userId));
  return docSnap.exists() ? docSnap.data() : null;
};

// Get multiple documents
const getAllUsers = async () => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

## 🔄 **Common Firestore Operations**

### **Create (Add Document)**
```javascript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Add with auto-generated ID
const createDonation = async (donationData) => {
  const docRef = await addDoc(collection(db, 'donations'), {
    ...donationData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// Add with custom ID
import { setDoc, doc } from 'firebase/firestore';
const createUser = async (userId, userData) => {
  await setDoc(doc(db, 'users', userId), userData);
};
```

### **Read (Get Documents)**
```javascript
import { getDoc, getDocs, query, where } from 'firebase/firestore';

// Get single document
const getUser = async (userId) => {
  const docSnap = await getDoc(doc(db, 'users', userId));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

// Get all documents
const getAllDonations = async () => {
  const querySnapshot = await getDocs(collection(db, 'donations'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get filtered documents
const getPendingDonations = async () => {
  const q = query(collection(db, 'donations'), where('status', '==', 'pending'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

### **Update (Modify Documents)**
```javascript
import { updateDoc, doc } from 'firebase/firestore';

// Update specific fields
const updateUserProfile = async (userId, updates) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
};

// Add to array field
import { arrayUnion } from 'firebase/firestore';
const addCoinToUser = async (userId, coinNumber) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    coinNumbers: arrayUnion(coinNumber)
  });
};
```

### **Delete (Remove Documents)**
```javascript
import { deleteDoc, doc } from 'firebase/firestore';

// Delete document
const deleteDonation = async (donationId) => {
  await deleteDoc(doc(db, 'donations', donationId));
};

// Delete field from document
import { deleteField } from 'firebase/firestore';
const removeUserField = async (userId, fieldName) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    [fieldName]: deleteField()
  });
};
```

## 🎯 **Best Practices from Your Project**

### **1. Centralized Database Connection**
```javascript
// src/Firebase.jsx - Single source of truth
export const db = getFirestore(app);
```

### **2. Error Handling**
```javascript
// Always wrap database calls in try-catch
try {
  await addDoc(collection(db, 'donations'), donationData);
  setSuccess('Donation submitted successfully!');
} catch (error) {
  console.error('Error:', error);
  setError('Failed to submit donation');
}
```

### **3. Loading States**
```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await getDocs(collection(db, 'users'));
    setUsers(data.docs.map(doc => doc.data()));
  } finally {
    setLoading(false);
  }
};
```

### **4. Data Validation**
```javascript
// Validate data before sending to database
const validateDonation = (donationData) => {
  if (!donationData.amount || donationData.amount <= 0) {
    throw new Error('Invalid donation amount');
  }
  // More validation...
};
```

### **5. Cleanup Listeners**
```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
    setUser(doc.data());
  });

  // Cleanup on component unmount
  return () => unsubscribe();
}, [userId]);
```

## 🔄 **Comparison with Nuxt.js Backend Pattern**

### **Nuxt.js Pattern (Server-side)**
```javascript
// server/api/users.js
export default defineEventHandler(async (event) => {
  const users = await getUsersFromDatabase();
  return users;
});

// pages/users.vue
const { data: users } = await $fetch('/api/users');
```

### **Your React + Firebase Pattern (Client-side)**
```javascript
// src/utils/database.js
export const getUsers = async () => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => doc.data());
};

// src/pages/Users.jsx
const [users, setUsers] = useState([]);
useEffect(() => {
  getUsers().then(setUsers);
}, []);
```

## 📈 **Performance Optimization**

### **1. Query Optimization**
```javascript
// ✅ Good: Specific queries
const recentDonations = query(
  collection(db, 'donations'),
  where('createdAt', '>', yesterday),
  orderBy('createdAt', 'desc'),
  limit(10)
);

// ❌ Bad: Getting all data
const allDonations = collection(db, 'donations');
```

### **2. Pagination**
```javascript
import { startAfter, limit } from 'firebase/firestore';

// First page
const firstPage = query(
  collection(db, 'donations'),
  orderBy('createdAt', 'desc'),
  limit(10)
);

// Next page
const nextPage = query(
  collection(db, 'donations'),
  orderBy('createdAt', 'desc'),
  startAfter(lastDoc),
  limit(10)
);
```

### **3. Compound Queries**
```javascript
// Index required for compound queries
const complexQuery = query(
  collection(db, 'donations'),
  where('status', '==', 'approved'),
  where('amount', '>=', 100),
  orderBy('amount', 'desc')
);
```

### **4. Caching with React Query (Optional Enhancement)**
```javascript
// Could enhance your project with react-query
import { useQuery } from 'react-query';

const { data: users, isLoading } = useQuery(
  'users',
  () => getDocs(collection(db, 'users')),
  { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
);
```

## 🛠️ **Debugging Database Access**

### **1. Enable Firestore Debug Logging**
```javascript
import { connectFirestoreEmulator } from 'firebase/firestore';

// In development
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### **2. Query Performance Monitoring**
```javascript
const startTime = Date.now();
const querySnapshot = await getDocs(collection(db, 'users'));
console.log(`Query took ${Date.now() - startTime}ms`);
```

### **3. Network Tab Inspection**
- Open Chrome DevTools → Network tab
- Look for `firestore.googleapis.com` requests
- Check request/response payloads

## 🚨 **Common Pitfalls to Avoid**

### **1. Reading Too Much Data**
```javascript
// ❌ Bad: Reading entire collection
const allUsers = await getDocs(collection(db, 'users'));

// ✅ Good: Use pagination and filters
const recentUsers = query(collection(db, 'users'), limit(20));
```

### **2. Not Handling Loading States**
```javascript
// ❌ Bad: No loading indicator
const [users, setUsers] = useState([]);
getDocs(collections(db, 'users')).then(setUsers);

// ✅ Good: Show loading state
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  getDocs(collection(db, 'users'))
    .then(setUsers)
    .finally(() => setLoading(false));
}, []);
```

### **3. Forgetting to Unsubscribe**
```javascript
// ❌ Bad: Memory leak
onSnapshot(doc(db, 'users', userId), (doc) => {
  setUser(doc.data());
});

// ✅ Good: Cleanup listener
useEffect(() => {
  const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
    setUser(doc.data());
  });
  return () => unsubscribe();
}, [userId]);
```

## 🎯 **Summary**

Your current SPA handles database access through:

1. **Direct Firebase SDK** - Client connects directly to Firestore
2. **Real-time listeners** - Live updates via onSnapshot
3. **Authentication-based security** - Firestore rules protect data
4. **Component-level queries** - Each component fetches its own data
5. **Global state management** - AppContext shares common data

This is a perfectly valid and scalable approach for SPAs! The Firebase SDK handles caching, offline support, and real-time updates automatically.

## 📚 **Quick Reference**

### **Most Used Firestore Functions**
```javascript
// Import what you need
import { 
  getFirestore, doc, collection,
  getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter,
  onSnapshot, serverTimestamp
} from 'firebase/firestore';

// Basic operations
const docRef = doc(db, 'collection', 'docId');
const colRef = collection(db, 'collection');
const q = query(colRef, where('field', '==', 'value'));
```

Keep this guide handy for when you need to work with database operations in your SPA! 🚀