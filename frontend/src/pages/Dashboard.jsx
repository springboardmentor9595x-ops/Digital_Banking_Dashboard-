// // import { useEffect, useState } from "react";
// // import { API_URL } from "../api";
// // import AccountsPanel from "../components/accounts/AccountsPanel";

// // export default function Dashboard() {
// //   const [accounts, setAccounts] = useState([]);
// //   const [transactions, setTransactions] = useState([]);

// //   const token =
// //     localStorage.getItem("access_token") ||
// //     localStorage.getItem("token");

// //   useEffect(() => {
// //   if (!token) {
// //     window.location.href = "/login";
// //     return;
// //   }

// //   fetch(`${API_URL}/accounts/`, {
// //     headers: { Authorization: `Bearer ${token}` },
// //   })
// //     .then(res => res.json())
// //     .then(data => {
// //       console.log("ACCOUNTS:", data);
// //       setAccounts(data);
// //     });

// //   fetch(`${API_URL}/transactions/`, {
// //     headers: { Authorization: `Bearer ${token}` },
// //   })
// //     .then(res => res.json())
// //     .then(data => {
// //       console.log("TRANSACTIONS:", data);
// //       setTransactions(data);
// //     });

// // }, [token]);

// //   return (
// //     <div className="p-8 max-w-6xl mx-auto space-y-10">
// //       <h1 className="text-3xl font-bold">Dashboard</h1>

// //       <section>
// //   <h2 className="text-2xl font-bold mb-6 text-[#5a4a6e]">
// //     My Accounts
// //   </h2>

// //   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //     {accounts.map(acc => (
// //       <div
// //         key={acc.id}
// //         className="rounded-2xl p-5 shadow-lg bg-[#ffc8dd] relative overflow-hidden"
// //       >
// //         <div className="absolute top-3 right-3 text-4xl">🏦</div>

// //         <p className="text-sm text-[#6d597a]">
// //           {acc.account_type}
// //         </p>

// //         <p className="text-xl font-semibold text-[#4a4a4a]">
// //           {acc.bank_name}
// //         </p>

// //         <p className="mt-4 text-2xl font-bold text-[#5a189a]">
// //           {acc.balance} {acc.currency}
// //         </p>
// //       </div>
// //     ))}

// //     {/* Add Account Card */}
// //     <div className="rounded-2xl p-5 shadow-lg bg-[#bde0fe] flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition">
// //       <div className="text-4xl mb-2">➕</div>
// //       <p className="font-semibold text-[#3a5a8c]">
// //         Add New Account
// //       </p>
// //     </div>
// //   </div>
// // </section>


// //       {/* TRANSACTIONS SECTION */}
// //       <section>
// //         <h2 className="text-xl font-semibold mb-4">
// //           Recent Transactions
// //         </h2>

// //         <table className="w-full border rounded-xl overflow-hidden">
// //           <thead className="bg-gray-100">
// //             <tr>
// //               <th className="p-2 text-left">Date</th>
// //               <th className="p-2 text-left">Description</th>
// //               <th className="p-2 text-left">Amount</th>
// //               <th className="p-2 text-left">Type</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {transactions.slice(0, 5).map(t => (
// //               <tr key={t.id} className="border-b">
// //                 <td className="p-2">
// //                   {String(t.date).slice(0, 10)}
// //                 </td>
// //                 <td className="p-2">
// //                   {t.description || t.category || "—"}
// //                 </td>
// //                 <td className="p-2">{t.amount}</td>
// //                 <td className="p-2 capitalize">{t.type}</td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </section>
// //     </div>
// //   );
// // }

// import { useEffect, useState } from "react";
// import { API_URL } from "../api";

// export default function Dashboard() {
//   const [accounts, setAccounts] = useState([]);
//   const [transactions, setTransactions] = useState([]);
//   const [showAddAccount, setShowAddAccount] = useState(false);
//   const [showAddTransaction, setShowAddTransaction] = useState(false);

//   const [newAccount, setNewAccount] = useState({
//     bank_name: "",
//     account_type: "savings",
//     masked_account: "****1234",
//     currency: "INR",
//     balance: ""
//   });

