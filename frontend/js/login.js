console.log("login.js loaded");

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                username: email,
                password: password
            })
        });

        const data = await res.json();

        if (!res.ok) {
            console.error(data);
            alert(data.detail || "Login failed");
            return;
        }

        // ✅ SAVE TOKEN
        localStorage.setItem("access_token", data.access_token);

        // ✅ REDIRECT
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Login error:", err);
        alert("Server error during login");
    }
}
