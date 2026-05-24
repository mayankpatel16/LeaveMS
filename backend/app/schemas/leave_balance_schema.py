from pydantic import BaseModel, ConfigDict

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
class LeaveBalanceCreate(BaseModel):
    employee_id: int
    balance: int
    current_year: int
 
class LeaveBalanceResponse(BaseModel):
    id: int
    employee_id: int
    leave_type_id: int
    balance: int
    current_year: int