//   const [newTransaction, setNewTransaction] = useState({
//     account_id: "",
//     type: "income",
//     amount: "",
//     category: "Manual",
//     description: "",
//     date: ""
//   });

//   const token = localStorage.getItem("access_token") || localStorage.getItem("token");

//   useEffect(() => {
//     if (!token) {
//       window.location.href = "/login";
//       return;
//     }

//     fetch(`${API_URL}/accounts/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     }).then(r => r.json()).then(setAccounts);

//     fetch(`${API_URL}/transactions/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     }).then(r => r.json()).then(setTransactions);
//   }, [token]);

//   const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
//   const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
//   const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

//   const handleAddAccount = async () => {
//     const payload = { ...newAccount, balance: Number(newAccount.balance) };

//     const res = await fetch(`${API_URL}/accounts/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//       alert("Invalid account details");
//       return;
//     }

//     const accRes = await fetch(`${API_URL}/accounts/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setAccounts(await accRes.json());
//     setShowAddAccount(false);
//   };

//   const handleAddTransaction = async () => {
//     const payload = {
//       account_id: Number(newTransaction.account_id),
//       type: newTransaction.type,
//       amount: Number(newTransaction.amount),
//       category: newTransaction.category,
//       description: newTransaction.description,
//       date: newTransaction.date
//     };

//     const res = await fetch(`${API_URL}/transactions/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify(payload),
//     });

//     const data = await res.json();
//     if (!res.ok) {
//       alert("Invalid transaction");
//       return;
//     }

//     setTransactions(prev => [data, ...prev]);
//     setShowAddTransaction(false);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#bde0fe] via-[#ffc8dd] to-[#cdb4db] p-6">
//       <h1 className="text-3xl font-bold mb-6 text-[#4a4a4a]">Digital Banking Dashboard</h1>

//       {/* STATS */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//         <StatCard title="Total Balance" value={`₹ ${totalBalance}`} color="#a2d2ff" />
//         <StatCard title="Total Income" value={`₹ ${totalIncome}`} color="#bde0fe" />
//         <StatCard title="Total Expense" value={`₹ ${totalExpense}`} color="#ffafcc" />
//       </div>

//       {/* ACCOUNTS */}
//       <div className="flex justify-between items-center mb-3">
//         <h2 className="text-xl font-semibold">My Accounts</h2>
//         <button onClick={() => setShowAddAccount(true)} className="bg-[#ffafcc] px-4 py-2 rounded-xl shadow">
//           + Add Account
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//         {accounts.map(acc => (
//           <div key={acc.id} className="bg-white rounded-2xl p-4 shadow border-l-8" style={{ borderColor: "#cdb4db" }}>
//             <p className="text-sm text-gray-500">{acc.account_type}</p>
//             <p className="font-semibold text-lg">{acc.bank_name}</p>
//             <p className="text-sm">{acc.masked_account}</p>
//             <p className="text-xl font-bold mt-2">₹ {acc.balance}</p>
//           </div>
//         ))}
//       </div>

//       {/* TRANSACTIONS */}
//       <div className="flex justify-between items-center mb-3">
//         <h2 className="text-xl font-semibold">Recent Transactions</h2>
//         <button onClick={() => setShowAddTransaction(true)} className="bg-[#a2d2ff] px-4 py-2 rounded-xl shadow">
//           + Add Transaction
//         </button>
//       </div>

