// ==========================
// LOAD BILLS ON PAGE LOAD
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    loadBills();
});

// ==========================
// LOAD BILLS
// ==========================
async function loadBills() {
    try {
        const token = localStorage.getItem("access_token");

        const res = await fetch(`${BASE_URL}/bills/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) return;

        const bills = await res.json();
        const table = document.getElementById("bill-table");
        table.innerHTML = "";

        // ==========================
        // RENDER BILL TABLE (DO NOT TOUCH)
        // ==========================
        bills.forEach(bill => {
            const row = document.createElement("tr");

            let actionBtn =
                bill.status !== "paid"
                    ? `<button onclick="markPaid(${bill.id})">Mark Paid</button>`
                    : "—";

            row.innerHTML = `
                <td>${bill.biller_name}</td>
                <td>₹ ${bill.amount_due}</td>
                <td>${bill.due_date}</td>
                <td class="status ${bill.status}">${bill.status}</td>
                <td>${actionBtn}</td>
            `;

            table.appendChild(row);
        });
        // ==========================
        // SAVE BILL NOTIFICATIONS (NO POPUP HERE)
        // ==========================
        const existingNotifications = getNotifications();

        bills.forEach(bill => {
            const key = `bill-${bill.id}-${bill.status}`;

            const exists = existingNotifications.some(n => n.key === key);
            if (exists) return;

            if (bill.status === "due") {
                addNotification(
                    `⚠ Bill Due: ${bill.biller_name} (₹${bill.amount_due})`,
                    "bill",
                    key
                );
            }

            if (bill.status === "upcoming") {
                addNotification(
                        `📅 Upcoming Bill: ${bill.biller_name} (₹${bill.amount_due})`,
                        "bill",
                        key
                );
            }
        });
    } catch (err) {
        console.error(err);
    }
}

// ==========================
// CREATE BILL
// ==========================
async function createBill() {
    const biller_name = document.getElementById("billName").value.trim();
    const amount_due = document.getElementById("amount").value;
    const due_date = document.getElementById("dueDate").value;
    const msg = document.getElementById("msg");

    if (!biller_name || amount_due <= 0 || !due_date) {
        msg.style.color = "red";
        msg.innerText = "❌ Please enter valid bill details";
        return;
    }

    try {
        const token = localStorage.getItem("access_token");

        const res = await fetch(`${BASE_URL}/bills/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ biller_name, amount_due, due_date })
        });

        if (!res.ok) {
            msg.style.color = "red";
            msg.innerText = "❌ Failed to add bill";
            return;
        }

        msg.style.color = "green";
        msg.innerText = "✅ Bill added successfully";

        document.getElementById("billName").value = "";
        document.getElementById("amount").value = "";
        document.getElementById("dueDate").value = "";

        loadBills();

    } catch (err) {
        console.error(err);
        msg.style.color = "red";
        msg.innerText = "❌ Error adding bill";
    }
}
async function markPaid(billId) {
    try {
        const token = localStorage.getItem("access_token");

        const res = await fetch(`${BASE_URL}/bills/${billId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status: "paid" })
        });

        if (!res.ok) return;

        // 🔥 REMOVE OLD BILL NOTIFICATIONS (DUE / UPCOMING)
        let notifications = getNotifications();

        notifications = notifications.filter(n => {
            if (n.type !== "bill") return true;

            // remove notifications related to this bill
            return !n.key?.startsWith(`bill-${billId}-`);
        });

        localStorage.setItem("notifications", JSON.stringify(notifications));

        loadBills();

    } catch (err) {
        console.error(err);
    }
}

// ==========================
// MARK THAT USER VISITED BILLS PAGE
// ==========================
sessionStorage.setItem("fromBillsPage", "true");
