// import { useEffect, useState } from "react";
// import axios from "axios";

// export default function Insights() {
//   const [data, setData] = useState(null);
//   const token = localStorage.getItem("access_token");

//   useEffect(() => {
//     fetchInsights();
//   }, []);

//   const fetchInsights = async () => {
//     const res = await axios.get("http://127.0.0.1:8000/insights/summary", {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     setData(res.data);
//   };

//   if (!data) return <div className="p-6">Loading insights...</div>;

//   return (
//     <div className="p-8 space-y-8">

//       <h1 className="text-2xl font-semibold text-gray-800">
//         Financial Insights
//       </h1>

//       {/* Monthly Cashflow */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card title="Total Income" value={`₹${data.cashflow.total_income}`} green />
//         <Card title="Total Expense" value={`₹${data.cashflow.total_expense}`} red />
//         <Card title="Net Savings" value={`₹${data.cashflow.net_savings}`} blue />
//       </div>

//       {/* Top Merchants */}
//       <Section title="Top Merchants">
//         {data.top_merchants.map((m, i) => (
//           <Row key={i} label={m.merchant} value={`₹${m.total_spent}`} />
//         ))}
//       </Section>

//       {/* Category Summary */}
//       <Section title="Category Spending">
//         {data.category_summary.map((c, i) => (
//           <Row key={i} label={c.category} value={`₹${c.total}`} />
//         ))}
//       </Section>

//       {/* Burn Rate */}
//       <div className="bg-white p-6 rounded-2xl shadow border">
//         <p className="text-gray-500 text-sm">Average Monthly Burn Rate</p>
//         <p className="text-2xl font-bold text-red-600">
//           ₹{data.burn_rate}
//         </p>
//       </div>

//     </div>
//   );
// }

// function Card({ title, value, green, red, blue }) {
//   return (
//     <div className="bg-white p-6 rounded-2xl shadow border">
//       <p className="text-gray-500 text-sm">{title}</p>
//       <p
//         className={`text-2xl font-bold mt-2 ${
//           green ? "text-green-600" :
//           red ? "text-red-600" :
//           "text-blue-600"
//         }`}
//       >
//         {value}
//       </p>
//     </div>
//   );
// }

// function Section({ title, children }) {
//   return (
//     <div className="bg-white p-6 rounded-2xl shadow border space-y-3">
//       <h2 className="font-semibold text-gray-800">{title}</h2>
//       {children}
//     </div>
//   );
// }

// function Row({ label, value }) {
//   return (
//     <div className="flex justify-between text-sm">
//       <span>{label}</span>
//       <span className="font-semibold">{value}</span>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function Insights() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/insights/summary",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setData(res.data);
    } catch (err) {
      console.error("Insights fetch error:", err);
    }
  };

  if (!data)
    return (
      <div className="p-10 text-gray-500 text-lg">
        Loading Financial Insights...
      </div>
    );

  return (
    <div className="min-h-screen px-10 py-10 bg-gradient-to-br from-[#f8fbff] to-[#eef6ff]">

      <h1 className="text-4xl font-extrabold text-[#1e3a8a] mb-10 tracking-wide">
        Financial Insights
      </h1>

      {/* Cashflow Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">

        <PremiumCard
          title="Total Income"
          value={data.cashflow.total_income}
          icon={<TrendingUp size={22} />}
          color="income"
        />

        <PremiumCard
          title="Total Expense"
          value={data.cashflow.total_expense}
          icon={<TrendingDown size={22} />}
          color="expense"
        />

        <PremiumCard
          title="Net Savings"
          value={data.cashflow.net_savings}
          icon={<Wallet size={22} />}
          color="neutral"
        />

      </div>

      {/* Lower Section */}
      <div className="grid md:grid-cols-2 gap-10">

        <PremiumSection title="Top Merchants">
          {data.top_merchants.map((m, i) => (
            <Row
              key={i}
              label={m.merchant}
              value={`₹${m.total_spent}`}
            />
          ))}
        </PremiumSection>

        <PremiumSection title="Category Spending">
          {data.category_summary.map((c, i) => (
            <Row
              key={i}
              label={c.category}
              value={`₹${c.total}`}
            />
          ))}
        </PremiumSection>

      </div>

      {/* Burn Rate */}
      <div className="mt-12 max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">
            Monthly Burn Rate
          </p>
          <p className="text-3xl font-bold text-[#ffafcc]">
            ₹{data.burn_rate}
          </p>
        </div>
      </div>
    </div>
  );
}

function PremiumCard({ title, value, icon, color }) {

  let accent = "bg-[#a2d2ff]";
  let text = "text-[#1e3a8a]";

  if (color === "expense") {
    accent = "bg-[#ffc8dd]";
    text = "text-[#b91c1c]";
  }

  if (color === "income") {
    accent = "bg-[#bde0fe]";
    text = "text-[#1e40af]";
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">

      <div className="flex justify-between items-center mb-6">
        <div className={`p-3 rounded-xl ${accent}`}>
          {icon}
        </div>
      </div>

      <p className="text-gray-500 text-sm">{title}</p>

      <p className={`text-3xl font-bold mt-2 ${text}`}>
        ₹{value}
      </p>
    </div>
  );
}

function PremiumSection({ title, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
      <h2 className="text-lg font-semibold text-[#1e3a8a] mb-6">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center bg-[#f9fbff] px-5 py-3 rounded-xl">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-[#1e3a8a]">
        {value}
      </span>
    </div>
  );
}
