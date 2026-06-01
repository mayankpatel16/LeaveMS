from pydantic import BaseModel, ConfigDict
from typing import Optional

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class LeaveTypeCreate(BaseModel):
    name: str
    active: bool
    DaysAllowed: int
    gender_allowed: str

class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None
    DaysAllowed: Optional[int] = None
    gender_allowed: Optional[str] = None

class LeaveTypeResponse(BaseSchema):
    id : int
    name: str 
    active: bool 
    DaysAllowed: int
    gender_allowed: str 
