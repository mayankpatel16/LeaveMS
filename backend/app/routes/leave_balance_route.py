from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.utils.auth_utils import get_current_user
from app.models.user_model import User, UserRole
from app.schemas.leave_balance_schema import LeaveBalanceResponse
from app.services.balance_service import BalanceService

router = APIRouter(prefix="/balances", tags=["Leave Balances"])

# 1. GET /balances/me
@router.get("/me", response_model=List[LeaveBalanceResponse])
def get_my_balances(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """My leave balances for the current year"""
    balance_service = BalanceService()
    return balance_service.get_user_balances(db, employee_id=current_user.id)

# 2. GET /balances/user/{user_id}  (HR only – fetch any employee's balances)
@router.get("/user/{user_id}", response_model=List[LeaveBalanceResponse])
def get_user_balances_for_hr(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """HR: view all current-year balances for a specific employee"""
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HR admin only")

    balance_service = BalanceService()
    return balance_service.get_balances_for_user(db, user_id=user_id)

# 3. PUT /balances/{user_id}
@router.put("/{user_id}", response_model=LeaveBalanceResponse)
def adjust_employee_balance(
    user_id: int,
    leave_type_id: int,
    new_balance: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    # Strict Role Check
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="HR admin only")
    
    balance_service = BalanceService()
    return balance_service.adjust_balance(
        db, user_id=user_id, leave_type_id=leave_type_id, new_balance=new_balance
    )