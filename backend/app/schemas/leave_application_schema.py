from pydantic import BaseModel, ConfigDict
from datetime import date
from app.models.leave_application_model import LeaveStatus

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
class LeaveApplicationCreate(BaseModel):
    leave_type_id: int
    start_date: str  
    end_date: str  
    reason: str   
      
class LeaveApplicationResponse(BaseSchema):
    id: int
    employee_id: int
    leave_type_id: int
    start_date: date
    end_date: date
    working_days: int
    reason: str | None  
    status: LeaveStatus
    manager_comments: str | None  
    employee_name: str | None = None
    leave_type_name: str | None = None
