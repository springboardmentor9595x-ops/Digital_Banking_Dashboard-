import { useEffect, useState } from "react";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const token = localStorage.getItem("token");

  // Load accounts on page load
  async function fetchAccounts() {
    const res = await fetch("http://127.0.0.1:8000/accounts/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setAccounts(data);
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Update account balance (example)
  async function updateAccount(id) {
    const newAmount = prompt("Enter new balance:");

    if (!newAmount) return;

    await fetch(`http://127.0.0.1:8000/accounts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ balance: Number(newAmount) }),
    });

    alert("Updated account");
    fetchAccounts();
  }

  // Delete account
  async function deleteAccount(id) {
    if (!window.confirm("Delete this account?")) return;

    await fetch(`http://127.0.0.1:8000/accounts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    alert("Deleted");
    fetchAccounts();
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">My Accounts</h2>

      {accounts.length === 0 && (
        <p className="text-gray-500">No accounts found. Add one first.</p>
      )}

      {accounts.map((acc) => (
        <div
          key={acc.id}
          className="bg-white p-4 shadow rounded mb-3 flex justify-between"
        >
          <div>
            <p className="font-semibold">{acc.bank_name}</p>
            <p>{acc.account_type}</p>
            <p>{acc.masked_account}</p>
            <p className="font-bold mt-1">₹ {acc.balance}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => updateAccount(acc.id)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Update
            </button>

            <button
              onClick={() => deleteAccount(acc.id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
