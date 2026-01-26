CATEGORY_KEYWORDS = {
    "Income": ["salary", "payroll", "income"],
    "Food": ["zomato", "swiggy", "restaurant", "cafe", "dining", "food"],
    "Groceries": ["grocery", "supermarket", "bigbasket"],
    "Transport": ["uber", "ola", "rapido", "bus", "metro"],
    "Bills": ["electricity", "water", "gas", "recharge"],
    "Shopping": ["amazon", "flipkart", "myntra", "ebay", "shopping", "meesho", "ajio"],
    "Entertainment": ["netflix", "spotify", "prime","cinema","gaming"],
    "Health": ["hospital", "pharmacy", "clinic"],
    "Education": ["school", "college", "university", "course", "tuition"],
    "Others": []
}

def auto_assign_category(text: str) -> str:
    text = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return category
    return "Others"
