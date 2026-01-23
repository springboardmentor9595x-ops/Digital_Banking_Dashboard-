console.log("budgets.js loaded");

const token = localStorage.getItem("access_token");

if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
}

/* ================= CREATE BUDGET ================= */
async function createBudget() {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const category = document.getElementById("category").value;
    const limit = document.getElementById("limit").value;
    const msg = document.getElementById("msg");

    msg.innerText = "";

    // ✅ FRONTEND VALIDATION
    if (!month || !year || !category || !limit) {
        msg.style.color = "red";
        msg.innerText = "❌ All fields are required";
        return;
    }

    if (Number(limit) <= 0) {
        msg.style.color = "red";
        msg.innerText = "❌ Limit must be greater than 0";
        return;
    }

    try {
        const url = `${BASE_URL}/budgets/?month=${month}&year=${year}&category=${encodeURIComponent(
            category
        )}&limit_amount=${Number(limit)}`;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Budget already exists");
        }

        msg.style.color = "green";
        msg.innerText = "✅ Budget created successfully";

        // Clear inputs
        document.getElementById("limit").value = "";
        document.getElementById("category").value = "";

        loadBudgets();

    } catch (err) {
        msg.style.color = "red";
        msg.innerText = err.message;
    }
}


/* ================= LOAD BUDGETS ================= */
async function loadBudgets() {
    try {
        const res = await fetch(`${BASE_URL}/budgets/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Failed to load budgets");
        }

        const budgets = await res.json();
        const table = document.getElementById("budget-table");

        table.innerHTML = "";

        budgets.forEach(b => {
            const spent = b.spent_amount || 0;
            const limit = b.limit_amount;

            let percent = (spent / limit) * 100;
            percent = percent > 100 ? 100 : percent;

            const status =
                b.over_budget
                    ? "<span class='status overdue'>Over Budget</span>"
                    : "<span class='status upcoming'>Within Limit</span>";

            const rowClass = b.over_budget ? "over" : "";

            table.innerHTML += `
                <tr class="${rowClass}">
                    <td>${b.category}</td>
                    <td>${b.month}/${b.year}</td>
                    <td>₹ ${limit}</td>
                    <td>₹ ${spent}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${percent}%"></div>
                        </div>
                        <small>${Math.round(percent)}%</small>
                    </td>
                    <td>${status}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Load budgets failed:", err);
    }
}

/* ================= INIT ================= */
loadBudgets();
