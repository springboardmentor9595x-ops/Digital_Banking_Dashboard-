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

    // Update cards
    document.getElementById("total-balance").innerText = "₹ " + totalBalance;
    document.getElementById("total-income").innerText = "₹ " + totalIncome;
    document.getElementById("total-expenses").innerText = "₹ " + totalExpenses;

    // Render chart
    renderIncomeExpenseChart(totalIncome, totalExpenses);
})
.catch(err => console.error("Dashboard summary error:", err));


// ================= ACCOUNTS =================
fetch(`${BASE_URL}/accounts/`, {
    headers: authHeaders()
})
.then(res => res.json())
.then(accounts => {
    const ul = document.getElementById("accounts");
    ul.innerHTML = "";

    accounts.forEach(a => {
        ul.innerHTML += `
            <li>${a.bank_name} (${a.account_type}) — ₹ ${a.balance}</li>
        `;
    });
})
.catch(err => console.error("Accounts load error:", err));


// ================= RECENT TRANSACTIONS =================
fetch(`${BASE_URL}/transactions/dashboard`, {
    headers: authHeaders()
})
.then(res => res.json())
.then(data => {
    const tbody = document.getElementById("recent-transactions");
    tbody.innerHTML = "";

    const recentTransactions = data.recent_transactions || [];

    recentTransactions.forEach(tx => {
        tbody.innerHTML += `
            <tr>
                <td>${new Date(tx.date).toLocaleString()}</td>
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
                label: "Amount (₹)",
                data: [income, expense],
                backgroundColor: ["#28a745", "#dc3545"]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}


// ================= BUDGET SUMMARY (NEW ✅) =================
async function loadBudgetSummary() {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`${BASE_URL}/budgets/`, {
            headers: authHeaders()
        });

        if (!res.ok) return;

        const budgets = await res.json();

        const totalBudgets = budgets.length;
        const overBudgets = budgets.filter(b => b.over_budget).length;

        document.getElementById("total-budgets").innerText = totalBudgets;
        document.getElementById("over-budget-count").innerText = overBudgets;

        const alertEl = document.getElementById("budget-alert");

        if (overBudgets > 0) {
            alertEl.innerText = "⚠ Budget exceeded!";
            alertEl.style.color = "red";
            alertEl.style.fontWeight = "bold";
        } else {
            alertEl.innerText = "All budgets within limit 👍";
            alertEl.style.color = "green";
            alertEl.style.fontWeight = "bold";
        }

    } catch (err) {
        console.error("Budget summary error:", err);
    }
}

// ================= INIT =================
loadBudgetSummary();
