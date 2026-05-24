# app/services/leave_type_service.py
from sqlalchemy.orm import Session
from app.models.leave_type_model import LeaveType
from app.schemas.leave_type_schema import LeaveTypeCreate

class LeaveTypeService:
    def create_leave_type(self, db: Session, data: LeaveTypeCreate):
        db_type = LeaveType(
            name=data.name,
            active=data.active,
            days_allowed=data.DaysAllowed  # Matches your schema naming
        )
        db.add(db_type)
        db.commit()
        db.refresh(db_type)
        return db_type

    def get_all_active(self, db: Session):
        return db.query(LeaveType).filter(LeaveType.active == True).all()