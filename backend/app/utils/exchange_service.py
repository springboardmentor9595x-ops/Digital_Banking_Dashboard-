import requests

def get_usd_to_inr_rate():
    try:
        response = requests.get("https://open.er-api.com/v6/latest/USD")
        data = response.json()
        return data["rates"]["INR"]
    except:
        return 83  # fallback if API fails
