import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db } from "../config/firebase.js";

/**
 * Centralized Firebase service layer for all Firestore operations
 * This service provides a consistent interface for CRUD operations
 * and reduces code duplication across stores
 */
class FirebaseService {
  // Generic document operations

  /**
   * Get a document by path
   * @param {string} path - Document path (e.g., 'users/123')
   * @returns {Promise<Object|null>} Document data or null if not found
   */
  async getDocument(path) {
    try {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      return null;
    } catch (error) {
      console.error(`Error getting document ${path}:`, error);
      throw error;
    }
  }

  /**
   * Set a document (create or replace)
   * @param {string} path - Document path
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document data
   */
  async setDocument(path, data) {
    try {
      const docRef = doc(db, path);
      const documentData = {
        ...data,
        createdAt: data.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, documentData);

      return { id: docRef.id, ...documentData };
    } catch (error) {
      console.error(`Error setting document ${path}:`, error);
      throw error;
    }
  }

  /**
   * Update a document
   * @param {string} path - Document path
   * @param {Object} updates - Fields to update
   * @returns {Promise<boolean>} Success status
   */
  async updateDocument(path, updates) {
    try {
      const docRef = doc(db, path);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);

      return true;
    } catch (error) {
      console.error(`Error updating document ${path}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {string} path - Document path
   * @returns {Promise<boolean>} Success status
   */
  async deleteDocument(path) {
    try {
      const docRef = doc(db, path);
      await deleteDoc(docRef);

      return true;
    } catch (error) {
      console.error(`Error deleting document ${path}:`, error);
      throw error;
    }
  }

  // Collection operations

  /**
   * Add a document to a collection
   * @param {string} collectionPath - Collection path
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document with ID
   */
  async addToCollection(collectionPath, data) {
    try {
      const colRef = collection(db, collectionPath);
      const documentData = {
        ...data,
        createdAt: data.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(colRef, documentData);

      return { id: docRef.id, ...documentData };
    } catch (error) {
      console.error(`Error adding to collection ${collectionPath}:`, error);
      throw error;
    }
  }

  /**
   * Query a collection with filters
   * @param {string} collectionPath - Collection path
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of documents
   */
  async queryCollection(collectionPath, options = {}) {
    try {
      let q = collection(db, collectionPath);

      // Apply filters
      if (options.where) {
        options.where.forEach(([field, operator, value]) => {
          q = query(q, where(field, operator, value));
        });
      }

      // Apply ordering
      if (options.orderBy) {
        if (Array.isArray(options.orderBy)) {
          // Check if it's a nested array (multiple orderBy clauses) or a single clause
          if (options.orderBy.length > 0 && Array.isArray(options.orderBy[0])) {
            // Nested array: [["field1", "asc"], ["field2", "desc"]]
            options.orderBy.forEach(([field, direction = "asc"]) => {
              q = query(q, orderBy(field, direction));
            });
          } else if (options.orderBy.length === 2 && typeof options.orderBy[0] === "string") {
            // Single orderBy clause: ["field", "direction"]
            const [field, direction = "asc"] = options.orderBy;
            q = query(q, orderBy(field, direction || "asc"));
          } else {
            // Flat array, assume it's [field, direction]
            const field = options.orderBy[0];
            const direction = options.orderBy[1] || "asc";
            q = query(q, orderBy(field, direction));
          }
        } else {
          // Not an array, treat as single field string
          q = query(q, orderBy(options.orderBy, "asc"));
        }
      }

      // Apply limit
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error(`Error querying collection ${collectionPath}:`, error);
      throw error;
    }
  }

  // Real-time listeners

  /**
   * Listen to document changes
   * @param {string} path - Document path
   * @param {Function} callback - Callback function
   * @param {Function} errorCallback - Error callback
   * @returns {Function} Unsubscribe function
   */
  listenToDocument(path, callback, errorCallback) {
    try {
      const docRef = doc(db, path);

      return onSnapshot(
        docRef,
        (doc) => {
          if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error(`Error listening to document ${path}:`, error);
          if (errorCallback) errorCallback(error);
        },
      );
    } catch (error) {
      console.error(`Error setting up listener for ${path}:`, error);
      if (errorCallback) errorCallback(error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Listen to collection changes
   * @param {string} collectionPath - Collection path
   * @param {Function} callback - Callback function
   * @param {Object} options - Query options
   * @param {Function} errorCallback - Error callback
   * @returns {Function} Unsubscribe function
   */
  listenToCollection(collectionPath, callback, options = {}, errorCallback) {
    try {
      let q = collection(db, collectionPath);

      // Apply same query options as queryCollection
      if (options.where) {
        options.where.forEach(([field, operator, value]) => {
          q = query(q, where(field, operator, value));
        });
      }

      if (options.orderBy) {
        if (Array.isArray(options.orderBy)) {
          options.orderBy.forEach(([field, direction = "asc"]) => {
            q = query(q, orderBy(field, direction));
          });
        } else {
          const [field, direction = "asc"] = options.orderBy;
          q = query(q, orderBy(field, direction));
        }
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      return onSnapshot(
        q,
        (querySnapshot) => {
          const documents = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          callback(documents);
        },
        (error) => {
          console.error(
            `Error listening to collection ${collectionPath}:`,
            error,
          );
          if (errorCallback) errorCallback(error);
        },
      );
    } catch (error) {
      console.error(
        `Error setting up collection listener for ${collectionPath}:`,
        error,
      );
      if (errorCallback) errorCallback(error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Batch operations

  /**
   * Perform multiple operations in a batch
   * @param {Array} operations - Array of operations
   * @returns {Promise<boolean>} Success status
   */
  async batchWrite(operations) {
    try {
      const batch = writeBatch(db);

      operations.forEach(({ type, path, data }) => {
        const docRef = doc(db, path);

        switch (type) {
          case "set":
            batch.set(docRef, {
              ...data,
              updatedAt: serverTimestamp(),
            });
            break;
          case "update":
            batch.update(docRef, {
              ...data,
              updatedAt: serverTimestamp(),
            });
            break;
          case "delete":
            batch.delete(docRef);
            break;
          default:
            throw new Error(`Unknown batch operation type: ${type}`);
        }
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error in batch write:", error);
      throw error;
    }
  }

  // Transaction operations

  /**
   * Run a transaction
   * @param {Function} updateFunction - Transaction function
   * @returns {Promise<any>} Transaction result
   */
  async runTransaction(updateFunction) {
    try {
      return await runTransaction(db, updateFunction);
    } catch (error) {
      console.error("Error running transaction:", error);
      throw error;
    }
  }

  // Specialized methods for common operations

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User data
   */
  async getUser(userId) {
    return this.getDocument(`users/${userId}`);
  }

  /**
   * Update user data
   * @param {string} userId - User ID
   * @param {Object} updates - User updates
   * @returns {Promise<boolean>} Success status
   */
  async updateUser(userId, updates) {
    return this.updateDocument(`users/${userId}`, updates);
  }

  /**
   * Get user transactions with pagination
   * @param {string} userId - User ID
   * @param {number} limitCount - Number of transactions to fetch
   * @returns {Promise<Array>} Array of transactions
   */
  async getUserTransactions(userId, limitCount = 50) {
    return this.queryCollection(`users/${userId}/transactions`, {
      orderBy: ["date", "desc"], // Single orderBy clause: [field, direction]
      limit: limitCount,
    });
  }

  /**
   * Add transaction for user
   * @param {string} userId - User ID
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async addUserTransaction(userId, transactionData) {
    return this.addToCollection(
      `users/${userId}/transactions`,
      transactionData,
    );
  }

  /**
   * Get current raffle
   * @returns {Promise<Object|null>} Current raffle data
   */
  async getCurrentRaffle() {
    return this.getDocument("raffles/current");
  }

  /**
   * Update current raffle
   * @param {Object} updates - Raffle updates
   * @returns {Promise<boolean>} Success status
   */
  async updateCurrentRaffle(updates) {
    return this.updateDocument("raffles/current", updates);
  }

  /**
   * Get nonprofits
   * @returns {Promise<Array>} Array of active nonprofits
   */
  async getActiveNonprofits() {
    return this.queryCollection("nonprofits", {
      where: [["active", "==", true]],
      orderBy: ["name", "asc"],
    });
  }

  /**
   * Get pending donations
   * @returns {Promise<Array>} Array of pending donations
   */
  async getPendingDonations() {
    return this.queryCollection("donations", {
      where: [["status", "==", "pending"]],
      orderBy: ["createdAt", "desc"],
    });
  }

  // Utility methods

  /**
   * Check if document exists
   * @param {string} path - Document path
   * @returns {Promise<boolean>} Whether document exists
   */
  async documentExists(path) {
    try {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error(`Error checking document existence ${path}:`, error);
      return false;
    }
  }

  /**
   * Get server timestamp
   * @returns {Object} Firestore server timestamp
   */
  getServerTimestamp() {
    return serverTimestamp();
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;