//       <div className="bg-white rounded-2xl shadow overflow-hidden">
//         {transactions.map(t => (
//           <div key={t.id} className="flex justify-between items-center px-4 py-3 border-b">
//             <div>
//               <p className="font-medium">{t.description || "Transaction"}</p>
//               <p className="text-xs text-gray-500">{String(t.date).slice(0, 10)}</p>
//             </div>
//             <div className={`font-bold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
//               {t.type === "income" ? "+" : "-"}₹{t.amount}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* ADD ACCOUNT MODAL */}
//       {showAddAccount && (
//         <Modal title="Add Account" onClose={() => setShowAddAccount(false)}>
//           <Input label="Bank Name" onChange={v => setNewAccount({ ...newAccount, bank_name: v })} />
//           <Select label="Account Type" options={["savings", "checking", "credit_card", "loan", "investment"]}
//             onChange={v => setNewAccount({ ...newAccount, account_type: v })} />
//           <Input label="Masked Account" placeholder="****1234"
//             onChange={v => setNewAccount({ ...newAccount, masked_account: v })} />
//           <Input label="Currency" defaultValue="INR"
//             onChange={v => setNewAccount({ ...newAccount, currency: v })} />
//           <Input label="Balance" type="number"
//             onChange={v => setNewAccount({ ...newAccount, balance: v })} />
//           <ModalActions onCancel={() => setShowAddAccount(false)} onSave={handleAddAccount} />
//         </Modal>
//       )}

//       {/* ADD TRANSACTION MODAL */}
//       {showAddTransaction && (
//         <Modal title="Add Transaction" onClose={() => setShowAddTransaction(false)}>
//           <Select label="Account" options={accounts.map(a => `${a.id}|${a.bank_name}`)}
//             onChange={v => setNewTransaction({ ...newTransaction, account_id: v.split("|")[0] })} />
//           <Select label="Type" options={["income", "expense"]}
//             onChange={v => setNewTransaction({ ...newTransaction, type: v })} />
//           <Input label="Amount" type="number"
//             onChange={v => setNewTransaction({ ...newTransaction, amount: v })} />
//           <Input label="Description"
//             onChange={v => setNewTransaction({ ...newTransaction, description: v })} />
//           <Input label="Date" type="date"
//             onChange={v => setNewTransaction({ ...newTransaction, date: v })} />
//           <ModalActions onCancel={() => setShowAddTransaction(false)} onSave={handleAddTransaction} />
//         </Modal>
//       )}
//     </div>
//   );
// }

// /* ---------- UI Components ---------- */

// function StatCard({ title, value, color }) {
//   return (
//     <div className="rounded-2xl p-4 shadow text-white" style={{ background: color }}>
//       <p className="text-sm">{title}</p>
//       <p className="text-2xl font-bold">{value}</p>
//     </div>
//   );
// }

// function Modal({ title, children, onClose }) {
//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       <div className="bg-white rounded-2xl p-6 w-96">
//         <h3 className="text-lg font-semibold mb-3">{title}</h3>
//         {children}
//       </div>
//     </div>
//   );
// }

// function Input({ label, type = "text", placeholder = "", defaultValue = "", onChange }) {
//   return (
//     <div className="mb-2">
//       <label className="text-sm">{label}</label>
//       <input
//         type={type}
//         defaultValue={defaultValue}
//         placeholder={placeholder}
//         className="w-full border p-2 rounded"
//         onChange={e => onChange(e.target.value)}
//       />
//     </div>
//   );
// }

// function Select({ label, options, onChange }) {
//   return (
//     <div className="mb-2">
//       <label className="text-sm">{label}</label>
//       <select className="w-full border p-2 rounded" onChange={e => onChange(e.target.value)}>
//         <option value="">Select</option>
//         {options.map(o => (
//           <option key={o} value={o}>{o.includes("|") ? o.split("|")[1] : o}</option>
//         ))}
//       </select>
//     </div>
//   );
// }

// function ModalActions({ onCancel, onSave }) {
//   return (
//     <div className="flex justify-end gap-3 mt-3">
//       <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
//       <button type="button" onClick={onSave} className="px-4 py-2 bg-[#cdb4db] rounded">Save</button>
//     </div>
//   );
// }



// import { useEffect, useState } from "react";
// import { API_URL } from "../api";

// export default function Dashboard() {
//   const [accounts, setAccounts] = useState([]);
//   const [transactions, setTransactions] = useState([]);
//   const [showAddAccount, setShowAddAccount] = useState(false);
//   const [showAddTransaction, setShowAddTransaction] = useState(false);

//   const [newAccount, setNewAccount] = useState({
//     bank_name: "",
//     account_type: "savings",
//     masked_account: "****1234",
//     currency: "INR",
//     balance: ""
//   });

