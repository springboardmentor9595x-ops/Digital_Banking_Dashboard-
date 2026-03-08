import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { Pencil } from "lucide-react";
import { UploadCloud, PlusCircle } from "lucide-react";
import { toast } from "react-toastify";


/* -------- CATEGORY COLOR THEME (NEON PASTEL) -------- */

const categoryStyles = {
  Food: "bg-gradient-to-r from-[#ffafcc] to-[#ffc8dd] text-black shadow-md",
  Travel: "bg-gradient-to-r from-[#a2d2ff] to-[#bde0fe] text-black shadow-md",
  Shopping: "bg-gradient-to-r from-[#ffc8dd] to-[#ffafcc] text-black shadow-md",
  Bills: "bg-gradient-to-r from-[#cdb4db] to-[#ffafcc] text-black shadow-md",
  Entertainment: "bg-gradient-to-r from-[#bde0fe] to-[#cdb4db] text-black shadow-md",
  Others: "bg-gradient-to-r from-[#e5e7eb] to-[#d1d5db] text-black shadow-md"
};

/* -------- MAIN COMPONENT -------- */

export default function TransactionsPage() {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token");

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([
  { id: 1, category_name: "Food" },
  { id: 2, category_name: "Travel" },
  { id: 3, category_name: "Bills" },
  { id: 4, category_name: "Shopping" },
  { id: 5, category_name: "Entertainment" }
]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingTx, setEditingTx] = useState(null); // for modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);



  
const [newTx, setNewTx] = useState({
  account_id: "",
  type: "expense",
  amount: "",
  description: "",
  date: ""
});



  /* -------- FETCH ALL DATA -------- */

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [txRes, accRes, catRes] = await Promise.all([
        fetch(`${API_URL}/transactions/`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/accounts/`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/categories/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const txData = await txRes.json();
      const accData = await accRes.json();
      const catData = await catRes.json();

      setTransactions(Array.isArray(txData) ? txData : []);
      setAccounts(Array.isArray(accData) ? accData : []);
      setCategories(Array.isArray(catData) ? catData : []);

      setError("");
    } catch (err) {
      setError("Failed to load transactions or categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* -------- INLINE CATEGORY UPDATE -------- */

  const updateCategoryQuick = async (txId, newCategory) => {
    try {
      await fetch(
        `${API_URL}/transactions/${txId}/category?category=${newCategory}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchAll();
    } catch (err) {
      toast.error("Failed to update category");

    }
  };

  /* -------- MODAL OPEN -------- */

  const openEditModal = tx => {
    setEditingTx(tx);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingTx(null);
    setShowEditModal(false);
  };
    if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading transactions...</div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">{error}</div>;
  }

  const handleCSVUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const accountId = accounts[0]?.id; // take first account for now
  if (!accountId) {
    toast.error("No account found");

    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/transactions/upload_csv/${accountId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    toast.success(`CSV Imported: ${data.rows_added} transactions added`);

    fetchAll();
  } catch (err) {
    toast.error("CSV upload failed");

  }
};

const saveNewTransaction = async () => {
  try {
    const payload = {
      account_id: Number(newTx.account_id),
      type: newTx.type,
      amount: Number(newTx.amount),
      description: newTx.description,
      date: newTx.date
    };

    await fetch(`${API_URL}/transactions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    toast.success("Transaction added successfully");

    setShowAddTransaction(false);
    setNewTx({ account_id: "", type: "expense", amount: "", description: "", date: "" });
   
    fetchAll();
  } catch (err) {
   toast.error("Failed to add transaction");
  }
};


  return (
    <div className="p-6 space-y-6">

     <div className="flex justify-between items-center">
  <h2 className="text-3xl font-bold">Transactions</h2>

  <div className="flex gap-4">

    {/* ADD TRANSACTION BUTTON */}
    <button
      onClick={() => setShowAddTransaction(true)}
      className="flex items-center gap-2 px-5 py-3 rounded-2xl
                 bg-gradient-to-br from-[#ffafcc] to-[#ffc8dd]
                 shadow-[0_10px_30px_rgba(255,175,204,0.45)]
                 border border-pink-200/60
                 transition-all duration-300
                 hover:scale-105 hover:shadow-[0_15px_40px_rgba(255,175,204,0.7)]"
    >
      <PlusCircle size={20} className="text-[#9d174d]" />
      <span className="font-semibold text-[#9d174d] tracking-wide">
        Add Transaction
      </span>
    </button>

    {/* IMPORT CSV BUTTON */}
    <label className="relative cursor-pointer group">
      <div
        className="flex items-center gap-2 px-5 py-3 rounded-2xl
                   bg-gradient-to-br from-[#bde0fe] to-[#a2d2ff]
                   shadow-[0_10px_30px_rgba(162,210,255,0.45)]
                   border border-blue-200/60
                   transition-all duration-300
                   group-hover:scale-105
                   group-hover:shadow-[0_15px_40px_rgba(162,210,255,0.7)]"
      >
        <UploadCloud size={20} className="text-[#1e40af]" />
        <span className="font-semibold text-[#1e3a8a] tracking-wide">
          Import CSV
        </span>
      </div>

      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCSVUpload}
      />
    </label>

  </div>
</div>




      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#ffc8dd]">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Category</th>
              {/* <th className="p-3 text-left">Quick Edit</th> */}
              <th className="p-3 text-left">Account</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-center">Edit</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id} className="border-b hover:bg-gray-50 transition">

                <td className="p-3">{String(tx.date).slice(0, 10)}</td>

                <td className="p-3">{tx.description || "—"}</td>

                {/* CATEGORY PILL */}
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      categoryStyles[tx.category] || categoryStyles["Others"]
                    }`}
                  >
                    {tx.category || "Others"}
                  </span>
                </td>

                {/* QUICK EDIT DROPDOWN
                <td className="p-3">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={tx.category || "Others"}
                    onChange={e =>
                      updateCategoryQuick(tx.id, e.target.value)
                    }
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.category_name}>
                        {cat.category_name}
                      </option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                </td> */}

                {/* ACCOUNT NAME */}
                <td className="p-3">
                  {accounts.find(a => a.id === tx.account_id)?.bank_name || "—"}
                </td>

                {/* TYPE */}
                <td
                  className={`p-3 font-semibold ${
                    tx.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type}
                </td>

                {/* AMOUNT */}
                <td
                  className={`p-3 font-bold ${
                    tx.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ₹ {tx.amount}
                </td>

                {/* MODAL EDIT ICON */}
                <td className="p-3 text-center">
                  <button
                    onClick={() => openEditModal(tx)}
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                  >
                    <Pencil size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
           {/* EDIT CATEGORY MODAL */}
      {showEditModal && editingTx && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[420px] rounded-xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Edit Transaction Category</h3>

            <div className="space-y-3">
              <p><strong>Description:</strong> {editingTx.description || "—"}</p>
              <p><strong>Amount:</strong> ₹ {editingTx.amount}</p>
              <p><strong>Type:</strong> {editingTx.type}</p>

              <div>
                <label className="text-sm font-medium">Select Category</label>
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={editingTx.category || "Others"}
                  onChange={e =>
                    setEditingTx({
                      ...editingTx,
                      category: e.target.value
                    })
                  }
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </option>
                  ))}
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await updateCategoryQuick(
                    editingTx.id,
                    editingTx.category
                  );
                  closeEditModal();
                }}
                className="px-4 py-2 rounded bg-[#cdb4db] hover:bg-[#ffc8dd] font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddTransaction && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[420px] rounded-xl p-6 shadow-xl">
      <h3 className="text-xl font-semibold mb-4">Add Transaction</h3>

      <select
        className="w-full border rounded px-3 py-2 mb-2"
        value={newTx.account_id}
        onChange={e => setNewTx({ ...newTx, account_id: e.target.value })}
      >
        <option value="">Select Account</option>
        {accounts.map(acc => (
          <option key={acc.id} value={acc.id}>{acc.bank_name}</option>
        ))}
      </select>

      <select
        className="w-full border rounded px-3 py-2 mb-2"
        value={newTx.type}
        onChange={e => setNewTx({ ...newTx, type: e.target.value })}
      >
        <option value="expense">Expense</option>

        <option value="income">Income</option>
      </select>

      <input
        type="number"
        placeholder="Amount"
        className="w-full border rounded px-3 py-2 mb-2"
        value={newTx.amount}
        onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
      />

      <input
        placeholder="Description"
        className="w-full border rounded px-3 py-2 mb-2"
        value={newTx.description}
        onChange={e => setNewTx({ ...newTx, description: e.target.value })}
      />

      <input
        type="date"
        className="w-full border rounded px-3 py-2 mb-4"
        value={newTx.date}
        onChange={e => setNewTx({ ...newTx, date: e.target.value })}
      />

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowAddTransaction(false)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Cancel
        </button>

        <button
          onClick={saveNewTransaction}
          className="px-4 py-2 bg-[#ffafcc] rounded font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}