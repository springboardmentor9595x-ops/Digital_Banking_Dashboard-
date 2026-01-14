console.log("app.js loaded");

const BASE_URL = "http://127.0.0.1:8000";

/* ================= LOGIN ================= */
async function loginUser() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    msg.innerText = "";

    if (!email || !password) {
        msg.innerText = "Please fill all fields";
        return;
    }

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("email", email);
            window.location.href = "dashboard.html";
        } else {
            msg.innerText = data.detail || "Invalid login";
        }
    } catch {
        msg.innerText = "Server not running";
    }
}

/* ================= DASHBOARD NAV ================= */
function goTransfer() {
    window.location.href = "transfer.html";
}

function goHistory() {
    window.location.href = "transactions.html";
}

/* ================= LOGOUT ================= */
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}
/* =======================
   TRANSFER MONEY
======================= */
async function transferMoney() {

    const token = localStorage.getItem("token");
    const result = document.getElementById("result");

    if (!token) {
        alert("Please login again");
        window.location.href = "login.html";
        return;
    }

    const fromAccount = document.getElementById("fromAccount").value;
    const toAccount = document.getElementById("toAccount").value;
    const amount = document.getElementById("amount").value;

    if (!fromAccount || !toAccount || !amount) {
        result.innerHTML = `<div class="error">❌ Fill all fields</div>`;
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:8000/transactions/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                from_account_id: Number(fromAccount),
                to_account_id: Number(toAccount),
                amount: Number(amount),
                currency: "USD"
            })
        });

        if (res.ok) {
            result.innerHTML = `<div class="success">✅ Transaction Successful!</div>`;
        } else {
            const data = await res.json();
            result.innerHTML = `<div class="error">❌ ${data.detail}</div>`;
        }

    } catch (err) {
        console.error(err);
        result.innerHTML = `<div class="error">❌ Server error</div>`;
    }
}



/* =======================
   BACK TO DASHBOARD
======================= */
function goBack() {
    window.location.href = "dashboard.html";
}


/* ================= TRANSACTION HISTORY ================= */
async function loadTransactions() {
    const token = localStorage.getItem("token");
    const list = document.getElementById("transactionsList");
    if (!list) return;

    const res = await fetch("http://127.0.0.1:8000/transactions/", {
        headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();
    list.innerHTML = "";

    data.forEach(tx => {
        const bankLogo =
            tx.from_account_id === 36
                ? "public/banks/hdfc.png"
                : "public/banks/sbi.png";

        const div = document.createElement("div");
        div.className = "tx-card";
        div.onclick = () => {
            localStorage.setItem("txDetails", JSON.stringify(tx));
            window.location.href = "transaction-detail.html";
        };

        div.innerHTML = `
            <div class="tx-left">
                <strong>User ${tx.to_account_id}</strong>
                <small>Transaction ID: ${tx.id}</small>
            </div>

            <div class="tx-right">
                <div class="tx-amount">₹ ${tx.amount}</div>
                <img src="${bankLogo}" class="bank-logo">
            </div>
        `;

        list.appendChild(div);
    });
}

/* ================= TRANSACTION DETAIL ================= */
function loadTransactionDetail() {
    const tx = JSON.parse(localStorage.getItem("txDetails"));
    if (!tx) return;

    document.getElementById("fromId").innerText = tx.from_account_id;
    document.getElementById("toId").innerText = tx.to_account_id;
    document.getElementById("amount").innerText = tx.amount;
}

/* ================= BACK ================= */
function goBack() {
    history.back();
}
async function transferMoney() {
    console.log("✅ transferMoney clicked");

    const token = localStorage.getItem("token");
    const result = document.getElementById("result");
    const backBtn = document.getElementById("backBtn");

    if (!token) {
        alert("Please login again");
        window.location.href = "login.html";
        return;
    }

    const fromId = document.getElementById("fromAccount").value;
    const toId = document.getElementById("toAccount").value;
    const amount = document.getElementById("amount").value;

    if (!fromId || !toId || !amount) {
        result.innerHTML = `<div class="error">❌ Fill all fields</div>`;
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:8000/transactions/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                from_account_id: Number(fromId),
                to_account_id: Number(toId),
                amount: Number(amount)
            })
        });

        if (res.ok) {
            result.innerHTML = `
                <div class="success">
                    ✅ Transaction Successful!
                </div>
            `;
            backBtn.style.display = "block";
        } else {
            const data = await res.json();
            result.innerHTML = `<div class="error">❌ ${data.detail}</div>`;
        }
    } catch (err) {
        result.innerHTML = `<div class="error">❌ Server error</div>`;
    }
}
