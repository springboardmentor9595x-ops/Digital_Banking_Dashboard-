const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "login.html";
}

async function loadInsights() {
    try {
        const res = await fetch("http://127.0.0.1:8000/insights/", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        // =========================
        // CASHFLOW
        // =========================
        const income = data.cashflow?.total_credits || 0;
        const expense = data.cashflow?.total_debits || 0;
        const savings = income - expense;
        const rate = income > 0
            ? ((savings / income) * 100).toFixed(1)
            : 0;

        const incomeEl = document.getElementById("insight-income");
        const expenseEl = document.getElementById("insight-expense");
        const savingsEl = document.getElementById("insight-savings");
        const rateEl = document.getElementById("insight-rate");

        incomeEl.innerText = "₹ " + income.toFixed(2);
        expenseEl.innerText = "₹ " + expense.toFixed(2);
        savingsEl.innerText =
            savings >= 0 ? "₹ " + savings.toFixed(2)
                         : "- ₹ " + Math.abs(savings).toFixed(2);
        rateEl.innerText = rate + "%";

        // Professional color logic
        if (savings > 0) {
            savingsEl.style.color = "#16a34a";
            rateEl.style.color = "#16a34a";
        } else if (savings < 0) {
            savingsEl.style.color = "#dc2626";
            rateEl.style.color = "#dc2626";
        } else {
            savingsEl.style.color = "#f59e0b";
            rateEl.style.color = "#f59e0b";
        }

        // =========================
        // CATEGORY SPENDING CHART
        // =========================
        const categories = data.category_summary || [];
        const categoryLabels = categories.map(c => c.category || "Other");
        const categoryTotals = categories.map(c => c.total || 0);

        if (categoryLabels.length > 0) {
            new Chart(document.getElementById("categoryChart"), {
                type: "doughnut",
                data: {
                    labels: categoryLabels,
                    datasets: [{
                        data: categoryTotals,
                        backgroundColor: [
                            "#3b82f6",
                            "#ef4444",
                            "#10b981",
                            "#f59e0b",
                            "#6366f1",
                            "#ec4899"
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: "bottom" }
                    }
                }
            });
        }
        // =========================
        // TOP SPENDING CATEGORY
        // =========================
        const topCategoryEl = document.getElementById("top-category");

        if (topCategoryEl) {
            if (categories.length > 0) {

                const sorted = [...categories]
                    .sort((a, b) => b.total - a.total);

                const topCategory = sorted[0];

                topCategoryEl.innerText =
                    topCategory.category + " (₹ " + topCategory.total.toFixed(2) + ")";
            } else {
                topCategoryEl.innerText = "No data";
            }
        }

        // =========================
        // TOP MERCHANTS
        // =========================
        const merchantDiv = document.getElementById("merchantList");
        merchantDiv.innerHTML = "";
        const merchants = data.top_merchants || [];

        if (merchants.length === 0) {
            merchantDiv.innerHTML =
                "<p style='color:#64748b;'>No merchant data available.</p>";
        } else {

            const maxValue = Math.max(...merchants.map(m => m.total || 0), 1);

            merchants.forEach((m) => {
                const amount = m.total || 0;
                const percentage = (amount / maxValue) * 100;

                merchantDiv.innerHTML += `
                    <div class="merchant-item">
                        <div class="merchant-header">
                            <span>${m.merchant || "Unknown"}</span>
                            <strong>₹ ${amount.toFixed(2)}</strong>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${percentage}%"></div>
                        </div>
                    </div>
                `;
            });
        }

        // =========================
        // INCOME VS EXPENSE BAR
        // =========================
        new Chart(document.getElementById("compareChart"), {
            type: "bar",
            data: {
                labels: ["Income", "Expense"],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ["#16a34a", "#dc2626"]
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });

        // =========================
        // =========================
        // FINANCIAL HEALTH SCORE (BALANCED SCALE)
        // =========================
        const healthCanvas = document.getElementById("healthChart");

        if (healthCanvas) {

            let healthScore = 0;

            if (income > 0) {

                const savings = income - expense;
                const savingsRatio = savings / income;

                // Convert ratio (-∞ to 1) into 0–100 scale
                healthScore = 50 + (savingsRatio * 50);

                // Clamp between 0 and 100
                healthScore = Math.max(0, Math.min(100, healthScore));
            }

            healthScore = Math.round(healthScore);

            const centerTextPlugin = {
                id: "centerText",
                beforeDraw(chart) {
                    const { width, height } = chart;
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.font = "bold 24px Segoe UI";
                    ctx.fillStyle = "#1e293b";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        healthScore + "%",
                        width / 2,
                        height / 2
                    );
                }
            };

            new Chart(healthCanvas, {
                type: "doughnut",
                data: {
                    labels: ["Health", "Remaining"],
                    datasets: [{
                        data: [healthScore, 100 - healthScore],
                        backgroundColor: ["#16a34a", "#e5e7eb"],
                        borderWidth: 0
                    }]
                },
                options: {
                    cutout: "75%",
                    plugins: { legend: { display: false } }
                },
                plugins: [centerTextPlugin]
            });
        }

        // =========================
        // MONTHLY TREND
        // =========================
        new Chart(document.getElementById("trendChart"), {
            type: "line",
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: "Spending Trend",
                    data: categoryTotals,
                    borderColor: "#2563eb",
                    backgroundColor: "rgba(37,99,235,0.15)",
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });

        // =========================
        // SMART INSIGHT MESSAGE
        // =========================
        const insightBox = document.getElementById("smartInsight");

        if (income === 0 && expense === 0) {
            insightBox.className = "insight-box warning";
            insightBox.innerText =
                "📊 Add transactions to unlock detailed financial insights.";
        } else if (savings > 0) {
            insightBox.className = "insight-box good";
            insightBox.innerText =
                "✅ Excellent performance! You maintained positive savings.";
        } else if (savings === 0) {
            insightBox.className = "insight-box warning";
            insightBox.innerText =
                "⚠ You're breaking even. Small adjustments can improve savings.";
        } else {
            insightBox.className = "insight-box danger";
            insightBox.innerText =
                "🚨 Expenses exceed income. Immediate financial review recommended.";
        }

    } catch (err) {
        console.log("Insights load error:", err);
    }
}
/* =====================================
   Yearly Spending Trend (Based on Transactions)
===================================== */

let yearlyChart = null;

async function loadYearlyTrend(year) {
    try {
        const res = await fetch("http://127.0.0.1:8000/transactions/", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const transactions = await res.json();

        const monthlyData = new Array(12).fill(0);

        transactions.forEach(t => {

            const date = new Date(
                t.transaction_date || 
                t.date || 
                t.created_at
            );

            const isExpense = t.from_account_id !== null;

            if (
                date.getFullYear() == year &&
                isExpense
            ) {
                monthlyData[date.getMonth()] += t.amount;
            }
        });


        renderYearlyChart(monthlyData, year);

    } catch (err) {
        console.log("Yearly trend error:", err);
    }
}

function renderYearlyChart(monthlyData, year) {

    const canvas = document.getElementById("yearlyTrendChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (yearlyChart) {
        yearlyChart.destroy();
    }

    yearlyChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [
                "Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"
            ],
            datasets: [{
                label: `Spending in ${year}`,
                data: monthlyData,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.15)",
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/* Dropdown trigger */
document.addEventListener("DOMContentLoaded", function() {
    const selector = document.getElementById("yearSelector");
    if (!selector) return;

    loadYearlyTrend(selector.value);

    selector.addEventListener("change", function() {
        loadYearlyTrend(this.value);
    });
});

/* =========================
   EXPORT INSIGHTS
========================= */
function exportInsights() {

    const element = document.querySelector(".insights-container");

    html2canvas(element).then(canvas => {

        const link = document.createElement("a");
        link.download = "Financial_Insights_Report.png";
        link.href = canvas.toDataURL("image/png");
        link.click();

    });
}

loadInsights();
