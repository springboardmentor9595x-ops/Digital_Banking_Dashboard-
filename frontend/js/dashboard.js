// ================= AUTH CHECK =================
if (!getToken()) {
    window.location.href = "login.html";
}

// ================= DASHBOARD SUMMARY + CHART =================
fetch(`${BASE_URL}/transactions/dashboard/summary`, {
    headers: authHeaders()
})
.then(res => res.json())
.then(data => {
    const totalBalance = data.total_balance || 0;
    const totalIncome = data.total_income || 0;
    const totalExpenses = data.total_expenses || 0;

    document.getElementById("total-balance").innerText = "₹ " + totalBalance;
    document.getElementById("total-income").innerText = "₹ " + totalIncome;
    document.getElementById("total-expenses").innerText = "₹ " + totalExpenses;

    renderIncomeExpenseChart(totalIncome, totalExpenses);
})
.catch(err => console.error("Dashboard summary error:", err));


// ================= ACCOUNTS =================
fetch(`${BASE_URL}/accounts/`, {
    headers: authHeaders()
})
.then(res => {
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
})
.then(accounts => {
    const ul = document.getElementById("accounts-list");

    let total = 0; // ✅ MUST be here

    if (ul) {
        ul.innerHTML = "";

        accounts.forEach(a => {
            total += a.balance;
            ul.innerHTML += `
                <li>${a.bank_name} (${a.account_type}) — ₹ ${a.balance}</li>
            `;
        });
    }

    const totalEl = document.getElementById("total-balance");
    if (totalEl) {
        totalEl.innerText = `₹ ${total}`;
    }
})
.catch(err => console.error("Accounts load error:", err));


// ================= RECENT TRANSACTIONS =================
// ================= RECENT TRANSACTIONS =================
fetch(`${BASE_URL}/transactions/dashboard`, {
    headers: authHeaders(),
    cache: "no-store"
})
.then(res => res.json())
.then(data => {
    const tbody = document.getElementById("recent-transactions");
    if (!tbody) return;

    tbody.innerHTML = "";

    let recentTransactions = data.recent_transactions || [];

    // ✅ SORT BY DATE (LATEST FIRST)
    recentTransactions.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date);
        const dateB = new Date(b.created_at || b.date);
        return dateB - dateA;
    });

    // ✅ TAKE ONLY LATEST 5 TRANSACTIONS
    recentTransactions = recentTransactions.slice(0, 5);

    recentTransactions.forEach(tx => {
        tbody.innerHTML += `
            <tr>
                <td>
                    ${
                        tx.created_at
                            ? new Date(tx.created_at).toLocaleString()
                            : tx.date
                            ? new Date(tx.date).toLocaleString()
                            : "—"
                    }
                </td>
                <td>${tx.description || "-"}</td>
                <td>₹ ${tx.amount}</td>
            </tr>
        `;
    });
})
.catch(err => console.error("Recent transactions error:", err));

