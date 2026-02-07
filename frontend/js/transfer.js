
/* ================= AUTH HEADERS ================= */
function authHeaders() {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token"); // ✅ backward compatible

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "login.html";
        return {};
    }

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


/* ================= LOAD ACCOUNTS ================= */
function loadAccountsForTransaction() {
    fetch(`${BASE_URL}/accounts/`, {
        headers: authHeaders()
    })
    .then(res => res.json())
    .then(accounts => {
        const select = document.getElementById("from-account");
        if (!select) return;

        select.innerHTML = "";

        accounts.forEach(acc => {
            const option = document.createElement("option");
            option.value = acc.id;
            option.textContent =
                `${acc.bank_name} (${acc.account_type}) — ₹${acc.balance}`;
            select.appendChild(option);
        });
    })
    .catch(err => {
        console.error("Account load error:", err);
        alert("❌ Failed to load accounts");
    });
}

/* ================= TRANSFER ================= */
async function handleTransfer() {
    const fromAccountId = Number(document.getElementById("from-account-id").value);
    const toAccountId   = Number(document.getElementById("to-account-id").value);
    const amount        = Number(document.getElementById("transfer-amount").value);

    if (!fromAccountId || !toAccountId || amount <= 0) {
        alert("❌ Please fill all transfer fields correctly");
        return;
    }

    try {
        const response = await fetch(
            `${BASE_URL}/transfer/?from_account_id=${fromAccountId}&to_account_id=${toAccountId}&amount=${amount}`,
            {
                method: "POST",
                headers: authHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Transfer failed");
        }

        alert("✅ Transfer successful");
        document.getElementById("transfer-amount").value = "";

    } catch (error) {
        console.error("TRANSFER ERROR:", error);
        alert("❌ Transfer failed: " + error.message);
    }
}

/* ================= ADD TRANSACTION ================= */
/* ================= ADD TRANSACTION ================= */
async function submitTransaction() {
    const fromAccountId = Number(
        document.getElementById("from-account").value
    );
    const amount = Number(
        document.getElementById("amount").value
    );
    const merchant =
        document.getElementById("merchant").value.trim();
    const category =
        document.getElementById("category").value;
    const date =
        document.getElementById("transaction-date").value;

    // ✅ FIX DATE SAFELY (DD/MM/YYYY → YYYY-MM-DD)
    let isoDate = date;
    if (date.includes("/")) {
        const [dd, mm, yyyy] = date.split("/");
        isoDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }

    if (!fromAccountId || amount <= 0 || !merchant || !category || !date) {
        alert("❌ Please fill all fields correctly");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/transactions/`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                from_account_id: fromAccountId,
                to_account_id: fromAccountId,
                amount: amount,
                description: merchant,
                category: category,
                date: isoDate   // ✅ CORRECT MONTH GUARANTEED
            })
        });

        const data = await res.json();

        if (!res.ok) {
            let message = "Transaction failed";
            if (Array.isArray(data.detail)) {
                message = data.detail.map(e => e.msg).join(", ");
            } else if (typeof data.detail === "string") {
                message = data.detail;
            }
            throw new Error(message);
        }

        alert("✅ Transaction added successfully");

        // 🔔 tell budgets page to refresh
        localStorage.setItem("refreshBudgets", "true");

        // keep your existing redirect
        window.location.href =
            "dashboard.html?reload=" + new Date().getTime();

    } catch (err) {
        alert("❌ " + err.message);
        console.error("Transaction error:", err);
    }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadAccountsForTransaction);
