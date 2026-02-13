from app.utils.exchange_rates import get_exchange_rates

def convert_amount(amount: float, from_currency: str, to_currency: str):
    rates = get_exchange_rates()

    if from_currency not in rates or to_currency not in rates:
        return amount  # fallback safely

    base_amount = amount / rates[from_currency]
    converted_amount = base_amount * rates[to_currency]

    return round(converted_amount, 2)
