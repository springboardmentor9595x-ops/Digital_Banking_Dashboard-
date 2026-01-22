console.log("app.js loaded");

// 🔹 Backend API base URL
const BASE_URL = "http://127.0.0.1:8000";

/* =======================
   USER ID → NAME MAP
======================= */
const userMap = {
    18: "Amma",
    21: "Sireesha",
    36: "Rahul",
    39: "Kiran",
    41: "Anjali"
};

// 🔹 Auth headers
function getAuthHeaders() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login again");
        window.location.href = "login.html";
        return {};
    }

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}

/* =======================
   LOGIN
======================= */
document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

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
                    document.getElementById("msg").innerText = data.detail;
                }
            } catch {
                document.getElementById("msg").innerText = "Server error";
            }
        });
    }

    /* =======================
       REGISTER (WORKING)
    ======================= */
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fullName = document.getElementById("full_name").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            const nameParts = fullName.trim().split(" ");
            const first_name = nameParts[0];
            const last_name = nameParts.slice(1).join(" ") || "";

            try {
                const res = await fetch(`${BASE_URL}/auth/register`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        first_name: first_name,
                        last_name: last_name,
                        username: email,
                        email: email,
                        password: password
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    alert("Successfully registered");
                    window.location.href = "login.html"; // ✅ REDIRECT
                } else {
                    alert(data.detail || "Registration failed");
                }

            } catch (error) {
                alert("Server error");
            }
        });
    }
});

/* =======================
   TRANSFER MONEY
======================= */
async function transfer() {
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const amount = document.getElementById("amount").value;

    const res = await fetch(`${BASE_URL}/transactions/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            from_account_id: Number(from),
            to_account_id: Number(to),
            amount: Number(amount)
        })
    });

    const data = await res.json();

    if (res.ok) {
        document.getElementById("result").innerHTML =
            `<div class="success">✅ Transaction Successful</div>`;
    } else {
        document.getElementById("result").innerHTML =
            `<div class="error">❌ ${data.detail}</div>`;
    }
}

/* =======================
   TRANSACTION HISTORY
======================= */

const historyData = [
    { id: 1, from: 21, to: 39, amount: 1000, bank: "SBI", logo: "public/banks/sbi.png" },
    { id: 2, from: 21, to: 39, amount: 100, bank: "SBI", logo: "public/banks/sbi.png" },
    { id: 3, from: 39, to: 21, amount: 100, bank: "HDFC", logo: "public/banks/hdfc.png" },
    { id: 4, from: 39, to: 21, amount: 100, bank: "HDFC", logo: "public/banks/hdfc.png" },
    { id: 5, from: 39, to: 21, amount: 100, bank: "HDFC", logo: "public/banks/hdfc.png" },
    { id: 6, from: 39, to: 21, amount: 1000, bank: "HDFC", logo: "public/banks/hdfc.png" },
    { id: 7, from: 39, to: 21, amount: 100, bank: "HDFC", logo: "public/banks/hdfc.png" }
];

document.addEventListener("DOMContentLoaded", () => {
    renderHistory();
    renderTransactionDetails();
});

/* ===== SHOW HISTORY ===== */
function renderHistory() {
    const list = document.getElementById("transactionsList");
    if (!list) return;

    list.innerHTML = "";

    historyData.forEach(tx => {
        list.innerHTML += `
            <div class="tx-item" onclick="openTransaction(${tx.id})">
                <div class="tx-left">↗</div>

                <div class="tx-center">
                    <strong>User ${tx.from}</strong>
                    <small>Transaction ID: ${tx.id}</small>
                </div>

                <div class="tx-right">
                    <div class="tx-amount tx-plus">₹ ${tx.amount}</div>
                    <img src="${tx.logo}">
                </div>
            </div>
        `;
    });
}

/* ===== CLICK → OPEN DETAILS ===== */
function openTransaction(id) {
    const tx = historyData.find(t => t.id === id);
    localStorage.setItem("txDetails", JSON.stringify(tx));
    window.location.href = "transaction-detail.html";
}

/* ===== SHOW DETAILS PAGE ===== */
function renderTransactionDetails() {
    const box = document.getElementById("details");
    if (!box) return;

    const tx = JSON.parse(localStorage.getItem("txDetails"));
    if (!tx) return;

    box.innerHTML = `
        <p><strong>From Account ID:</strong> ${tx.from}</p>
        <p><strong>To Account ID:</strong> ${tx.to}</p>
        <p><strong>Amount:</strong> ₹ ${tx.amount}</p>
        <p><strong>Bank:</strong> ${tx.bank}</p>
    `;
}

/* ===== BACK ===== */
function goBack() {
    window.history.back();
}
