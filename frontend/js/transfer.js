const token = localStorage.getItem("access_token");

if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
}

async function transferMoney() {
    const fromAccount = document.getElementById("fromAccount").value;
    const toAccount = document.getElementById("toAccount").value;
    const amount = document.getElementById("amount").value;
    const message = document.getElementById("message");

    // Clear old message
    message.innerText = "";

    if (!fromAccount || !toAccount || !amount) {
        message.innerText = "❌ All fields are required";
        message.style.color = "red";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/transactions/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                from_account_id: Number(fromAccount),
                to_account_id: Number(toAccount),
                amount: Number(amount),
                description: "Transfer"
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Transaction failed");
        }

        /* ============================
           ✅ BUDGET ALERT HANDLING
        ============================ */
        if (data.budget_alert) {
            alert(data.budget_alert);   // ⚠ Budget exceeded popup
        }

        // ✅ SUCCESS MESSAGE
        message.innerText = "✅ Transaction successful!";
        message.style.color = "green";

        // ✅ Clear amount field
        document.getElementById("amount").value = "";

        // ✅ Redirect after short delay
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1200);

    } catch (err) {
        message.innerText = "❌ " + err.message;
        message.style.color = "red";
    }
}

function goBack() {
    window.location.href = "dashboard.html";
}