//   const [newTransaction, setNewTransaction] = useState({
//     account_id: "",
//     type: "income",
//     amount: "",
//     category: "Manual",
//     description: "",
//     date: ""
//   });

//   const token = localStorage.getItem("access_token") || localStorage.getItem("token");

//   useEffect(() => {
//     if (!token) {
//       window.location.href = "/login";
//       return;
//     }

//     fetch(`${API_URL}/accounts/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     }).then(r => r.json()).then(setAccounts);

//     fetch(`${API_URL}/transactions/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     }).then(r => r.json()).then(setTransactions);
//   }, [token]);

//   const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
//   const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
//   const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

//   const handleAddAccount = async () => {
//     const payload = { ...newAccount, balance: Number(newAccount.balance) };

//     const res = await fetch(`${API_URL}/accounts/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//       alert("Invalid account details");
//       return;
//     }

//     const accRes = await fetch(`${API_URL}/accounts/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setAccounts(await accRes.json());
//     setShowAddAccount(false);
//   };

//   const handleAddTransaction = async () => {
//     const payload = {
//       account_id: Number(newTransaction.account_id),
//       type: newTransaction.type,
//       amount: Number(newTransaction.amount),
//       category: newTransaction.category,
//       description: newTransaction.description,
//       date: newTransaction.date
//     };

//     const res = await fetch(`${API_URL}/transactions/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify(payload),
//     });

//     const data = await res.json();
//     if (!res.ok) {
//       alert("Invalid transaction");
//       return;
//     }

//     setTransactions(prev => [data, ...prev]);
//     setShowAddTransaction(false);
//   };

//   return (
//     <div className="min-h-screen p-8 bg-gradient-to-br from-[#bde0fe] via-[#ffc8dd] to-[#cdb4db]">
//       <h1 className="text-3xl font-bold mb-8 text-gray-700">Digital Banking Dashboard</h1>

//       {/* STAT CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <GlassCard title="Total Balance" value={`₹ ${totalBalance}`} color="from-[#a2d2ff] to-[#bde0fe]" />
//         <GlassCard title="Total Income" value={`₹ ${totalIncome}`} color="from-[#bde0fe] to-[#cdb4db]" />
//         <GlassCard title="Total Expense" value={`₹ ${totalExpense}`} color="from-[#ffafcc] to-[#ffc8dd]" />
//       </div>

//       {/* ACCOUNTS */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold">My Accounts</h2>
//         <button onClick={() => setShowAddAccount(true)} className="glass-btn">+ Add Account</button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
//         {accounts.map(acc => (
//           <div key={acc.id} className="glass-card">
//             <p className="text-sm text-gray-600">{acc.account_type.toUpperCase()}</p>
//             <p className="text-lg font-semibold">{acc.bank_name}</p>
//             <p className="text-sm">{acc.masked_account}</p>
//             <p className="text-2xl font-bold mt-2">₹ {acc.balance}</p>
//           </div>
//         ))}
//       </div>

//       {/* TRANSACTIONS */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold">Recent Transactions</h2>
//         <button onClick={() => setShowAddTransaction(true)} className="glass-btn">+ Add Transaction</button>
//       </div>

//       <div className="glass-panel">
//         {transactions.map(t => (
//           <div key={t.id} className="flex justify-between items-center py-3 border-b border-white/30">
//             <div>
//               <p className="font-medium">{t.description || "Transaction"}</p>
//               <p className="text-xs text-gray-500">{String(t.date).slice(0, 10)}</p>
//             </div>
//             <div className={`font-bold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
//               {t.type === "income" ? "+" : "-"}₹{t.amount}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* ADD ACCOUNT MODAL */}
//       {showAddAccount && (
//         <GlassModal title="Add Account" onClose={() => setShowAddAccount(false)}>
//           <Input label="Bank Name" onChange={v => setNewAccount({ ...newAccount, bank_name: v })} />
//           <Select label="Account Type" options={["savings", "checking", "credit_card", "loan", "investment"]}
//             onChange={v => setNewAccount({ ...newAccount, account_type: v })} />
//           <Input label="Masked Account" placeholder="****1234"
//             onChange={v => setNewAccount({ ...newAccount, masked_account: v })} />
//           <Input label="Currency" defaultValue="INR"
//             onChange={v => setNewAccount({ ...newAccount, currency: v })} />
//           <Input label="Balance" type="number"
//             onChange={v => setNewAccount({ ...newAccount, balance: v })} />
//           <ModalActions onCancel={() => setShowAddAccount(false)} onSave={handleAddAccount} />
//         </GlassModal>
//       )}

