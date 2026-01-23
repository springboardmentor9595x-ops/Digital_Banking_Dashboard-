from pydantic import BaseModel


class CategoryRuleCreate(BaseModel):
    category_name: str
    keywords: str


class CategoryRuleOut(BaseModel):
    id: int
    category_name: str
    keywords: str

    class Config:
        from_attributes = True
