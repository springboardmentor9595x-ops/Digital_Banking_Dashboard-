from pydantic import BaseModel, EmailStr, StringConstraints
from typing_extensions import Annotated

PasswordStr = Annotated[
    str,
    StringConstraints(min_length=8, max_length=64)
]

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: PasswordStr
    phone: str
