async function loadAlerts() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const res = await fetch("http://127.0.0.1:8000/alerts/", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const alerts = await res.json();
    const list = document.getElementById("alertsList");
    list.innerHTML = "";

    alerts.forEach(alert => {
        const li = document.createElement("li");

        li.innerHTML = `
            <strong>${alert.message}</strong>
            <br/>
            <small>${alert.created_at}</small>
            <br/>
            <button onclick="markRead(${alert.id})">
                Mark as Read
            </button>
        `;

        if (!alert.read_status) {
            li.style.background = "#fee2e2";
        }

        list.appendChild(li);
    });
}

async function markRead(id) {
    const token = localStorage.getItem("access_token");

    await fetch(`http://127.0.0.1:8000/alerts/${id}/read`, {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    loadAlerts();
}

window.onload = loadAlerts;