//       {/* ADD TRANSACTION MODAL */}
//       {showAddTransaction && (
//         <GlassModal title="Add Transaction" onClose={() => setShowAddTransaction(false)}>
//           <Select label="Account" options={accounts.map(a => `${a.id}|${a.bank_name}`)}
//             onChange={v => setNewTransaction({ ...newTransaction, account_id: v.split("|")[0] })} />
//           <Select label="Type" options={["income", "expense"]}
//             onChange={v => setNewTransaction({ ...newTransaction, type: v })} />
//           <Input label="Amount" type="number"
//             onChange={v => setNewTransaction({ ...newTransaction, amount: v })} />
//           <Input label="Description"
//             onChange={v => setNewTransaction({ ...newTransaction, description: v })} />
//           <Input label="Date" type="date"
//             onChange={v => setNewTransaction({ ...newTransaction, date: v })} />
//           <ModalActions onCancel={() => setShowAddTransaction(false)} onSave={handleAddTransaction} />
//         </GlassModal>
//       )}

//       {/* GLASS STYLES */}
//       <style>{`
//         .glass-card {
//           background: rgba(255,255,255,0.35);
//           backdrop-filter: blur(12px);
//           border-radius: 20px;
//           padding: 16px;
//           box-shadow: 0 10px 30px rgba(0,0,0,0.1);
//           border: 1px solid rgba(255,255,255,0.4);
//           transition: transform 0.3s ease;
//         }
//         .glass-card:hover { transform: translateY(-4px); }

//         .glass-panel {
//           background: rgba(255,255,255,0.4);
//           backdrop-filter: blur(10px);
//           border-radius: 20px;
//           padding: 16px;
//           box-shadow: 0 10px 30px rgba(0,0,0,0.1);
//           border: 1px solid rgba(255,255,255,0.4);
//         }

//         .glass-btn {
//           background: rgba(255,255,255,0.5);
//           backdrop-filter: blur(8px);
//           padding: 8px 16px;
//           border-radius: 999px;
//           border: 1px solid rgba(255,255,255,0.6);
//           box-shadow: 0 4px 12px rgba(0,0,0,0.1);
//         }
//       `}</style>
//     </div>
//   );
// }

// /* UI Components */

// function GlassCard({ title, value, color }) {
//   return (
//     <div className={`rounded-2xl p-4 text-white bg-gradient-to-r ${color} shadow-xl`}>
//       <p className="text-sm opacity-90">{title}</p>
//       <p className="text-2xl font-bold">{value}</p>
//     </div>
//   );
// }

// function GlassModal({ title, children }) {
//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       <div className="glass-panel w-96">
//         <h3 className="text-lg font-semibold mb-3">{title}</h3>
//         {children}
//       </div>
//     </div>
//   );
// }

// function Input({ label, type = "text", placeholder = "", defaultValue = "", onChange }) {
//   return (
//     <div className="mb-2">
//       <label className="text-sm">{label}</label>
//       <input
//         type={type}
//         defaultValue={defaultValue}
//         placeholder={placeholder}
//         className="w-full border p-2 rounded"
//         onChange={e => onChange(e.target.value)}
//       />
//     </div>
//   );
// }

// function Select({ label, options, onChange }) {
//   return (
//     <div className="mb-2">
//       <label className="text-sm">{label}</label>
//       <select className="w-full border p-2 rounded" onChange={e => onChange(e.target.value)}>
//         <option value="">Select</option>
//         {options.map(o => (
//           <option key={o} value={o}>{o.includes("|") ? o.split("|")[1] : o}</option>
//         ))}
//       </select>
//     </div>
//   );
// }

