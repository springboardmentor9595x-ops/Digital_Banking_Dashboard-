import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

export default function CategoryRulesPage() {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({ category_name: "", keywords: "" });

  const fetchRules = async () => {
    const res = await fetch(`${API_URL}/categories/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setRules(data);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const addRule = async () => {
  try {
    await fetch(`${API_URL}/categories/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    toast.success("Category rule added successfully");
    setForm({ category_name: "", keywords: "" });
    fetchRules();
  } catch (err) {
    toast.error("Failed to add category rule");
  }
};


  const deleteRule = async (id) => {
  try {
    await fetch(`${API_URL}/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    toast.success("Category rule deleted successfully");
    fetchRules();
  } catch (err) {
    toast.error("Failed to delete category rule");
  }
};


  return (
    <div className="p-8 space-y-8">

      <h2 className="text-3xl font-bold text-[#1e3a8a]">Category Rules</h2>

      {/* ADD RULE CARD */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-100">
        <h3 className="text-lg font-semibold mb-4 text-[#2563eb]">Add New Rule</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Category (e.g. Food)"
            className="border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={form.category_name}
            onChange={e => setForm({ ...form, category_name: e.target.value })}
          />

          <input
            placeholder="Keywords (e.g. swiggy,zomato,dominos)"
            className="border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={form.keywords}
            onChange={e => setForm({ ...form, keywords: e.target.value })}
          />
        </div>

        <button
          onClick={addRule}
          className="mt-4 flex items-center gap-2 px-5 py-2 rounded-xl
                     bg-gradient-to-br from-[#bde0fe] to-[#a2d2ff]
                     shadow-md hover:scale-105 transition"
        >
          <PlusCircle size={18} className="text-[#1e40af]" />
          <span className="font-semibold text-[#1e40af]">Add Rule</span>
        </button>
      </div>

      {/* RULES TABLE */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#ffc8dd]">
            <tr>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Keywords</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-4 font-semibold text-[#1e3a8a]">{r.category_name}</td>
                <td className="p-4 text-gray-700">{r.keywords}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => deleteRule(r.id)}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg
                               bg-red-100 text-red-600 hover:bg-red-200 transition"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {rules.length === 0 && (
              <tr>
                <td colSpan="3" className="p-6 text-center text-gray-400">
                  No category rules defined yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
