from ..models import CategoryRule

DEFAULT_CATEGORIES = [
    ("Salary", "salary,payroll,credit"),
    ("Food", "zomato,swiggy,restaurant,hotel"),
    ("Travel", "uber,ola,train,flight,bus"),
    ("Shopping", "amazon,flipkart,mall"),
    ("Bills", "electricity,water,internet,recharge"),
    ("Entertainment", "netflix,spotify,movie"),
    ("Investment", "mutual fund,stock,zerodha"),
    ("Others", "")
]

def seed_default_categories(db, user_id: int):
    for name, keywords in DEFAULT_CATEGORIES:
        rule = CategoryRule(
            user_id=user_id,
            category_name=name,
            keywords=keywords
        )
        db.add(rule)
    db.commit()
