from pydantic import BaseModel, EmailStr

class VendorCreate(BaseModel):
    company_name: str
    email: EmailStr
    password: str
