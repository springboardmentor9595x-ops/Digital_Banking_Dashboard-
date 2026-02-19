console.log("category_rules.js loaded");

document.addEventListener("DOMContentLoaded", loadRules);

/* =========================
   ADD RULE
========================= */
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
        const res = await fetch(`${BASE_URL}/categories/`, {
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


/* =========================
   LOAD RULES
========================= */
async function loadRules() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const tableBody = document.getElementById("rules-table");
    const ruleCount = document.getElementById("rule-count");
    const emptyState = document.getElementById("empty-state");

    tableBody.innerHTML = "";

    try {
        const res = await fetch(`${BASE_URL}/categories/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const rules = await res.json();

        // Update rule count badge
        if (ruleCount) {
            ruleCount.textContent = rules.length;
        }

        // Show empty state if no rules
        if (rules.length === 0) {
            if (emptyState) emptyState.style.display = "block";
            return;
        } else {
            if (emptyState) emptyState.style.display = "none";
        }

        // Render rules with keyword chips
        rules.forEach(r => {
            const row = document.createElement("tr");

            const keywordsArray = r.keywords.split(",");

            const keywordsHTML = keywordsArray.map(word =>
                `<span class="chip">${word.trim()}</span>`
            ).join("");

            row.innerHTML = `
                <td>${r.category_name}</td>
                <td>${keywordsHTML}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error("Load rules failed", err);
    }
}
