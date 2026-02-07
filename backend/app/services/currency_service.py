# app/services/currency_service.py

def get_exchange_rates():
    """
    Mock exchange rates (base = INR)
    """
    return {
        "INR": 1.0,
        "USD": 0.012,
        "EUR": 0.011,
    }


def convert_amount(amount: float, from_currency: str, to_currency: str):
    rates = get_exchange_rates()

    if from_currency not in rates or to_currency not in rates:
        raise ValueError("Currency not supported")

    # Convert via base INR
    amount_in_inr = amount / rates[from_currency]
    converted = amount_in_inr * rates[to_currency]

    return round(converted, 2)
