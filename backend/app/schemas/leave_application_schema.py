from pydantic import BaseModel, ConfigDict
from app.models.leave_application_model import LeaveStatus

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
class LeaveApplicationCreate(BaseModel):
    employee_id: int
    leave_type_id: int
    start_date: str  
    end_date: str  
    reason: str   
    manager_id: int | None  
      
class LeaveApplicationResponse(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int
    start_date: str  
    end_date: str  
    reason: str | None  
    status: LeaveStatus
    manager_comments: str | None  
