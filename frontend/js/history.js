const token = localStorage.getItem("access_token");

if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
}

async function loadHistory() {
    const tbody = document.getElementById("historyTableBody");

    try {
        const res = await fetch(`${BASE_URL}/transactions/my-history`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("HTTP error " + res.status);
        }

        const data = await res.json();
        const transactions = data.transactions;

        tbody.innerHTML = "";

        if (!transactions || transactions.length === 0) {
            tbody.innerHTML =
                `<tr><td colspan="5">No transactions found</td></tr>`;
            return;
        }

        transactions.forEach(tx => {
            const row = document.createElement("tr");

            const amountClass =
                tx.type === "CREDIT" ? "amount-credit" : "amount-debit";

            const category = tx.category || "Others";

            row.innerHTML = `
                <td>${tx.date ? new Date(tx.date).toLocaleString() : "—"}</td>
                <td>${tx.description || "-"}</td>

                <td>
                    <span class="category-badge ${category.toLowerCase()}">
                        ${category}
                    </span>
                    <br>
                    <select onchange="updateCategory(${tx.id}, this.value)">
                        <option value="Food" ${category === "Food" ? "selected" : ""}>Food</option>
                        <option value="Shopping" ${category === "Shopping" ? "selected" : ""}>Shopping</option>
                        <option value="Travel" ${category === "Travel" ? "selected" : ""}>Travel</option>
                        <option value="Bills" ${category === "Bills" ? "selected" : ""}>Bills</option>
                        <option value="Others" ${category === "Others" ? "selected" : ""}>Others</option>
                    </select>
                </td>

                <td>${tx.type || "-"}</td>
                <td class="${amountClass} right">₹ ${tx.amount || 0}</td>
            `;

            tbody.appendChild(row);
        });

    } catch (err) {
        console.error("History error:", err);
        tbody.innerHTML =
            `<tr><td colspan="5">Failed to load transaction history</td></tr>`;
    }
}

async function updateCategory(transactionId, newCategory) {
    try {
        const res = await fetch(
            `${BASE_URL}/transactions/${transactionId}/category`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ category: newCategory })
            }
        );

        if (!res.ok) {
            throw new Error("Category update failed");
        }

        loadHistory(); // refresh table

    } catch (err) {
        console.error("Update error:", err);
        alert("Failed to update category");
    }
}

loadHistory();
