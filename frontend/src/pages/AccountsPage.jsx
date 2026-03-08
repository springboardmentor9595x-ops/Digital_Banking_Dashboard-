import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";


export default function AccountsPage() {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  const [accounts, setAccounts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const [newAccount, setNewAccount] = useState({
    bank_name: "",
    account_type: "savings",
    masked_account: "****1234",
    currency: "INR",
    balance: ""
  });

  useEffect(() => {
    fetch(`${API_URL}/accounts/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setAccounts(data));
  }, [token]);

  const handleAddAccount = async () => {
    const payload = { ...newAccount, balance: Number(newAccount.balance) };

    const res = await fetch(`${API_URL}/accounts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Invalid account details");
      return;
    }
    toast.success("Account added successfully");

    const refreshed = await fetch(`${API_URL}/accounts/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setAccounts(await refreshed.json());
    setShowAdd(false);
  };
 

  const handleDeleteAccount = async (id) => {
  if (!window.confirm("Are you sure you want to delete this account?")) return;

  const res = await fetch(`${API_URL}/accounts/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
  const data = await res.json();
  toast.error(data.detail);
  return;
}


  toast.success("Account deleted successfully");

  setAccounts(prev => prev.filter(acc => acc.id !== id));
};


  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Accounts</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#ffafcc] px-4 py-2 rounded-lg"
        >
          + Add Account
        </button>
      </div>

      {/* ACCOUNTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div
  key={acc.id}
  className="relative rounded-2xl p-5 text-white shadow-lg"
  style={{ background: "linear-gradient(135deg, #bde0fe, #a2d2ff)" }}
>

  {/* DELETE BUCKET ICON */}
  <button
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteAccount(acc.id);
  }}
  className="absolute top-3 right-3 z-10 bg-white/30 backdrop-blur-md hover:bg-red-500 p-2 rounded-full transition duration-200"
>
  <Trash2 size={18} className="text-white" />
</button>


  <div className="text-sm opacity-80">
    {acc.account_type.toUpperCase()}
  </div>

  <div className="text-xl font-semibold">
    {acc.bank_name}
  </div>

  <div className="tracking-widest mt-2">
    {acc.masked_account}
  </div>

  <div className="mt-4 text-2xl font-bold">
    ₹ {acc.balance}
  </div>

</div>

        ))}
      </div>

      {/* ADD ACCOUNT MODAL */}
      {showAdd && (
        <Modal title="Add Account" onClose={() => setShowAdd(false)}>
          <Input label="Bank Name" onChange={v => setNewAccount({ ...newAccount, bank_name: v })} />

          <Select
            label="Account Type"
            options={["savings", "checking", "credit_card", "loan", "investment"]}
            onChange={v => setNewAccount({ ...newAccount, account_type: v })}
          />

          <Input
            label="Masked Account"
            placeholder="****1234"
            onChange={v => setNewAccount({ ...newAccount, masked_account: v })}
          />

          <Input
            label="Currency"
            defaultValue="INR"
            onChange={v => setNewAccount({ ...newAccount, currency: v })}
          />

          <Input
            label="Balance"
            type="number"
            onChange={v => setNewAccount({ ...newAccount, balance: v })}
          />

          <ModalActions
            onCancel={() => setShowAdd(false)}
            onSave={handleAddAccount}
          />
        </Modal>
      )}

    </div>
  );
}

/* ---------- UI Helpers ---------- */

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Input({ label, type = "text", placeholder = "", defaultValue = "", onChange }) {
  return (
    <div className="mb-2">
      <label className="text-sm">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full border p-2 rounded"
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({ label, options, onChange }) {
  return (
    <div className="mb-2">
      <label className="text-sm">{label}</label>
      <select className="w-full border p-2 rounded" onChange={e => onChange(e.target.value)}>
        <option value="">Select</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function ModalActions({ onCancel, onSave }) {
  return (
    <div className="flex justify-end gap-3 mt-3">
      <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">
        Cancel
      </button>
      <button onClick={onSave} className="px-4 py-2 bg-[#cdb4db] rounded">
        Save
      </button>
    </div>
  );
}
