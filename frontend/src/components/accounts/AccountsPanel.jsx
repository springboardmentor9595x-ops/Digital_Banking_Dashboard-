import { useEffect, useState } from "react";
import { API_URL } from "../../api";

export default function AccountsPanel() {
  const [accounts, setAccounts] = useState([]);
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_URL}/accounts/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setAccounts(data));
  }, []);

  return (
    <div className="bg-[#cdb4db]/30 rounded-3xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-[#5a2d82] mb-6">My Bank Accounts</h2>

      {accounts.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No accounts yet. Add your first account 💳
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="bg-gradient-to-br from-[#ffc8dd] to-[#bde0fe] p-5 rounded-2xl shadow-md hover:scale-105 transition"
            >
              <p className="text-sm text-gray-600">{acc.bank_name}</p>
              <p className="font-semibold capitalize">{acc.account_type}</p>

              <div className="mt-4 text-2xl font-bold text-[#4a148c]">
                {acc.balance} {acc.currency}
              </div>

              <div className="text-xs text-gray-600 mt-1">
                {acc.masked_account}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
