// import { useEffect, useState } from "react";
// import { API_URL } from "../api";

// export default function DashboardHome() {
//   const token = localStorage.getItem("access_token") || localStorage.getItem("token");
//   const [accounts, setAccounts] = useState([]);
//   const [transactions, setTransactions] = useState([]);

//   useEffect(() => {
//     fetch(`${API_URL}/accounts/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then(res => res.json())
//       .then(data => setAccounts(data));

//     fetch(`${API_URL}/transactions/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then(res => res.json())
//       .then(data => setTransactions(data));
//   }, [token]);

//   const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

//   return (
//     <div className="space-y-6">

//       <h2 className="text-2xl font-bold">Overview</h2>

//       {/* SUMMARY CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <SummaryCard title="Total Balance" value={`₹ ${totalBalance}`} color="#bde0fe" />
//         <SummaryCard title="Accounts" value={accounts.length} color="#a2d2ff" />
//         <SummaryCard title="Transactions" value={transactions.length} color="#ffafcc" />
//       </div>

//       {/* RECENT TRANSACTIONS */}
//       <div className="bg-white rounded-xl shadow p-4">
//         <h3 className="font-semibold mb-3">Recent Transactions</h3>
//         <ul className="space-y-2">
//           {transactions.slice(0, 5).map(t => (
//             <li key={t.id} className="flex justify-between border-b pb-2">
//               <span>{t.description || "Transaction"}</span>
//               <span className={t.type === "income" ? "text-green-600" : "text-red-600"}>
//                 ₹ {t.amount}
//               </span>
//             </li>
//           ))}
//         </ul>
//       </div>

//     </div>
//   );
// }

// function SummaryCard({ title, value, color }) {
//   return (
//     <div
//       className="rounded-xl p-4 text-white shadow"
//       style={{ backgroundColor: color }}
//     >
//       <div className="text-sm opacity-80">{title}</div>
//       <div className="text-2xl font-bold">{value}</div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { API_URL } from "../api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, CartesianGrid, Legend
} from "recharts";

const COLORS = ["#cdb4db", "#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"];

export default function DashboardHome() {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState([]);

const month = new Date().getMonth() + 1;
const year = new Date().getFullYear();

  useEffect(() => {
  fetch(`${API_URL}/accounts/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setAccounts(Array.isArray(data) ? data : []));

  fetch(`${API_URL}/transactions/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setTransactions(Array.isArray(data) ? data : []));

  fetch(`${API_URL}/budgets/summary?month=${month}&year=${year}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setBudgetSummary(Array.isArray(data) ? data : []));
}, [token, month, year]);


  const totalBalance = Array.isArray(accounts)
  ? accounts.reduce((s, a) => s + Number(a.balance || 0), 0)
  : 0;

const totalIncome = Array.isArray(transactions)
  ? transactions
      .filter(t => t.type === "income")
      .reduce((s, t) => s + Number(t.amount || 0), 0)
  : 0;

const totalExpense = Array.isArray(transactions)
  ? transactions
      .filter(t => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount || 0), 0)
  : 0;

const totalBudget = Array.isArray(budgetSummary)
  ? budgetSummary.reduce((s, b) => s + Number(b.limit || 0), 0)
  : 0;

const totalSpent = Array.isArray(budgetSummary)
  ? budgetSummary.reduce((s, b) => s + Number(b.spent || 0), 0)
  : 0;

const remaining = totalBudget - totalSpent;

const isOver = Array.isArray(budgetSummary)
  ? budgetSummary.some(b => b.over_budget)
  : false;


  const balanceChart = accounts.map(a => ({
    name: a.bank_name,
    balance: Number(a.balance)
  }));

  const categoryData = {};
  transactions.forEach(t => {
  if (t.type === "expense") {
    const cat = t.category && t.category.trim() !== "" ? t.category : "Uncategorized";
    categoryData[cat] = (categoryData[cat] || 0) + Number(t.amount);
  }
});


 const pieData = Object.keys(categoryData).length
  ? Object.keys(categoryData).map(key => ({ name: key, value: categoryData[key] }))
  : [{ name: "No Expense Data", value: 1 }];

  const lineData = transactions
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(t => ({
      date: t.date.slice(0, 10),
      income: t.type === "income" ? t.amount : 0,
      expense: t.type === "expense" ? t.amount : 0
    }));

  return (
    <div className="space-y-8">

      {/* SUMMARY CARDS */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <Card title="Total Balance" value={`₹ ${totalBalance}`} />
  <Card title="Total Income" value={`₹ ${totalIncome}`} />
  <Card title="Total Expense" value={`₹ ${totalExpense}`} />
  <Card title="Accounts" value={accounts.length} />

  <Card title="Total Budget" value={`₹ ${totalBudget}`} />
  <Card title="Budget Spent" value={`₹ ${totalSpent}`} />
  <Card title="Remaining Budget" value={`₹ ${remaining}`} />
  <Card title="Status" value={isOver ? "Over Budget ⚠" : "Within Limit"} />
</div>


      {/* LINE CHART */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-2">Cash Flow</h3>
       <ResponsiveContainer width="100%" height={250}>
  <LineChart data={lineData}>
    <defs>
      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#bde0fe" stopOpacity={0.8}/>
        <stop offset="100%" stopColor="#bde0fe" stopOpacity={0.2}/>
      </linearGradient>
      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffafcc" stopOpacity={0.8}/>
        <stop offset="100%" stopColor="#ffafcc" stopOpacity={0.2}/>
      </linearGradient>
    </defs>

    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line
      type="monotone"
      dataKey="income"
      stroke="#a2d2ff"
      strokeWidth={3}
      dot={{ r: 4 }}
      animationDuration={1500}
    />
    <Line
      type="monotone"
      dataKey="expense"
      stroke="#ffafcc"
      strokeWidth={3}
      dot={{ r: 4 }}
      animationDuration={1500}
    />
  </LineChart>
</ResponsiveContainer>

      </div>

      {/* PIE + BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
  data={pieData}
  dataKey="value"
  outerRadius={90}
  innerRadius={50}
  animationDuration={1200}
>
  {pieData.map((_, i) => (
    <Cell key={i} fill={COLORS[i % COLORS.length]} />
  ))}
</Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Account Balances</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={balanceChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
  dataKey="balance"
  fill="#a2d2ff"
  radius={[10, 10, 0, 0]}
  animationDuration={1200}
/>

            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-gradient-to-r from-[#bde0fe] to-[#a2d2ff] p-4 rounded-xl shadow-lg hover:shadow-xl transition">
      <div className="text-sm text-gray-700">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
