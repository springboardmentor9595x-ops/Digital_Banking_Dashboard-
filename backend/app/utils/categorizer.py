def auto_categorize(text, rules):
    text = text.lower()
    for rule in rules:
        for keyword in rule.keywords.split(","):
            if keyword.strip().lower() in text:
                return rule.category_name
    return "Others"
def auto_categorize(text, rules):
    text = text.lower()
    for rule in rules:
        for keyword in rule.keywords.split(","):
            if keyword.strip().lower() in text:
                return rule.category_name
    return "Others"
