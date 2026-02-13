import React, { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function Reports() {
  const [loading, setLoading] = useState(false);

  const downloadFile = async (endpoint, filename) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error downloading file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-12 animate-fadeIn">

      {/* Soft Background Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#cdb4db] blur-[140px] opacity-20" />
      <div className="absolute bottom-0 -left-24 w-96 h-96 bg-[#bde0fe] blur-[140px] opacity-20" />

      <div className="relative z-10 max-w-5xl">

        {/* Page Title */}
        <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-[#5e548e] to-[#6d597a] bg-clip-text text-transparent tracking-wide">
          Reports & Exports
        </h1>

        <p className="text-[#6d597a] mb-10">
          Download structured financial summaries in CSV and PDF formats.
        </p>

        {/* Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/50 p-12">

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6 mb-10">

            <div className="bg-gradient-to-br from-[#a2d2ff] to-[#bde0fe] p-6 rounded-2xl shadow-md text-white">
              <p className="text-sm opacity-80">Transactions</p>
              <h2 className="text-2xl font-bold mt-2">CSV Export</h2>
            </div>

            <div className="bg-gradient-to-br from-[#ffafcc] to-[#ffc8dd] p-6 rounded-2xl shadow-md text-white">
              <p className="text-sm opacity-80">Budget Overview</p>
              <h2 className="text-2xl font-bold mt-2">Monthly Summary</h2>
            </div>

            <div className="bg-gradient-to-br from-[#cdb4db] to-[#a2d2ff] p-6 rounded-2xl shadow-md text-white">
              <p className="text-sm opacity-80">Detailed Report</p>
              <h2 className="text-2xl font-bold mt-2">PDF Download</h2>
            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-[#e0e7ff] mb-8"></div>

          {/* Loading */}
          {loading && (
            <div className="text-center text-[#6d597a] font-medium animate-pulse mb-6">
              Preparing your premium report...
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-6">

            {/* Transactions */}
            <button
              onClick={() =>
                downloadFile("/reports/transactions/csv", "transactions.csv")
              }
              className="group relative w-full py-5 rounded-2xl font-semibold text-white text-lg
                         bg-gradient-to-r from-[#a2d2ff] to-[#bde0fe]
                         shadow-[0_10px_30px_rgba(162,210,255,0.35)]
                         hover:shadow-[0_15px_40px_rgba(162,210,255,0.5)]
                         hover:scale-[1.03]
                         transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition duration-300"></span>
              📄 Download Transactions CSV
            </button>

            {/* Budget */}
            <button
              onClick={() =>
                downloadFile("/reports/budgets/csv", "budget_summary.csv")
              }
              className="group relative w-full py-5 rounded-2xl font-semibold text-white text-lg
                         bg-gradient-to-r from-[#ffafcc] to-[#ffc8dd]
                         shadow-[0_10px_30px_rgba(255,175,204,0.35)]
                         hover:shadow-[0_15px_40px_rgba(255,175,204,0.5)]
                         hover:scale-[1.03]
                         transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition duration-300"></span>
              💰 Download Budget Summary
            </button>

            {/* PDF */}
            <button
              onClick={() =>
                downloadFile("/reports/monthly/pdf", "monthly_report.pdf")
              }
              className="group relative w-full py-5 rounded-2xl font-semibold text-white text-lg
                         bg-gradient-to-r from-[#cdb4db] to-[#a2d2ff]
                         shadow-[0_10px_30px_rgba(205,180,219,0.35)]
                         hover:shadow-[0_15px_40px_rgba(205,180,219,0.5)]
                         hover:scale-[1.03]
                         transition-all duration-300 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition duration-300"></span>
              📊 Download Monthly PDF Report
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
