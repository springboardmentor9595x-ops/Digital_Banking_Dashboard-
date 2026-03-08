import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { Trash2 } from "lucide-react";


export default function Rewards() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const [rewards, setRewards] = useState([]);
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newProgram, setNewProgram] = useState("");
  const [pointsDraft, setPointsDraft] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ================= FETCH REWARDS ================= */

  const fetchRewards = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/rewards/?currency=${currency}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();
      setRewards(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load rewards");
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRewards();
  }, [currency]);

  /* ================= ADD PROGRAM ================= */

  const addProgram = async () => {
    if (!newProgram.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/rewards/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          program_name: newProgram.trim(),
        }),
      });

      if (!res.ok) throw new Error();

      setNewProgram("");
      fetchRewards();
    } catch {
      setError("Failed to add reward program");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= ADD POINTS ================= */

  const addPoints = async (rewardId) => {
    const raw = pointsDraft[rewardId];

    if (!raw) {
      setError("Enter points");
      return;
    }

    const points = parseInt(raw, 10);

    if (isNaN(points) || points <= 0) {
      setError("Points must be positive");
      return;
    }

    setError("");

    try {
      const res = await fetch(`${API_URL}/rewards/points`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reward_id: rewardId,
          points,
        }),
      });

      if (!res.ok) throw new Error();

      setPointsDraft((prev) => ({
        ...prev,
        [rewardId]: "",
      }));

      fetchRewards();
    } catch {
      setError("Failed to update points");
    }
  };
  /* ================= DELETE PROGRAM ================= */

const deleteProgram = async (id) => {
  if (!window.confirm("Are you sure you want to delete this reward program?"))
    return;

  try {
    const res = await fetch(`${API_URL}/rewards/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error();

    fetchRewards();
  } catch {
    setError("Failed to delete reward program");
  }
};


  /* ================= CALCULATIONS ================= */

  const totalValue = rewards.reduce(
    (sum, r) => sum + Number(r.converted_value || 0),
    0
  );

  /* ================= UI ================= */

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Rewards
          </h1>
          <p className="text-sm text-gray-500">
            Manage reward programs and points
          </p>
        </div>

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="border rounded-lg px-4 py-2 bg-white"
        >
          <option value="INR">INR ₹</option>
          <option value="USD">USD $</option>
          <option value="EUR">EUR €</option>
        </select>
      </div>

      {/* SUMMARY */}
      <div className="bg-[#BDE0FE] rounded-2xl p-6">
        <p className="text-sm text-gray-700">
          Total Rewards Value
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {totalValue.toFixed(2)} {currency}
        </p>
      </div>

      {/* ADD PROGRAM */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <p className="font-medium text-gray-800">
          Add Reward Program
        </p>

        <div className="flex gap-3">
          <input
            value={newProgram}
            onChange={(e) => setNewProgram(e.target.value)}
            placeholder="e.g. Amazon Pay"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />

          <button
            onClick={addProgram}
            disabled={submitting}
            className="w-28 bg-[#FFC8DD] hover:bg-[#ffafcc] transition rounded-lg px-4 py-2 font-medium"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      {/* REWARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

        {loading ? (
          <p>Loading rewards...</p>
        ) : rewards.length === 0 ? (
          <p className="text-gray-500">
            No rewards added yet
          </p>
        ) : (
          rewards.map((r) => (
            <div
  key={r.id}
  className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-4"
>

              <div className="flex justify-between items-start">
  <div>
    <p className="font-semibold text-gray-800">
      {r.program_name}
    </p>
    <p className="text-xs text-gray-500">
      Reward Program
    </p>
  </div>

  <div className="flex items-center gap-3">
    <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      Active
    </span>

    <button
      onClick={() => deleteProgram(r.id)}
      className="text-red-400 hover:text-red-600 transition"
    >
      <Trash2 size={18} />
    </button>
  </div>
</div>

              <div className="text-2xl font-bold text-gray-900">
                {r.points_balance}
                <span className="text-sm text-gray-500 ml-1">
                  pts
                </span>
              </div>

              <div className="text-sm text-gray-600">
                Value:
                <span className="font-semibold text-blue-600 ml-1">
                  {Number(r.converted_value || 0).toFixed(2)} {r.currency}
                </span>
              </div>

              {/* FIXED ALIGNMENT SECTION */}
              <div className="flex items-center gap-3 w-full">
                <input
                  type="number"
                  placeholder="Add points"
                  value={pointsDraft[r.id] || ""}
                  onChange={(e) =>
                    setPointsDraft((prev) => ({
                      ...prev,
                      [r.id]: e.target.value,
                    }))
                  }
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <button
                  onClick={() => addPoints(r.id)}
                  className="w-24 shrink-0 bg-[#A2D2FF] hover:bg-[#8ec7ff] transition rounded-lg py-2 font-medium"
                >
                  Update
                </button>
              </div>

              <p className="text-xs text-gray-400">
                Last updated:{" "}
                {new Date(r.last_updated).toLocaleDateString()}
              </p>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