// function ModalActions({ onCancel, onSave }) {
//   return (
//     <div className="flex justify-end gap-3 mt-3">
//       <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
//       <button type="button" onClick={onSave} className="px-4 py-2 bg-[#cdb4db] rounded">Save</button>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { API_URL } from "../api";

export default function Dashboard() {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState([]);
const month = new Date().getMonth() + 1;
const year = new Date().getFullYear();


  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const [newAccount, setNewAccount] = useState({
    bank_name: "",
    account_type: "savings",
    masked_account: "****1234",
    currency: "INR",
    balance: ""
  });

  const [newTransaction, setNewTransaction] = useState({
    account_id: "",
    type: "income",
    amount: "",
    category: "General",
    description: "",
    date: ""
  });

  useEffect(() => {
  if (!token) window.location.href = "/login";

  fetch(`${API_URL}/accounts/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setAccounts(data));

  fetch(`${API_URL}/transactions/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setTransactions(data));

  fetch(`${API_URL}/budgets/summary?month=${month}&year=${year}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setBudgetSummary(data));

}, [token]);


  const handleAddAccount = async () => {
    const payload = { ...newAccount, balance: Number(newAccount.balance) };

    const res = await fetch(`${API_URL}/accounts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert("Invalid account details");
      return;
    }

    const updated = await fetch(`${API_URL}/accounts/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAccounts(await updated.json());
    setShowAddAccount(false);
  };

  const handleAddTransaction = async () => {
    const payload = {
      account_id: Number(newTransaction.account_id),
      type: newTransaction.type,
      amount: Number(newTransaction.amount),
      category: newTransaction.category,
      description: newTransaction.description,
      date: newTransaction.date
    };

    const res = await fetch(`${API_URL}/transactions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      alert("Invalid transaction");
      return;
    }

    setTransactions(prev => [data, ...prev]);
    setShowAddTransaction(false);
  };
const totalLimit = budgetSummary.reduce((s, b) => s + b.limit, 0);
const totalSpent = budgetSummary.reduce((s, b) => s + b.spent, 0);
const remaining = totalLimit - totalSpent;
const isOver = budgetSummary.some(b => b.over_budget);

  return (
    <div className="min-h-screen flex bg-[#f7f7fb]">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-[#cdb4db] to-[#ffc8dd] p-4 shadow-lg">
        <h2 className="text-2xl font-bold mb-8">💳 MyBank</h2>

        <nav className="space-y-2">
          <SidebarItem label="Dashboard" active />
          <SidebarItem label="Accounts" />
          <SidebarItem label="Transactions" />
          <SidebarItem label="Budgets" />
          <SidebarItem label="Bills" />
          <SidebarItem label="Rewards" />
          <SidebarItem label="Insights" />
          <SidebarItem label="Settings" />
        </nav>

        <div className="mt-auto pt-6 border-t">
          <button className="w-full bg-[#ffafcc] py-2 rounded-lg font-semibold">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">Digital Banking Dashboard</h1>
          <div className="w-10 h-10 rounded-full bg-[#a2d2ff] flex items-center justify-center font-bold">
            U
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-6 space-y-10">
        {/* BUDGET SUMMARY */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">

  <div className="bg-[#cdb4db] p-4 rounded-xl shadow">
    <p className="text-sm">Total Budget</p>
    <h2 className="text-xl font-bold">₹ {totalLimit}</h2>
  </div>

  <div className="bg-[#ffc8dd] p-4 rounded-xl shadow">
    <p className="text-sm">Spent</p>
    <h2 className="text-xl font-bold">₹ {totalSpent}</h2>
  </div>

  <div className="bg-[#bde0fe] p-4 rounded-xl shadow">
    <p className="text-sm">Remaining</p>
    <h2 className="text-xl font-bold">₹ {remaining}</h2>
  </div>

  <div className={`p-4 rounded-xl shadow ${isOver ? "bg-red-200" : "bg-[#a2d2ff]"}`}>
    <p className="text-sm">Status</p>
    <h2 className="text-xl font-bold">{isOver ? "Over Budget ⚠" : "Within Limit"}</h2>
  </div>

</div>

          {/* ACCOUNTS */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Bank Accounts</h2>
              <button
                onClick={() => setShowAddAccount(true)}
                className="bg-[#ffafcc] px-4 py-2 rounded-lg"
              >
                + Add Account
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  className="rounded-2xl p-5 text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, #bde0fe, #a2d2ff)" }}
                >
                  <div className="text-sm opacity-80">{acc.account_type.toUpperCase()}</div>
                  <div className="text-xl font-semibold">{acc.bank_name}</div>
                  <div className="tracking-widest mt-2">{acc.masked_account}</div>
                  <div className="mt-4 text-2xl font-bold">₹ {acc.balance}</div>
                </div>
              ))}
            </div>
          </section>

          {/* TRANSACTIONS */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Transactions</h2>
              <button
                onClick={() => setShowAddTransaction(true)}
                className="bg-[#bde0fe] px-4 py-2 rounded-lg"
              >
                + Add Transaction
              </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#ffc8dd]">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b">
                      <td className="p-3">{String(tx.date).slice(0, 10)}</td>
                      <td className="p-3">{tx.description}</td>
                      <td className="p-3">{tx.category}</td>
                      <td className="p-3 capitalize">
                        <span className={tx.type === "income" ? "text-green-600" : "text-red-600"}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`p-3 font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        ₹ {tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* ADD ACCOUNT MODAL */}
      {showAddAccount && (
        <Modal title="Add Account" onClose={() => setShowAddAccount(false)}>
          <Input label="Bank Name" onChange={v => setNewAccount({ ...newAccount, bank_name: v })} />
          <Select
            label="Account Type"
            options={["savings", "checking", "credit_card", "loan", "investment"]}
            onChange={v => setNewAccount({ ...newAccount, account_type: v })}
          />
          <Input label="Masked Account" placeholder="****1234"
            onChange={v => setNewAccount({ ...newAccount, masked_account: v })}
          />
          <Input label="Currency" defaultValue="INR"
            onChange={v => setNewAccount({ ...newAccount, currency: v })}
          />
          <Input label="Balance" type="number"
            onChange={v => setNewAccount({ ...newAccount, balance: v })}
          />
          <ModalActions onCancel={() => setShowAddAccount(false)} onSave={handleAddAccount} />
        </Modal>
      )}

      {/* ADD TRANSACTION MODAL */}
      {showAddTransaction && (
        <Modal title="Add Transaction" onClose={() => setShowAddTransaction(false)}>
          <Select
            label="Account"
            options={accounts.map(a => `${a.id}|${a.bank_name}`)}
            onChange={v => setNewTransaction({ ...newTransaction, account_id: v.split("|")[0] })}
          />
          <Select
            label="Type"
            options={["income", "expense"]}
            onChange={v => setNewTransaction({ ...newTransaction, type: v })}
          />
          <Input label="Amount" type="number"
            onChange={v => setNewTransaction({ ...newTransaction, amount: v })}
          />
          <Input label="Category"
            onChange={v => setNewTransaction({ ...newTransaction, category: v })}
          />
          <Input label="Description"
            onChange={v => setNewTransaction({ ...newTransaction, description: v })}
          />
          <Input label="Date" type="date"
            onChange={v => setNewTransaction({ ...newTransaction, date: v })}
          />
          <ModalActions onCancel={() => setShowAddTransaction(false)} onSave={handleAddTransaction} />
        </Modal>
      )}
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function SidebarItem({ label, active }) {
  return (
    <div className={`px-4 py-2 rounded-lg cursor-pointer ${active ? "bg-[#ffafcc] font-semibold" : "hover:bg-[#ffc8dd]"}`}>
      {label}
    </div>
  );
}

function Modal({ title, children }) {
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
          <option key={o} value={o}>{o.includes("|") ? o.split("|")[1] : o}</option>
        ))}
      </select>
    </div>
  );
}

function ModalActions({ onCancel, onSave }) {
  return (
    <div className="flex justify-end gap-3 mt-3">
      <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
      <button type="button" onClick={onSave} className="px-4 py-2 bg-[#cdb4db] rounded">Save</button>
    </div>
  );
}
