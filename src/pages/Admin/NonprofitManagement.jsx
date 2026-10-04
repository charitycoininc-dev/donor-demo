import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../stores";
import { firebaseService } from "../../stores";
import { Plus, Edit, Trash2, Save, X, ArrowLeft } from "lucide-react";

export default function AdminNonprofits() {
  const { user, isAuthenticated, loading } = useAuth();
  const [nonprofits, setNonprofits] = useState([]);
  const [loadingNonprofits, setLoadingNonprofits] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newNonprofit, setNewNonprofit] = useState({
    name: "",
    description: "",
    website: "",
    category: "",
    active: true,
  });
  const [editingNonprofit, setEditingNonprofit] = useState({});

  const categories = [
    "Education",
    "Healthcare",
    "Community Development",
    "Youth Programs",
    "Arts & Culture",
    "Environmental",
    "Social Services",
    "Economic Development",
    "Other",
  ];

  useEffect(() => {
    fetchNonprofits();
  }, []);

  const fetchNonprofits = async () => {
    try {
      setLoadingNonprofits(true);
      const nonprofitList = await firebaseService.queryCollection("nonprofits");
      setNonprofits(nonprofitList);
    } catch (error) {
      console.error("Error fetching nonprofits:", error);
      alert("Error loading nonprofits");
    } finally {
      setLoadingNonprofits(false);
    }
  };

  const handleAddNonprofit = async () => {
    if (!newNonprofit.name.trim()) {
      alert("Please enter a nonprofit name");
      return;
    }

    try {
      await firebaseService.addToCollection("nonprofits", {
        ...newNonprofit,
      });
      setNewNonprofit({
        name: "",
        description: "",
        website: "",
        category: "",
        active: true,
      });
      fetchNonprofits();
    } catch (error) {
      console.error("Error adding nonprofit:", error);
      alert("Error adding nonprofit");
    }
  };

  const handleEditNonprofit = async (id) => {
    if (!editingNonprofit.name?.trim()) {
      alert("Please enter a nonprofit name");
      return;
    }

    try {
      await firebaseService.updateDocument(`nonprofits/${id}`, {
        ...editingNonprofit,
      });
      setEditingId(null);
      setEditingNonprofit({});
      fetchNonprofits();
    } catch (error) {
      console.error("Error updating nonprofit:", error);
      alert("Error updating nonprofit");
    }
  };

  const handleDeleteNonprofit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this nonprofit?")) {
      return;
    }

    try {
      await firebaseService.deleteDocument(`nonprofits/${id}`);
      fetchNonprofits();
    } catch (error) {
      console.error("Error deleting nonprofit:", error);
      alert("Error deleting nonprofit");
    }
  };

  const startEditing = (nonprofit) => {
    setEditingId(nonprofit.id);
    setEditingNonprofit({ ...nonprofit });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingNonprofit({});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-xl font-bold text-deep-red-800 mb-4">
          Please log in to access the admin dashboard.
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-bold text-xl">
        Access denied. Admins only.
      </div>
    );
  }

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
        Manage Nonprofits
      </h1>

      {/* Add New Nonprofit Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-deep-red-800">
          Add New Nonprofit
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={newNonprofit.name}
              onChange={(e) =>
                setNewNonprofit({ ...newNonprofit, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Nonprofit name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={newNonprofit.category}
              onChange={(e) =>
                setNewNonprofit({ ...newNonprofit, category: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={newNonprofit.website}
              onChange={(e) =>
                setNewNonprofit({ ...newNonprofit, website: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="https://example.org"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newNonprofit.description}
              onChange={(e) =>
                setNewNonprofit({
                  ...newNonprofit,
                  description: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows="3"
              placeholder="Brief description of the nonprofit's mission and work"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="new-active"
              checked={newNonprofit.active}
              onChange={(e) =>
                setNewNonprofit({ ...newNonprofit, active: e.target.checked })
              }
              className="h-4 w-4 text-deep-red-600 border-gray-300 rounded focus:ring-deep-red-500"
            />
            <label htmlFor="new-active" className="ml-2 text-sm text-gray-700">
              Active (available for donations)
            </label>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <button
              onClick={handleAddNonprofit}
              className="bg-deep-red-600 hover:bg-deep-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Nonprofit
            </button>
          </div>
        </div>
      </div>

      {/* Nonprofits List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-deep-red-800">
            Nonprofits List
          </h2>
        </div>

        {loadingNonprofits ? (
          <div className="p-8 text-center text-gray-500">
            Loading nonprofits...
          </div>
        ) : nonprofits.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No nonprofits found. Add your first nonprofit above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {nonprofits.map((nonprofit) => (
                  <tr key={nonprofit.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === nonprofit.id ? (
                        <input
                          type="text"
                          value={editingNonprofit.name || ""}
                          onChange={(e) =>
                            setEditingNonprofit({
                              ...editingNonprofit,
                              name: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {nonprofit.name}
                          </div>
                          {nonprofit.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {nonprofit.description}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === nonprofit.id ? (
                        <select
                          value={editingNonprofit.category || ""}
                          onChange={(e) =>
                            setEditingNonprofit({
                              ...editingNonprofit,
                              category: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900">
                          {nonprofit.category || "Uncategorized"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === nonprofit.id ? (
                        <input
                          type="url"
                          value={editingNonprofit.website || ""}
                          onChange={(e) =>
                            setEditingNonprofit({
                              ...editingNonprofit,
                              website: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      ) : nonprofit.website ? (
                        <a
                          href={nonprofit.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Visit Site
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No website
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === nonprofit.id ? (
                        <input
                          type="checkbox"
                          checked={editingNonprofit.active || false}
                          onChange={(e) =>
                            setEditingNonprofit({
                              ...editingNonprofit,
                              active: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-deep-red-600 border-gray-300 rounded focus:ring-deep-red-500"
                        />
                      ) : (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            nonprofit.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {nonprofit.active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === nonprofit.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditNonprofit(nonprofit.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(nonprofit)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNonprofit(nonprofit.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
