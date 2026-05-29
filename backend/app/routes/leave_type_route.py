from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Import DB and Security
from app.database import get_db
from app.utils.auth_utils import get_current_user

# Import Models and Enums
from app.models.user_model import User, UserRole
from app.schemas.leave_type_schema import LeaveTypeCreate, LeaveTypeResponse
from app.services.leave_type_service import LeaveTypeService

router = APIRouter(prefix="/leave-types", tags=["Leave Types"])

# Service Dependency 
def get_leave_type_service():
    return LeaveTypeService()

# GET /leave-types/
@router.get("/", response_model=List[LeaveTypeResponse])
def list_leave_types(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: LeaveTypeService = Depends(get_leave_type_service)
):
    if include_inactive:
        if current_user.role != UserRole.HR:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HR admin only")
        return service.get_all(db)
    
    # Employees see only types matching their gender
    if current_user.role == UserRole.EMPLOYEE:
        return service.get_eligible_for_user(db, gender=current_user.gender)

    return service.get_all_active(db)

#  POST /leave-types/
@router.post("/", response_model=LeaveTypeResponse)
def create_leave_type(
    data: LeaveTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: LeaveTypeService = Depends(get_leave_type_service)
):
    
    # Authorization Check
    if current_user.role != UserRole.HR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only HR users can create leave types"
        )
    
    return service.create_leave_type(db, data=data)

@router.put("/{id}/active", response_model=LeaveTypeResponse)
def update_leave_type_status(
    id: int,
    active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: LeaveTypeService = Depends(get_leave_type_service)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HR admin only")

    leave_type = service.set_active(db, leave_type_id=id, active=active)
    if not leave_type:
        raise HTTPException(status_code=404, detail="Leave type not found")

    return leave_type
