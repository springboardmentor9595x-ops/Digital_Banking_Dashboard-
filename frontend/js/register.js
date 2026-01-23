async function register() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("message");

    if (!email || !password) {
        message.innerText = "❌ All fields required";
        message.style.color = "red";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Registration failed");
        }

        message.innerText = "✅ Registered successfully";
        message.style.color = "green";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);

    } catch (err) {
        message.innerText = "❌ " + err.message;
        message.style.color = "red";
    }
}
