const BASE_URL = "http://127.0.0.1:8000";
const token = localStorage.getItem("access_token");

/* ===============================
   Animated Counter
================================= */
function animateCounter(elementId, target) {
    let count = 0;
    const step = Math.ceil(target / 50);
    const el = document.getElementById(elementId);

    const interval = setInterval(() => {
        count += step;
        if (count >= target) {
            count = target;
            clearInterval(interval);
        }
        el.innerText = count;
    }, 20);
}

/* ===============================
   Load Rewards
================================= */
async function loadRewards() {
    try {
        const res = await fetch(`${BASE_URL}/rewards/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const rewards = await res.json();
        const grid = document.getElementById("rewardsGrid");
        grid.innerHTML = "";

        let totalPoints = 0;

        const currency = document.getElementById("currencySelector").value;

        const rates = {
            INR: 1,
            USD: 83,
            EUR: 90
        };

        const rate = rates[currency];

        let symbol = "₹";
        if (currency === "USD") symbol = "$";
        if (currency === "EUR") symbol = "€";

        rewards.forEach(r => {
            totalPoints += r.points_balance;

            /* ===== EXPIRATION TRACKING (365 days mock) ===== */
            let expiryText = "";
            if (r.last_updated) {
                const last = new Date(r.last_updated);
                const expiry = new Date(last);
                expiry.setDate(expiry.getDate() + 365);

                const today = new Date();
                const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

                if (diff > 0) {
                    expiryText = `⏳ Expires in ${diff} days`;
                } else {
                    expiryText = "❌ Expired";
                }
            }

            // Convert value for selected currency
            let convertedValue = (r.points_balance / rate).toFixed(2);

            /* ===== CARD UI ===== */
            grid.innerHTML += `
                <div class="reward-card">
                    <div class="card-header">
                        <h4>🪙 ${r.program_name}</h4>
                    </div>

                    <div class="points">${symbol} ${convertedValue}</div>

                    <small class="updated">
                        Updated: ${new Date(r.last_updated).toLocaleString()}
                    </small>

                    <p class="expiry">${expiryText}</p>

                    <div class="card-actions">
                        <button class="update-btn"
                            onclick="updateReward(${r.id})">
                            Update
                        </button>
                    </div>
                </div>
            `;
        });

        animateCounter("totalPointsDisplay", totalPoints);
        updateTierSystem(totalPoints);
        updateStats(rewards, totalPoints);
        updateCurrencySummary(totalPoints);

    } catch (err) {
        alert("Failed to load rewards.");
    }
}

/* ===============================
   Tier System
================================= */
function updateTierSystem(points) {
    const tierLabel = document.getElementById("tierLabel");
    const tierFill = document.getElementById("tierProgressFill");
    const tierText = document.getElementById("tierProgressText");

    let tier = "Silver";
    let nextTier = "Gold";
    let progress = points / 500;

    if (points >= 1000) {
        tier = "Platinum";
        nextTier = "Max Tier";
        progress = 1;
    } else if (points >= 500) {
        tier = "Gold";
        nextTier = "Platinum";
        progress = (points - 500) / 500;
    }

    tierLabel.innerText = `${tier} Member`;
    tierFill.style.width = Math.min(progress * 100, 100) + "%";
    tierText.innerText = `Progress to ${nextTier}`;
}

/* ===============================
   Stats Strip
================================= */
function updateStats(rewards, totalPoints) {
    const activePrograms = rewards.filter(r => r.points_balance > 0).length;

    let topProgram = "-";
    let maxPoints = 0;

    rewards.forEach(r => {
        if (r.points_balance > maxPoints) {
            maxPoints = r.points_balance;
            topProgram = r.program_name;
        }
    });

    document.getElementById("activePrograms").innerText = activePrograms;
    document.getElementById("topProgram").innerText = topProgram;

    let performance = "⭐ Average";
    if (totalPoints >= 1000) performance = "🏆 Excellent";
    else if (totalPoints >= 500) performance = "🔥 Strong";
    else if (totalPoints >= 200) performance = "⭐ Good";

    document.getElementById("performanceBadge").innerText = performance;
}

/* ===============================
   Currency Summary
================================= */
function updateCurrencySummary(totalPoints) {
    const currency = document.getElementById("currencySelector").value;

    const rates = {
        INR: 1,
        USD: 83,
        EUR: 90
    };

    const rate = rates[currency];

    let converted = (totalPoints / rate).toFixed(2);

    let symbol = "₹";
    if (currency === "USD") symbol = "$";
    if (currency === "EUR") symbol = "€";

    document.getElementById("currencySummary").innerText =
        `${symbol} ${converted}`;
}

/* ===============================
   Update Reward
================================= */
async function updateReward(id) {
    const newPoints = prompt("Enter new points:");

    if (!newPoints) return;

    await fetch(`${BASE_URL}/rewards/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ points_balance: Number(newPoints) })
    });

    loadRewards();
}

/* ===============================
   Add Reward
================================= */
async function addRewardProgram() {
    const name = document.getElementById("programName").value;
    const points = document.getElementById("pointsInput").value;

    if (!name || !points) return alert("Fill all fields");

    await fetch(`${BASE_URL}/rewards/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            program_name: name,
            points_balance: Number(points)
        })
    });

    loadRewards();
}

/* ===============================
   Currency Dropdown Auto Refresh
================================= */
document.getElementById("currencySelector")
    .addEventListener("change", loadRewards);

document.addEventListener("DOMContentLoaded", loadRewards);
