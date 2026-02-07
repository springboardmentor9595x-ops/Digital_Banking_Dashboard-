const BASE_URL = "http://127.0.0.1:8000";
const token = localStorage.getItem("access_token");

document.addEventListener("DOMContentLoaded", () => {
  loadRewards();
});

async function loadRewards() {
  try {
    const res = await fetch(`${BASE_URL}/rewards/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      throw new Error("Unauthorized");
    }

    const rewards = await res.json();
    const table = document.getElementById("rewardsTable");

    if (!table) return;

    table.innerHTML = "";

    rewards.forEach(r => {
      table.innerHTML += `
        <tr>
          <td style="padding: 12px; text-align: left;">
            ${r.program_name}
          </td>
          <td style="padding: 12px; text-align: center;">
            ${r.points_balance}
          </td>
          <td style="padding: 12px; text-align: center;">
            ${new Date(r.last_updated).toLocaleString()}
          </td>
          <td style="padding: 12px; text-align: center;">
            <button
              onclick="convertReward(${r.id}, '${r.program_name}')"
              style="padding: 6px 12px; cursor: pointer;"
            >
              Convert
            </button>
          </td>
        </tr>
      `;
    });

  } catch (error) {
    console.error(error);
    alert("Unable to load rewards. Please login again.");
  }
}

async function convertReward(rewardId, programName) {
  try {
    const res = await fetch(
      `${BASE_URL}/rewards/${rewardId}/convert?currency=INR`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      throw new Error("Conversion failed");
    }

    const data = await res.json();

    // Debug: see exact backend response
    console.log("Conversion response:", data);

    // Read converted value safely
    const convertedValue =
      data.converted_amount ??
      data.converted_value ??
      data.converted_points ??
      data.amount ??
      data.value;

    document.getElementById("currencySummary").innerHTML = `
      <p><strong>${programName}</strong></p>
      <p>Converted Value: ₹ ${convertedValue}</p>
    `;

  } catch (error) {
    console.error(error);
    alert("Currency conversion failed");
  }
}
