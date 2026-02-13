import { useEffect, useState } from "react";
import axios from "axios";

export default function Bills() {
  const [form, setForm] = useState({
    account_id: "",
    biller_name: "",
    due_date: "",
    amount_due: "",
    auto_pay: false,
  });
  const [bills, setBills] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const token = localStorage.getItem("access_token");

  const fetchBills = async () => {
    const res = await axios.get("http://127.0.0.1:8000/bills/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBills(res.data);
  };
  const fetchAccounts = async () => {
  const res = await axios.get("http://127.0.0.1:8000/accounts/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  setAccounts(res.data);
};


  useEffect(() => {
    fetchBills();
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let err = {};
    if (!form.biller_name) err.biller_name = "Required";
    if (!form.account_id) err.account_id = "Select account";

    if (!form.due_date) err.due_date = "Required";
    if (!form.amount_due || Number(form.amount_due) <= 0)
      err.amount_due = "Invalid amount";

    setErrors(err);
    if (Object.keys(err).length) return;

    setLoading(true);
    await axios.post("http://127.0.0.1:8000/bills/", form, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLoading(false);
   setForm({
  account_id: "",
  biller_name: "",
  due_date: "",
  amount_due: "",
  auto_pay: false,
});

    fetchBills();
  };

  const markPaid = async (bill) => {
    await axios.put(
      `http://127.0.0.1:8000/bills/${bill.id}`,
      { ...bill, status: "paid" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchBills();
  };

  const statusBadge = (status) => {
    if (status === "paid")
      return "bg-green-100 text-green-700 border border-green-200";
    if (status === "overdue")
      return "bg-red-100 text-red-700 border border-red-200";
    return "bg-amber-100 text-amber-700 border border-amber-200";
  };

  return (
    <div className="px-8 py-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Bills & Reminders
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Add Bill Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Bill</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
  <select
    name="account_id"
    value={form.account_id}
    onChange={handleChange}
    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-200 outline-none"
  >
    <option value="">Select Account</option>
    {accounts.map((acc) => (
      <option key={acc.id} value={acc.id}>
        {acc.bank_name} - {acc.masked_account}
      </option>
    ))}
  </select>

  {errors.account_id && (
    <p className="text-xs text-red-500 mt-1">{errors.account_id}</p>
  )}
</div>

            <div>
              <input
                name="biller_name"
                placeholder="Biller name"
                value={form.biller_name}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-200 outline-none"
              />
              {errors.biller_name && (
                <p className="text-xs text-red-500 mt-1">{errors.biller_name}</p>
              )}
            </div>

            <div>
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-200 outline-none"
              />
              {errors.due_date && (
                <p className="text-xs text-red-500 mt-1">{errors.due_date}</p>
              )}
            </div>

            <div>
              <input
                type="number"
                name="amount_due"
                placeholder="Amount"
                value={form.amount_due}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-200 outline-none"
              />
              {errors.amount_due && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.amount_due}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                name="auto_pay"
                checked={form.auto_pay}
                onChange={handleChange}
              />
              Enable Auto Pay
            </label>

           <button
  type="submit"
  disabled={loading}
  className="w-full py-2 rounded-lg font-semibold text-gray-800
             bg-gradient-to-r from-[#ffafcc] to-[#cdb4db]
             hover:from-[#ffc8dd] hover:to-[#ffafcc]
             transition-all duration-300 shadow-md hover:shadow-lg"
>
  {loading ? "Adding..." : "Add Bill"}
</button>

          </form>
        </div>

        {/* Bills Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Your Bills</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="py-2 text-left">Biller</th>
                  <th className="py-2 text-left">Due Date</th>
                  <th className="py-2 text-left">Amount</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-3 font-medium text-gray-800">
                      {bill.biller_name}
                    </td>
                    <td className="py-3 text-gray-600">
                      {bill.due_date.split("T")[0]}
                    </td>
                    <td className="py-3 font-semibold text-gray-800">
                      ₹{bill.amount_due}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                          bill.status
                        )}`}
                      >
                        {bill.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {bill.status !== "paid" && (
                        <button
                          onClick={() => markPaid(bill)}
                          className="px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-6 text-gray-400"
                    >
                      No bills added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
