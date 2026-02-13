import { useEffect, useState } from "react";
import { API_URL } from "../api";

const budgetColors = {
  Food: "bg-[#ffafcc]",
  Travel: "bg-[#a2d2ff]",
  Shopping: "bg-[#ffc8dd]",
  Bills: "bg-[#cdb4db]",
  Entertainment: "bg-[#bde0fe]",
  Salary: "bg-[#a2d2ff]",
  Others: "bg-gray-300"
};


export default function BudgetsPage() {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token");

  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [budgetSummary, setBudgetSummary] = useState([]);

  const [form, setForm] = useState({
    category: "",
    limit_amount: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/categories/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCategories(data));
  }, [token]);
  useEffect(() => {
  fetch(`${API_URL}/budgets/summary?month=${month}&year=${year}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setBudgetSummary(data));
}, [month, year, token]);

  const validate = () => {
    const newErrors = {};

    if (!form.category) newErrors.category = "Category is required";
    if (!form.limit_amount || Number(form.limit_amount) <= 0)
      newErrors.limit_amount = "Limit must be greater than 0";
    if (month < 1 || month > 12)
      newErrors.month = "Month must be between 1 and 12";
    if (year < 2020)
      newErrors.year = "Enter valid year";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateBudget = async () => {
  if (!validate()) return;

  try {
    const res = await fetch(`${API_URL}/budgets/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        category: form.category,
        month: month,
        year: year,
        limit_amount: Number(form.limit_amount)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.detail || "Failed to create budget");
      return;
    }

    alert("Budget created successfully!");

    // Reset form
    setForm({ category: "", limit_amount: "" });

  } catch (err) {
    alert("Server error while creating budget");
  }
};


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Monthly Budgets</h2>

      {/* Budget Creation Form */}
      <div className="bg-white p-5 rounded-xl shadow w-full max-w-md">
        <h3 className="font-semibold mb-3">Create Budget</h3>

        <label className="block text-sm mb-1">Category</label>
        <select
          className="w-full border rounded p-2 mb-1"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
        >
          <option value="">Select Category</option>
          {categories.map(c => (
            <option key={c.id} value={c.category_name}>
              {c.category_name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm">{errors.category}</p>
        )}

        <label className="block text-sm mt-3 mb-1">Month</label>
        <input
          type="number"
          min="1"
          max="12"
          className="w-full border rounded p-2 mb-1"
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
        />
        {errors.month && (
          <p className="text-red-500 text-sm">{errors.month}</p>
        )}

        <label className="block text-sm mt-3 mb-1">Year</label>
        <input
          type="number"
          className="w-full border rounded p-2 mb-1"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        />
        {errors.year && (
          <p className="text-red-500 text-sm">{errors.year}</p>
        )}

        <label className="block text-sm mt-3 mb-1">Limit Amount</label>
        <input
          type="number"
          className="w-full border rounded p-2 mb-1"
          value={form.limit_amount}
          onChange={e =>
            setForm({ ...form, limit_amount: e.target.value })
          }
        />
        {errors.limit_amount && (
          <p className="text-red-500 text-sm">{errors.limit_amount}</p>
        )}

        <button
  className="w-full bg-[#cdb4db] py-2 rounded font-semibold mt-4"
  onClick={handleCreateBudget}
>
  Create Budget
</button>

      </div>
      {/* Budget List */}
<div className="mt-8">
  <h3 className="text-xl font-semibold mb-3">
    Budgets for {month}/{year}
  </h3>

  {budgetSummary.length === 0 && (
    <p className="text-gray-500">No budgets created for this month.</p>
  )}

  <div className="space-y-4">
    {budgetSummary.map((b, i) => {
      const percent = Math.min(
        100,
        Math.round((b.spent / b.limit) * 100)
      );

      return (
        <div
          key={i}
          className={`p-4 rounded-xl shadow ${
            b.over_budget ? "border-2 border-red-500" : "border"
          }`}
        >
          <div className="flex justify-between mb-2">
            <span className="font-semibold">{b.category}</span>
            <span className="text-sm">
              ₹{b.spent} / ₹{b.limit}
            </span>
          </div>

          <div className="w-full bg-gray-200 h-3 rounded overflow-hidden">
  <div
    className={`h-3 rounded transition-all duration-700 ${
      budgetColors[b.category] || budgetColors["Others"]
    } ${b.over_budget ? "animate-pulse shadow-lg shadow-red-400" : ""}`}
    style={{ width: `${percent}%` }}
  ></div>
</div>
<div className="text-xs text-right mt-1">
  {percent}% used
</div>


          <div className="text-sm mt-1">
            Remaining: ₹{b.remaining}{" "}
            {b.over_budget && (
  <span className="text-red-600 font-semibold ml-2 animate-pulse">
    ⚠ Over Budget
  </span>
)}

          </div>
        </div>
      );
    })}
  </div>
</div>

    </div>
  );
}
