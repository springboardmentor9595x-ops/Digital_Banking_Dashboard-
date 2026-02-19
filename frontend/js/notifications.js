// ==========================
// NOTIFICATIONS STORAGE
// ==========================
function getNotifications() {
    return JSON.parse(localStorage.getItem("notifications") || "[]");
}

function addNotification(message, type, key = null) {
    let notifications = getNotifications();

    // prevent duplicates
    if (key && notifications.some(n => n.key === key)) return;

    notifications.unshift({
        message,
        type,        // "bill" | "budget"
        key,
        time: new Date().toLocaleString(),
        read: false, // unread → bell count
        shown: false
    });

    localStorage.setItem("notifications", JSON.stringify(notifications));
}

// ==========================
// 🔔 BELL LOGIC (BADGE + UI POPUP)
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    const bellBtn = document.getElementById("notification-btn");
    const countBadge = document.getElementById("notification-count");
    const popup = document.getElementById("notificationPopup");
    const list = document.getElementById("notificationList");
    const summary = document.getElementById("notifSummaryCount");

    // Safe exit if page has no bell
    if (!bellBtn || !countBadge || !popup || !list) return;

    function refreshBadge() {
        const unread = getNotifications().filter(n => !n.read);
        if (unread.length > 0) {
            countBadge.innerText = unread.length;
            countBadge.style.display = "inline";
        } else {
            countBadge.style.display = "none";
        }
    }

    // 🔔 CLICK BELL → SHOW NOTIFICATIONS
    bellBtn.addEventListener("click", () => {
        let notifications = getNotifications();

        // ✅ SORT BY LATEST FIRST
        notifications.sort(
            (a, b) => new Date(b.time) - new Date(a.time)
        );

        list.innerHTML = "";

        if (notifications.length === 0) {
            list.innerHTML =
                "<p style='padding:12px;color:#666;'>No notifications</p>";
        } else {
            notifications.forEach(n => {
                const item = document.createElement("div");
                item.className = "notif-item";

                // ==========================
                // 🎨 TYPE-BASED HIGHLIGHT
                // ==========================
                if (n.type === "budget") {
                    item.style.borderLeft = "4px solid #dc2626"; // red
                } else if (n.type === "bill") {
                    item.style.borderLeft = "4px solid #2563eb"; // blue
                }

                item.style.paddingLeft = "10px";

                // ✅ NEW badge for unread notifications
                const newTag = !n.read
                    ? `<span style="
                            background:#2563eb;
                            color:white;
                            font-size:10px;
                            padding:2px 6px;
                            border-radius:6px;
                            margin-left:6px;
                        ">NEW</span>`
                    : "";

                item.innerHTML = `
                    <div class="notif-info">
                        <strong>${n.message} ${newTag}</strong>
                        <small style="color:#666;">${n.time}</small>
                    </div>
                `;

                list.appendChild(item);
                n.read = true; // mark as read
            });

            localStorage.setItem(
                "notifications",
                JSON.stringify(notifications)
            );
        }

        // ✅ Notification count summary (top text)
        if (summary) {
            summary.innerText = notifications.length;
        }

        popup.style.display = "block";
        refreshBadge();
    });

    // initial badge update
    refreshBadge();
});
