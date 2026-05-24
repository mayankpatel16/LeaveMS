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

# Service Dependency (Since we removed @staticmethod)
def get_leave_type_service():
    return LeaveTypeService()

# 1. GET /leave-types/
@router.get("/", response_model=List[LeaveTypeResponse])
def list_leave_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: LeaveTypeService = Depends(get_leave_type_service)
):
    """
    List all active leave types (Accessible by all logged-in users).
    """
    return service.get_all_active(db)


# 2. POST /leave-types/
@router.post("/", response_model=LeaveTypeResponse)
def create_leave_type(
    data: LeaveTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: LeaveTypeService = Depends(get_leave_type_service)
):
    """
    Create a leave type (HR admin only).
    """
    # Authorization Check
    if current_user.role != UserRole.HR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only HR users can create leave types"
        )
    
    return service.create_leave_type(db, data=data)