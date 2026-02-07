console.log("budgets.js loaded");

const token = localStorage.getItem("access_token");

if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
}

/* ================= TOAST HELPER ================= */
function showToast(message, type = "error") {
    const toast = document.createElement("div");
    toast.innerText = message;

    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "12px 16px";
    toast.style.borderRadius = "6px";
    toast.style.color = "#fff";
    toast.style.fontWeight = "500";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
    toast.style.background =
        type === "error" ? "#dc3545" : "#28a745";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/* ================= CREATE BUDGET ================= */
async function createBudget() {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;
    const category = document.getElementById("category").value;
    const limit = document.getElementById("limit").value;
    const dueDate = document.getElementById("due-date").value;
    const msg = document.getElementById("msg");

    msg.innerText = "";

    if (!month || !year || !category || !limit || !dueDate) {
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
        const res = await fetch(
            `${BASE_URL}/budgets/?month=${month}&year=${year}&category=${encodeURIComponent(
                category
            )}&limit_amount=${Number(limit)}&due_date=${dueDate}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed");

        msg.style.color = "green";
        msg.innerText = "✅ Budget created successfully";

        document.getElementById("limit").value = "";
        document.getElementById("category").value = "";
        document.getElementById("due-date").value = "";

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
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load budgets");

        const budgets = await res.json();
        console.log("Budgets from backend:", budgets);


        const table = document.getElementById("budget-table");
        table.innerHTML = "";

        budgets.forEach(b => {
            // ✅ FRONTEND FIX: calculate progress properly
            const spent = Number(b.spent || 0);
            const limit = Number(b.limit || b.limit_amount || 0);

            const percent =
                limit > 0
                    ? Math.min((spent / limit) * 100, 100)
                    : 0;

            table.innerHTML += `
                <tr>
                    <td>${b.category}</td>
                    <td>${b.month}/${b.year}</td>


                    <!-- LIMIT + DUE DATE (NO DASH, NO LABEL) -->
                    <td>
                        ₹ ${b.limit}
                        ${
                            b.due_date
                                ? `<br><small style="color:#666;">${b.due_date}</small>`
                                : ""
                        }
                    </td>

                    <td>₹ ${b.spent}</td>

                    <td>
                        <div class="progress-bar">
                            <div
                                class="progress-fill"
                                style="width:${percent.toFixed(0)}%"
                            ></div>
                        </div>
                        <small>
                            ₹ ${spent} / ₹ ${limit} (${percent.toFixed(0)}%)
                        </small> 
                    </td>


                    <td>
                        <span class="${
                            b.status === "Exceeded"
                                ? "status overdue"
                                : "status upcoming"
                        }">
                            ${b.status}
                        </span>
                    </td>

                    <td>
                        <button onclick="editBudget(${b.id}, '${b.category}', ${b.limit})">
                            Edit
                        </button>

                        <button
                            onclick="deleteBudget(${b.id})"
                            style="margin-left:8px; background:#dc3545; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;"
                        >
                            Delete
                        </button>
                    </td>

                </tr>
            `;
        });
    } catch (err) {
        console.error("Load budgets failed:", err);
    }
}

/* ================= EDIT BUDGET (FIXED) ================= */
async function editBudget(id, category, limit) {
    const newLimit = prompt("Enter new limit:", limit);

    if (!newLimit || isNaN(newLimit) || Number(newLimit) <= 0) {
        alert("❌ Invalid limit");
        return;
    }

    try {
        const res = await fetch(
            `${BASE_URL}/budgets/${id}?category=${encodeURIComponent(category)}&limit_amount=${Number(newLimit)}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await res.json();

        if (!res.ok) {
            let message = "Failed to update budget";

            if (typeof data.detail === "string") {
                message = data.detail;
            }

            throw new Error(message);
        }

        // ✅ Reload updated values
        await loadBudgets();

    } catch (err) {
        alert("❌ " + err.message);
        console.error("Edit budget error:", err);
    }
}
/* ================= DELETE BUDGET ================= */
async function deleteBudget(budgetId) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this budget?"
    );

    if (!confirmDelete) return;

    try {
        const res = await fetch(
            `${BASE_URL}/budgets/${budgetId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!res.ok) {
            throw new Error("Failed to delete budget");
        }

        showToast("✅ Budget deleted successfully", "success");

        // 🔄 Reload budgets safely
        loadBudgets();

    } catch (err) {
        console.error("Delete budget error:", err);
        showToast("❌ Unable to delete budget");
    }
}

/* ================= INIT ================= */
/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {

    // 🔄 FORCE refresh if coming from transaction page
    if (localStorage.getItem("refreshBudgets") === "true") {
        localStorage.removeItem("refreshBudgets");
    }

    loadBudgets();
});
