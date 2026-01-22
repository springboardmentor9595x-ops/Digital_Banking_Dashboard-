from app.db.database import engine
from app.db.database import Base
from app.models import user, account, transaction, category_rule

def init_db():
    Base.metadata.create_all(bind=engine)
