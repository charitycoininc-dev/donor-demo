import useAuthStore from "../authStore";

// Custom hook for auth management with common patterns
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    firebaseAvailable,
    setUser,
    setLoading,
    setError,
    updateUser,
    initializeAuth,
    signIn,
    signInWithEmailAndPassword,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    deleteAccount,
    getUserStats,
    getMembershipInfo,
    cleanup,
  } = useAuthStore();

  // Helper to check if user has required fields
  const isProfileComplete = () => {
    if (!user) return false;

    const requiredFields = ["firstName", "lastName", "email", "phone"];
    return requiredFields.every((field) => user[field]);
  };

  // Helper to get user display name
  const getUserDisplayName = () => {
    if (!user) return "Guest";

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }

    if (user.firstName) {
      return user.firstName;
    }

    if (user.email) {
      return user.email.split("@")[0];
    }

    return "User";
  };

  // Helper to check if user needs to verify email
  const needsEmailVerification = () => {
    // This would depend on your Firebase setup
    // For now, return false as email verification isn't implemented
    return false;
  };

  // Helper for sign in with error handling
  const handleSignIn = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(email, password);
      return { success: true, user: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Helper for sign up with error handling
  const handleSignUp = async (email, password, userData = {}) => {
    try {
      setError(null);
      const result = await signUp(email, password, userData);
      return { success: true, user: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Helper for password reset with error handling
  const handlePasswordReset = async (email) => {
    try {
      setError(null);
      await resetPassword(email);
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Helper for profile update with error handling
  const handleProfileUpdate = async (profileData) => {
    try {
      setError(null);
      await updateUserProfile(profileData);
      return { success: true, message: "Profile updated successfully" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Helper for account deletion with error handling
  const handleAccountDeletion = async (password) => {
    try {
      setError(null);
      await deleteAccount(password);
      return { success: true, message: "Account deleted successfully" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Helper to get user role/permissions
  const getUserRole = () => {
    if (!user) return "guest";

    // Check for admin role (you might have this in user data)
    if (user.role === "admin" || user.isAdmin) {
      return "admin";
    }

    return "user";
  };

  // Helper to check permissions
  const hasPermission = (permission) => {
    const role = getUserRole();

    const permissions = {
      guest: [],
      user: ["donate", "view_wallet", "enter_raffle"],
      admin: [
        "donate",
        "view_wallet",
        "enter_raffle",
        "manage_users",
        "manage_raffles",
        "approve_donations",
      ],
    };

    return permissions[role]?.includes(permission) || false;
  };

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    firebaseAvailable,

    // Core auth actions
    signIn: signIn, // Use the store's signIn directly (it throws errors, which Login expects)
    signUp: handleSignUp,
    signOut,
    resetPassword: handlePasswordReset,
    updateUserProfile: handleProfileUpdate,
    deleteAccount: handleAccountDeletion,

    // User data actions
    updateUser,
    getUserStats,
    getMembershipInfo,

    // Helper functions
    isProfileComplete,
    getUserDisplayName,
    needsEmailVerification,
    getUserRole,
    hasPermission,

    // State setters (for advanced use)
    setUser,
    setLoading,
    setError,

    // Direct auth actions (for advanced use)
    directSignIn: signIn, // Direct access to original signIn
    directSignUp: signUp, // Direct access to original signUp

    // Cleanup
    cleanup,
  };
};

export default useAuth;
