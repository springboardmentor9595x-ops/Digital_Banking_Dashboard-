import { useState } from "react";

export default function CreateAccount() {
  const [form, setForm] = useState({
    bank_name: "",
    account_type: "",
    masked_account: "",
    currency: "INR",
    balance: 0,
  });

  const token = localStorage.getItem("token");

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("http://127.0.0.1:8000/accounts/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    alert(JSON.stringify(data));
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow rounded space-y-3 w-96">

        <h2 className="font-bold text-lg text-center">Create Account</h2>

        <input className="border p-2 w-full" placeholder="Bank Name"
          onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Account Type (savings)"
          onChange={(e) => setForm({ ...form, account_type: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Masked Account (****1234)"
          onChange={(e) => setForm({ ...form, masked_account: e.target.value })} />

        <input className="border p-2 w-full" type="number" placeholder="Balance"
          onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} />

        <button className="bg-green-600 text-white w-full p-2 rounded">
          Create
        </button>
      </form>
    </div>
  );
}
