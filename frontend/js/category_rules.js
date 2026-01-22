console.log("category_rules.js loaded");

document.addEventListener("DOMContentLoaded", loadRules);

async function addRule() {
    const categoryName = document.getElementById("categoryName").value.trim();
    const keywords = document.getElementById("keywords").value.trim();
    const msg = document.getElementById("msg");

    msg.innerText = "";

    if (!categoryName || !keywords) {
        msg.style.color = "red";
        msg.innerText = "❌ All fields required";
        return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
        msg.style.color = "red";
        msg.innerText = "Login expired";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/category-rules/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                category_name: categoryName,
                keywords: keywords
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Failed");
        }

        msg.style.color = "green";
        msg.innerText = "✅ Rule added successfully";

        document.getElementById("categoryName").value = "";
        document.getElementById("keywords").value = "";

        loadRules();

    } catch (err) {
        msg.style.color = "red";
        msg.innerText = "❌ Failed to add rule";
    }
}

async function loadRules() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const table = document.getElementById("rules-table");
    table.innerHTML = "";

    try {
        const res = await fetch(`${BASE_URL}/category-rules/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const rules = await res.json();

        rules.forEach(r => {
            table.innerHTML += `
                <tr>
                    <td>${r.category_name}</td>
                    <td>${r.keywords}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Load rules failed", err);
    }
}
