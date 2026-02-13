import requests

def get_exchange_rates():
    """
    Real-time exchange rate service
    Base currency: INR
    """
    try:
        response = requests.get(
            "https://open.er-api.com/v6/latest/INR",
            timeout=5
        )
        data = response.json()

        if data.get("result") == "success":
            return data["rates"]

        return {"INR": 1.0}

    except Exception:
        # fallback if API fails
        return {
            "INR": 1.0,
            "USD": 0.012,
            "EUR": 0.011
        }