// ================= CHART FUNCTION =================
function renderIncomeExpenseChart(income, expense) {
    const canvas = document.getElementById("incomeExpenseChart");
    if (!canvas) return;

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["Income", "Expense"],
            datasets: [{
                data: [income, expense],
                backgroundColor: ["#28a745", "#dc3545"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}


// ================= BUDGET SUMMARY =================
// ================= BUDGET SUMMARY =================
async function loadBudgetSummary() {
    try {
        const res = await fetch(`${BASE_URL}/budgets/`, {
            headers: authHeaders()
        });

        if (!res.ok) return;

        const budgets = await res.json();

        const exceededBudgets = budgets.filter(
            b => b.status === "Exceeded"
        );

        // ✅ DO NOT BREAK EXISTING COUNTS
        document.getElementById("total-budgets").innerText = budgets.length;
        document.getElementById("over-budget-count").innerText = exceededBudgets.length;

        // 🚨 POPUP ELEMENTS
        const modal = document.getElementById("budgetAlertModal");
        const messageEl = document.getElementById("budgetAlertMessage");
        if (!modal || !messageEl) return;

        // ✅ previously acknowledged budgets
        const acknowledged = JSON.parse(
            sessionStorage.getItem("acknowledgedBudgets") || "[]"
        );

        // ✅ show ONLY budgets that are newly exceeded
        const newExceeded = exceededBudgets.filter(b => {
            const key = `${b.category}-${b.month}-${b.year}`;
            return !acknowledged.includes(key);
        });

        if (newExceeded.length > 0) {

            const keys = newExceeded.map(
                b => `${b.category}-${b.month}-${b.year}`
            );

            const message = newExceeded
                .map(b => `${b.category} (${b.month}/${b.year})`)
                .join(", ");

            const popupKey = "shown_budget_popup_" + keys.join("_");

            // ✅ SHOW ONLY IF NOT SHOWN BEFORE
            if (!localStorage.getItem(popupKey)) {

                messageEl.innerText =
                    `You have exceeded the budget for: ${message}`;

                modal.style.display = "block";

                localStorage.setItem(popupKey, "true");
            }

        } else {
            modal.style.display = "none";
        }

    } catch (err) {
        console.error("Budget summary error:", err);
    }
}


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

    setTimeout(() => toast.remove(), 4000);
}

// ================= TOGGLE ACCOUNT FORM =================
function toggleAccountForm() {
    const form = document.getElementById("account-form");
    form.style.display = form.style.display === "none" ? "block" : "none";
}


// ================= CREATE ACCOUNT =================
function submitAccount() {
    const bankName = document.getElementById("bank-name").value;
    const accountType = document.getElementById("account-type").value;
    const balance = document.getElementById("account-balance").value;
    const currency = document.getElementById("account-currency").value;

    if (!bankName || !balance) {
        alert("Please fill all required fields");
        return;
    }

    fetch(`${BASE_URL}/accounts/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            bank_name: bankName,
            account_type: accountType,
            balance: Number(balance),
            currency: currency
        })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => {
                throw new Error(err.detail || "Account creation failed");
            });
        }
        return res.json();
    })
    .then(() => {
        alert("Account added successfully ✅");
        location.reload();
    })
    .catch(err => {
        alert(err.message);
        console.error(err);
    });
}
function acknowledgeBudgetAlert() {
    const modal = document.getElementById("budgetAlertModal");
    if (modal) modal.style.display = "none";

    // budgets that were JUST shown
    const lastShown = JSON.parse(
        sessionStorage.getItem("lastShownBudgets") || "[]"
    );

    // budgets already acknowledged earlier
    const acknowledged = JSON.parse(
        sessionStorage.getItem("acknowledgedBudgets") || "[]"
    );

    // merge + remove duplicates
    const updated = Array.from(
        new Set([...acknowledged, ...lastShown])
    );

    sessionStorage.setItem(
        "acknowledgedBudgets",
        JSON.stringify(updated)
    );

    // 🔔 SAVE BUDGET ALERTS TO NOTIFICATIONS
    lastShown.forEach(key => {
        addNotification(
            `📊 Budget Exceeded: ${key.replace(/-/g, " ")}`,
            "budget",
            `budget-${key}`
        );
    });

    // cleanup
    sessionStorage.removeItem("lastShownBudgets");

    // refresh bell badge safely
    if (typeof refreshNotifications === "function") {
        refreshNotifications();
    }
}

async function loadProfileEmail() {
    try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: authHeaders()
        });

        if (!res.ok) return;

        const user = await res.json();

        const nameEl = document.querySelector(".profile-name");
        const emailEl = document.querySelector(".profile-email");

        if (nameEl) nameEl.innerText = "Welcome";
        if (emailEl) emailEl.innerText = user.email;

    } catch (err) {
        console.error("Profile email load failed", err);
    }
}
async function syncBillNotificationsWithBackend() {
    try {
        const token = localStorage.getItem("access_token");

        const res = await fetch(`${BASE_URL}/bills/`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) return;

        const bills = await res.json();
        const activeBillIds = bills
            .filter(b => b.status === "due" || b.status === "upcoming")
            .map(b => b.id);

        let notifications = getNotifications();

        // ❌ REMOVE notifications for PAID bills
        notifications = notifications.filter(n => {
            if (n.type !== "bill") return true;

            const match = n.key?.match(/bill-(\d+)-/);
            if (!match) return true;

            const billId = Number(match[1]);
            return activeBillIds.includes(billId);
        });

        localStorage.setItem("notifications", JSON.stringify(notifications));

    } catch (err) {
        console.error("Bill sync failed", err);
    }
}

// ==========================
// BILL POPUP ON DASHBOARD (SINGLE SOURCE OF TRUTH)
// ==========================
document.addEventListener("DOMContentLoaded", () => {

    const notifications = getNotifications();

    const billAlerts = notifications.filter(
        n => n.type === "bill" && !n.shown
    );

    if (billAlerts.length === 0) return;

    const message = billAlerts
        .map(n => `• ${n.message}`)
        .join("\n");

    alert(`🔔 Bill Reminder\n\n${message}`);

    // mark popup shown but keep unread for bell
    billAlerts.forEach(n => {
        n.shown = true;
        n.read = false;
    });

    localStorage.setItem("notifications", JSON.stringify(notifications));

    if (typeof refreshNotifications === "function") {
        refreshNotifications();
    }
});
// ==========================
// BILL POPUP ON DASHBOARD (DUE + UPCOMING)
// ==========================
document.addEventListener("DOMContentLoaded", () => {

    const notifications = getNotifications();

    // take ALL bill notifications that were not shown yet
    const cameFromBills = sessionStorage.getItem("fromBillsPage") === "true";

    const billAlerts = notifications.filter(
        n =>
            n.type === "bill" &&
            (cameFromBills || !n.shown)
    );


    if (billAlerts.length === 0) return;

    const message = billAlerts
        .map(n => `• ${n.message}`)
        .join("\n");

    alert(`🔔 Bill Reminder\n\n${message}`);
    // clear bills navigation flag
    sessionStorage.removeItem("fromBillsPage");

    // 👇 after OK
    billAlerts.forEach(n => {
        n.shown = true;   // popup will not repeat
        n.read = false;  // stays unread in bell
    });

    localStorage.setItem("notifications", JSON.stringify(notifications));

    if (typeof refreshNotifications === "function") {
        refreshNotifications();
    }
});
// ==========================
// RESET BILL POPUP WHEN COMING FROM BILLS PAGE
// ==========================
(function handleBillsReturn() {
    const fromBills = sessionStorage.getItem("fromBillsPage");

    if (!fromBills) return;

    let notifications = getNotifications();

    notifications.forEach(n => {
        if (n.type === "bill") {
            n.shown = false; // 👈 allow popup again
        }
    });

    localStorage.setItem("notifications", JSON.stringify(notifications));

    // clear flag so it runs ONLY once
    sessionStorage.removeItem("fromBillsPage");
})();
async function checkAlerts() {
    const token = localStorage.getItem("token");

    const res = await fetch("http://127.0.0.1:8000/alerts/", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const alerts = await res.json();

    const budgetAlert = alerts.find(
        a => a.alert_type === "budget_exceeded" && a.read_status === false
    );

   if (budgetAlert) {

        const alertKey = "shown_alert_" + budgetAlert.id;

        // ✅ show popup only once
        if (!localStorage.getItem(alertKey)) {
            showPopup(budgetAlert.message);
            localStorage.setItem(alertKey, "true");
        }

        // mark as read in backend
        await fetch(`http://127.0.0.1:8000/alerts/${budgetAlert.id}/read`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token
            }
        });
    }

}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    syncBillNotificationsWithBackend()
        .then(() => {
            loadBudgetSummary();
            loadProfileEmail();
        })
        .catch(err => console.error(err));
});
