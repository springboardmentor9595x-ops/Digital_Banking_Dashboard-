import { useEffect, useState } from "react";
import { API_URL } from "../api";

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  useEffect(() => {
  if (!token) {
    window.location.href = "/login";
    return;
  }

  fetch(`${API_URL}/accounts/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(data => {
      console.log("ACCOUNTS:", data);
      setAccounts(data);
    });

  fetch(`${API_URL}/transactions/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(data => {
      console.log("TRANSACTIONS:", data);
      setTransactions(data);
    });

}, [token]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* ACCOUNTS SECTION */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Accounts</h2>
        <div className="grid grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="p-4 bg-white rounded-xl shadow"
            >
              <p className="font-medium">{acc.bank_name}</p>
              <p className="text-sm text-gray-500">
                {acc.account_type}
              </p>
              <p className="text-lg font-bold">
                {acc.balance} {acc.currency}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TRANSACTIONS SECTION */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Recent Transactions
        </h2>

        <table className="w-full border rounded-xl overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 5).map(t => (
              <tr key={t.id} className="border-b">
                <td className="p-2">
                  {String(t.date).slice(0, 10)}
                </td>
                <td className="p-2">
                  {t.description || t.category || "—"}
                </td>
                <td className="p-2">{t.amount}</td>
                <td className="p-2 capitalize">{t.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
