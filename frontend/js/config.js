// 🔗 Backend base URL
const BASE_URL = "http://127.0.0.1:8000";

// 🔐 Token helpers
function getToken() {
    return localStorage.getItem("access_token");
}

function authHeaders() {
    return {
        "Authorization": "Bearer " + getToken(),
        "Content-Type": "application/json"
    };
}
