document.addEventListener("DOMContentLoaded", () => {
    loadBills();
});

async function loadBills() {
    try {
        const res = await fetch(`${BASE_URL}/bills/`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            }
        });

        if (!res.ok) return;

        const data = await res.json();
        const table = document.getElementById("bill-table");
        table.innerHTML = "";

        data.forEach(bill => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${bill.biller_name}</td>
                <td>₹ ${bill.amount_due}</td>
                <td>${bill.due_date}</td>
                <td class="status ${bill.status}">${bill.status}</td>
            `;
            table.appendChild(row);
        });

    } catch (err) {
        console.error(err);
    }
}

async function createBill() {
    const name = document.getElementById("billName").value;
    const amount = document.getElementById("amount").value;
    const date = document.getElementById("dueDate").value;
    const msg = document.getElementById("msg");

    if (!name || !amount || !date) {
        msg.style.color = "red";
        msg.innerText = "❌ Fill all fields";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/bills/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({
                biller_name: name,
                amount_due: amount,
                due_date: date
            })
        });

        if (!res.ok) {
            msg.style.color = "red";
            msg.innerText = "❌ Failed to add bill";
            return;
        }

        msg.style.color = "green";
        msg.innerText = "✅ Bill added successfully";
        loadBills();

    } catch (err) {
        console.error(err);
        msg.style.color = "red";
        msg.innerText = "❌ Error adding bill";
    }
}
