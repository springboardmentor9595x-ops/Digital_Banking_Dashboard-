document.addEventListener("DOMContentLoaded", loadAlerts);

async function loadAlerts() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/alerts/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch alerts");
        }

        const alerts = await response.json();

        const container = document.getElementById("alertsContainer");
        container.innerHTML = "";

        if (!alerts.length) {
            container.innerHTML = `
                <div style="background:white;padding:30px;border-radius:12px;text-align:center;
                box-shadow:0 6px 18px rgba(0,0,0,0.08);">
                    <h3 style="margin-bottom:8px;">🎉 No Alerts</h3>
                    <p style="color:#6b7280;">You're all good! No financial warnings at the moment.</p>
                </div>
            `;
            return;
        }

        alerts.forEach(alert => {
            const card = document.createElement("div");

            let alertClass = "alert-blue";
            let badgeClass = "badge-balance";
            let badgeText = "Low Balance";

            if (alert.alert_type === "budget_exceeded") {
                alertClass = "alert-red";
                badgeClass = "badge-budget";
                badgeText = "Budget Exceeded";
            } 
            else if (alert.alert_type === "bill_due") {
                alertClass = "alert-orange";
                badgeClass = "badge-bill";
                badgeText = "Bill Due";
            } 
            else if (alert.alert_type === "low_balance") {
                alertClass = "alert-blue";
                badgeClass = "badge-balance";
                badgeText = "Low Balance";
            }

            card.className = `alert-card ${alertClass}`;

            card.innerHTML = `
                <div class="alert-content">
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">
                        ${new Date(alert.created_at).toLocaleString()}
                    </div>
                </div>

                <div class="alert-badge ${badgeClass}">
                    ${badgeText}
                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading alerts:", error);
    }
}
