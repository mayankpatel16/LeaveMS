from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

# Import DB and Security
from app.database import get_db
from app.utils.auth_utils import get_current_user

# Import Schemas
from app.schemas.leave_application_schema import LeaveApplicationCreate, LeaveApplicationResponse

# Import Models and Services
from app.models.user_model import User, UserRole
from app.models.leave_application_model import LeaveApplication, LeaveStatus
from app.services.leave_application_service import LeaveApplicationService
from app.routes.leave_type_route import get_leave_type_service


router = APIRouter(prefix="/applications", tags=["Leave Applications"])

# --- Service Dependency ---
def get_leave_service():
    return LeaveApplicationService()

# 1. APPLY FOR LEAVE
@router.post("/", response_model=LeaveApplicationResponse)
def apply_for_leave(
    data: LeaveApplicationCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    service: LeaveApplicationService = Depends(get_leave_service) # Injected here
):
    # Now calling the instance method 'apply'
    return service.apply(db, employee_id=current_user.id, data=data)

# 2. LIST APPLICATIONS (Smart Route)
@router.get("/", response_model=List[LeaveApplicationResponse])
def get_applications(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    service: LeaveApplicationService = Depends(get_leave_service)
):
    # Manager View: See pending requests from direct reports
    if current_user.role == UserRole.MANAGER:
        applications = db.query(LeaveApplication).join(User, LeaveApplication.employee_id == User.id).filter(
            User.manager_id == current_user.id,
            LeaveApplication.status == LeaveStatus.PENDING
        ).all()
        return [service.with_display_names(application) for application in applications]
    
    # Employee View: See all own leave history
    applications = db.query(LeaveApplication).filter(LeaveApplication.employee_id == current_user.id).all()
    return [service.with_display_names(application) for application in applications]

# 3. APPROVE APPLICATION (Manager Only)
@router.put("/{id}/approve", response_model=LeaveApplicationResponse)
def approve_leave(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    service: LeaveApplicationService = Depends(get_leave_service) # Injected here
):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can approve leave")
    
    return service.process_approval(
        db, 
        application_id=id, 
        manager_id=current_user.id, 
        approved=True
    )

# 4. REJECT APPLICATION (Manager Only)
@router.put("/{id}/reject", response_model=LeaveApplicationResponse)
def reject_leave(
    id: int, 
    comment: Optional[str] = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    service: LeaveApplicationService = Depends(get_leave_service) # Injected here
):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can reject leave")
    
    return service.process_approval(
        db, 
        application_id=id, 
        manager_id=current_user.id, 
        approved=False, 
        comment=comment
    )

# 5. CANCEL APPLICATION (Employee Only)
@router.put("/{id}/cancel", response_model=LeaveApplicationResponse)
def cancel_leave(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    application = db.query(LeaveApplication).filter(
        LeaveApplication.id == id, 
        LeaveApplication.employee_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Leave application not found")
    
    if application.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending applications can be cancelled")

    application.status = LeaveStatus.CANCELLED
    db.commit()
    db.refresh(application)
    return get_leave_service().with_display_names(application)
