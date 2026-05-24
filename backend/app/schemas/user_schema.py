from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from app.models.user_model import UserRole

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole
    @field_validator('role', mode='before')
    @classmethod
    def validate_role(cls, value):
        if isinstance(value, str):
            # Map common strings to the Title Case used in your Enum
            mapping = {"manager": "Manager", "employee": "Employee", "hr": "HR"}
            return mapping.get(value.lower(), value)
        return value
    
    manager_id: int | None
    
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole
    manager_id: int | None  
    
class Login(BaseModel):
    email: EmailStr
    password: str
    
    
class UserTokenData(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str


    
    

   
    
