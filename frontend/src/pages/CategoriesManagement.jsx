import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Tag, Search } from 'lucide-react';

export default function CategoriesManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState([]);
  const [myCustomCategories, setMyCustomCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    category_name: '',
    keywords: '',
    merchants: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // Load all categories (system + custom)
      const allRes = await api.get('/categories/rules');
      setAllCategories(allRes.data);
      
      // Load only custom categories
      const customRes = await api.get('/categories/custom/my-categories');
      setMyCustomCategories(customRes.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      alert('Failed to load categories: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      category_name: '',
      keywords: '',
      merchants: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      keywords: category.keywords ? category.keywords.join(', ') : '',
      merchants: category.merchants ? category.merchants.join(', ') : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        category_name: formData.category_name.trim(),
        keywords: formData.keywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0),
        merchants: formData.merchants
          .split(',')
          .map(m => m.trim())
          .filter(m => m.length > 0)
      };

      if (editingCategory) {
        // Update existing
        await api.put(`/categories/custom/${editingCategory.id}`, payload);
        alert('Category updated successfully!');
      } else {
        // Create new
        await api.post('/categories/custom', payload);
        alert('Category created successfully!');
      }

      setShowModal(false);
      loadCategories();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Operation failed';
      alert(`Error: ${errorMsg}`);
      console.error('Category operation error:', err.response?.data);
    }
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/categories/custom/${categoryId}`);
      alert('Category deleted successfully!');
      loadCategories();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Delete failed';
      alert(`Error: ${errorMsg}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading categories...</div>
      </div>
    );
  }

  // Filter categories by search
  const filteredSystemCategories = allCategories.filter(
    cat => cat.is_default && cat.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomCategories = myCustomCategories.filter(
    cat => cat.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Categories Management</h1>
            <p className="text-gray-600 mt-1">Manage transaction categories and auto-categorization rules</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus size={20} />
            Create Custom Category
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Default Categories */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="text-gray-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">System Categories</h2>
            <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              {filteredSystemCategories.length}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Built-in categories used for auto-categorization</p>

          {filteredSystemCategories.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No matching system categories</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredSystemCategories.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{category.category_name}</h3>
                    <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">
                      System Default
                    </span>
                  </div>

                  {category.keywords && category.keywords.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {category.merchants && category.merchants.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Merchants:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.merchants.map((merchant, idx) => (
                          <span
                            key={idx}
                            className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs"
                          >
                            {merchant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Categories */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">My Custom Categories</h2>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              {filteredCustomCategories.length}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Your personalized categories with custom rules</p>

          {myCustomCategories.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
              <Tag className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-600 mb-2">No custom categories yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Create custom categories to better organize your transactions
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Category
              </button>
            </div>
          ) : filteredCustomCategories.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No matching custom categories</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredCustomCategories.map((category) => (
                <div
                  key={category.id}
                  className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{category.category_name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditModal(category)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.category_name)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {category.keywords && category.keywords.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {category.merchants && category.merchants.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Merchants:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.merchants.map((merchant, idx) => (
                          <span
                            key={idx}
                            className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs"
                          >
                            {merchant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingCategory ? 'Edit Custom Category' : 'Create Custom Category'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Coffee & Tea"
                  required
                  minLength="2"
                  maxLength="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., coffee, tea, latte, cappuccino"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Transactions with these keywords in description will be auto-categorized
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchants (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.merchants}
                  onChange={(e) => setFormData({ ...formData, merchants: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Starbucks, Cafe Coffee Day, Blue Tokai"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Transactions from these merchants will be auto-categorized
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? (
                    <>
                      <Save size={18} className="inline mr-2" />
                      Update Category
                    </>
                  ) : (
                    <>
                      <Plus size={18} className="inline mr-2" />
                      Create Category
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
