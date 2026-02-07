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

            messageEl.innerText =
                `You have exceeded the budget for: ${message}`;

            // 🔑 SAVE what we are showing NOW
            sessionStorage.setItem(
                "lastShownBudgets",
                JSON.stringify(keys)
            );

            modal.style.display = "block";
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

    // cleanup
    sessionStorage.removeItem("lastShownBudgets");
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

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    loadBudgetSummary();
    loadProfileEmail(); // 👈 ADD ONLY THIS LINE
});
