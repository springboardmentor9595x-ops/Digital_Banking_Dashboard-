"""
Exchange Rate Service
Fetches real-time currency exchange rates with caching and fallback
"""

import aiohttp
from typing import Dict, Optional
from datetime import datetime, timedelta

# ============================================
# CONFIGURATION
# ============================================

# Free API: https://www.exchangerate-api.com/
# No API key needed for basic usage (1500 requests/month free)
EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/INR"

# Fallback rates (Feb 2026 approximate values)
FALLBACK_RATES = {
    "USD": 0.012,  # 1 INR = $0.012 (₹83.33 = $1)
    "EUR": 0.011,  # 1 INR = €0.011 (₹90.90 = €1)
    "GBP": 0.0095,  # 1 INR = £0.0095 (₹105.26 = £1)
    "INR": 1.0,  # Base currency
    "AED": 0.044,  # 1 INR = 0.044 AED
    "SGD": 0.016,  # 1 INR = 0.016 SGD
}

# Cache configuration
_rate_cache: Dict[str, float] = {}
_cache_timestamp: Optional[datetime] = None
CACHE_DURATION = timedelta(hours=6)  # Refresh every 6 hours


# ============================================
# EXCHANGE RATE SERVICE CLASS
# ============================================


class ExchangeRateService:
    """Service for fetching and caching exchange rates"""

    @staticmethod
    async def get_rates() -> Dict[str, float]:
        """
        Get current exchange rates with INR as base currency.

        Flow:
        1. Check if cached rates are still valid (< 6 hours old)
        2. If cache valid → return cached rates
        3. If cache expired → fetch new rates from API
        4. If API fails → use fallback rates

        Returns:
            Dict mapping currency code to conversion rate from INR
            Example: {"USD": 0.012, "EUR": 0.011}
        """
        global _rate_cache, _cache_timestamp

        # ✅ Step 1: Check cache validity
        if _rate_cache and _cache_timestamp:
            cache_age = datetime.now() - _cache_timestamp
            if cache_age < CACHE_DURATION:
                print(f"📊 Using cached rates (age: {cache_age})")
                return _rate_cache

        # ✅ Step 2: Fetch fresh rates from API
        try:
            print("🌐 Fetching live exchange rates from API...")

            async with aiohttp.ClientSession() as session:
                async with session.get(EXCHANGE_API_URL, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        rates = data.get("rates", {})

                        if rates:
                            # Update cache
                            _rate_cache = rates
                            _cache_timestamp = datetime.now()

                            print(
                                f"✅ API Success: USD={rates.get('USD', 0):.4f}, EUR={rates.get('EUR', 0):.4f}"
                            )
                            return _rate_cache

        except Exception as e:
            print(f"⚠️ Exchange API failed: {e}")

        # ✅ Step 3: Fallback to hardcoded rates
        print("💾 Using fallback exchange rates")
        _rate_cache = FALLBACK_RATES.copy()
        _cache_timestamp = datetime.now()
        return _rate_cache

    @staticmethod
    async def convert_inr_to(amount_inr: float, target_currency: str) -> float:
        """
        Convert INR amount to target currency.

        Example:
            convert_inr_to(1000, "USD") → 12.00 (if 1 INR = 0.012 USD)

        Args:
            amount_inr: Amount in Indian Rupees
            target_currency: Target currency code (USD, EUR, GBP, etc.)

        Returns:
            Converted amount rounded to 2 decimals
        """
        rates = await ExchangeRateService.get_rates()
        rate = rates.get(target_currency.upper(), 0)

        if rate == 0:
            print(f"⚠️ Currency {target_currency} not found in rates")
            return 0.0

        converted = amount_inr * rate
        return round(converted, 2)

    @staticmethod
    def calculate_points_value(points: int, points_per_rupee: float = 0.25) -> float:
        """
        Calculate monetary value of reward points in INR.

        Standard conversion: 4 points = ₹1 (0.25 INR per point)

        Example:
            calculate_points_value(5000) → 1250.0 INR

        Args:
            points: Number of reward points
            points_per_rupee: Conversion rate (default: 0.25)

        Returns:
            Value in INR rounded to 2 decimals
        """
        value_inr = points * points_per_rupee
        return round(value_inr, 2)


# ============================================
# UTILITY FUNCTION
# ============================================


async def convert_currency(
    amount: float, from_currency: str, to_currency: str
) -> float:
    """
    Convert amount between any two currencies.

    Usage:
        usd_amount = await convert_currency(1000, "INR", "USD")
        inr_amount = await convert_currency(12, "USD", "INR")

    Args:
        amount: Amount to convert
        from_currency: Source currency code
        to_currency: Target currency code

    Returns:
        Converted amount
    """
    if from_currency == to_currency:
        return amount

    # Convert to INR first if needed
    if from_currency != "INR":
        rates = await ExchangeRateService.get_rates()
        from_rate = rates.get(from_currency, 0)
        if from_rate == 0:
            return 0.0
        amount = amount / from_rate  # Convert to INR

    # Convert from INR to target currency
    return await ExchangeRateService.convert_inr_to(amount, to_currency)
