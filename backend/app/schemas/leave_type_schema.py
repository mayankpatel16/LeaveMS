from pydantic import BaseModel, ConfigDict

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class LeaveTypeCreate(BaseModel):
    name: str
    active: bool
    DaysAllowed: int
    gender_allowed: str
    
class LeaveTypeResponse(BaseSchema):
    id : int
    name: str 
    active: bool 
    DaysAllowed: int
    gender_allowed: str 
