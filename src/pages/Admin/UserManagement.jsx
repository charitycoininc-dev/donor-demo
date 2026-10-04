import { useEffect, useState } from "react";
import { Pencil, Trash2, ArrowLeft, Eye, EyeOff, Copy, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { firebaseService } from "../../stores";

const PROFILE_FIELDS = [
  { key: "email", label: "Email" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "phone", label: "Phone" },
  { key: "street1", label: "Street 1" },
  { key: "street2", label: "Street 2" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip" },
  { key: "solanaWallet", label: "Solana Wallet" },
  { key: "membershipTier", label: "Membership Tier" },
  { key: "charityCoins", label: "Charity Coins" },
  { key: "totalDonated", label: "Total Donated" },
  { key: "joinDate", label: "Join Date" },
  { key: "role", label: "Role" },
];

const USERS_PER_PAGE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [sortField, setSortField] = useState("email");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [decryptedKeys, setDecryptedKeys] = useState({}); // Store decrypted keys temporarily
  const [decrypting, setDecrypting] = useState({}); // Track which keys are being decrypted
  const [showPrivateKey, setShowPrivateKey] = useState({}); // Track visibility of decrypted keys

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = await firebaseService.queryCollection("users");
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Search filter
  const filteredUsers = users.filter((user) => {
    const q = search.toLowerCase();
    return (
      user.email?.toLowerCase().includes(q) ||
      user.firstName?.toLowerCase().includes(q) ||
      user.lastName?.toLowerCase().includes(q) ||
      user.solanaWallet?.toLowerCase().includes(q)
    );
  });

  // Sort
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortAsc ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortAsc ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / USERS_PER_PAGE);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE,
  );

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditData(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setEditData({});
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await firebaseService.updateDocument(
        `users/${selectedUser.id}`,
        editData,
      );
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, ...editData } : u,
        ),
      );
      closeModal();
    } catch (err) {
      alert("Error updating user: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setDeleteLoading(true);
    try {
      await firebaseService.deleteDocument(`users/${selectedUser.id}`);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      closeModal();
    } catch (err) {
      alert("Error deleting user: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDecryptPrivateKey = async (userId, encryptedKey) => {
    if (!encryptedKey) {
      alert("No encrypted private key found for this user.");
      return;
    }

    setDecrypting((prev) => ({ ...prev, [userId]: true }));
    
    try {
      const response = await fetch('/api/decrypt-wallet-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedPrivateKey: encryptedKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Store the decrypted key (temporarily, for display only)
      setDecryptedKeys((prev) => ({
        ...prev,
        [userId]: data.privateKey,
      }));
      
      // Show the key initially
      setShowPrivateKey((prev) => ({
        ...prev,
        [userId]: true,
      }));
    } catch (error) {
      console.error('Error decrypting private key:', error);
      alert(`Failed to decrypt private key: ${error.message}`);
    } finally {
      setDecrypting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  const togglePrivateKeyVisibility = (userId) => {
    setShowPrivateKey((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Pagination controls
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center text-deep-red-600 hover:text-deep-red-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-8 text-deep-red-800">
        User Management
      </h1>
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by email, first name, last name, or wallet..."
          className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-80"
        />
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort("email")}
              >
                Email {sortField === "email" && (sortAsc ? "▲" : "▼")}
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort("firstName")}
              >
                First Name {sortField === "firstName" && (sortAsc ? "▲" : "▼")}
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort("lastName")}
              >
                Last Name {sortField === "lastName" && (sortAsc ? "▲" : "▼")}
              </th>
              <th
                className="px-4 py-2 cursor-pointer min-w-[300px]"
                onClick={() => handleSort("solanaWallet")}
              >
                Solana Wallet{" "}
                {sortField === "solanaWallet" && (sortAsc ? "▲" : "▼")}
              </th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.firstName}</td>
                <td className="px-4 py-2">{user.lastName}</td>
                <td className="px-4 py-2 min-w-[300px]">
                  <div className="space-y-1">
                    {user.solanaWallet || user.solanaWalletAddress ? (
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">
                            {user.solanaWallet || user.solanaWalletAddress}
                          </span>
                          {user.walletType === 'custodial' && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Custodial
                            </span>
                          )}
                        </div>
                        {user.solanaWalletPrivateKey && (
                          <div className="mt-2 space-y-1">
                            {decryptedKeys[user.id] ? (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-yellow-800">
                                    Decrypted Private Key:
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => togglePrivateKeyVisibility(user.id)}
                                      className="p-1 hover:bg-yellow-100 rounded"
                                      title={showPrivateKey[user.id] ? "Hide" : "Show"}
                                    >
                                      {showPrivateKey[user.id] ? (
                                        <EyeOff className="h-3 w-3 text-yellow-700" />
                                      ) : (
                                        <Eye className="h-3 w-3 text-yellow-700" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleCopyToClipboard(decryptedKeys[user.id])}
                                      className="p-1 hover:bg-yellow-100 rounded"
                                      title="Copy to clipboard"
                                    >
                                      <Copy className="h-3 w-3 text-yellow-700" />
                                    </button>
                                  </div>
                                </div>
                                <div className="font-mono text-xs break-all">
                                  {showPrivateKey[user.id] ? (
                                    <span className="text-yellow-900">{decryptedKeys[user.id]}</span>
                                  ) : (
                                    <span className="text-yellow-600">••••••••••••••••</span>
                                  )}
                                </div>
                                <p className="text-xs text-yellow-700 mt-1">
                                  ⚠️ Keep this key secure. Anyone with this key has full wallet access.
                                </p>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleDecryptPrivateKey(user.id, user.solanaWalletPrivateKey)}
                                disabled={decrypting[user.id]}
                                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                title="Decrypt private key (admin only)"
                              >
                                <Wallet className="h-3 w-3" />
                                {decrypting[user.id] ? 'Decrypting...' : 'Decrypt Private Key'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No wallet</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-row gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded"
                      title="Edit"
                    >
                      <Pencil className="h-5 w-5 text-blue-700" />
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 bg-red-100 hover:bg-red-200 rounded"
                      title="Delete"
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-5 w-5 text-red-700" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-deep-red-800">
              Edit User Profile
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROFILE_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {field.key === "role" ? (
                      <select
                        name="role"
                        value={editData.role || "donor"}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="admin">Admin</option>
                        <option value="donor">Donor</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        name={field.key}
                        value={editData[field.key] || ""}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
