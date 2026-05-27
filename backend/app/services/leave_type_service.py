# app/services/leave_type_service.py
from sqlalchemy.orm import Session
from app.models.leave_type_model import LeaveType
from app.schemas.leave_type_schema import LeaveTypeCreate

class LeaveTypeService:
    def create_leave_type(self, db: Session, data: LeaveTypeCreate):
        db_type = LeaveType(
            name=data.name,
            active=data.active,
            DaysAllowed=data.DaysAllowed
        )
        db.add(db_type)
        db.commit()
        db.refresh(db_type)
        return db_type

    def get_all_active(self, db: Session):
        return db.query(LeaveType).filter(LeaveType.active == True).all()

    def get_all(self, db: Session):
        return db.query(LeaveType).order_by(LeaveType.name).all()

    def set_active(self, db: Session, leave_type_id: int, active: bool):
        db_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
        if not db_type:
            return None

        db_type.active = active
        db.commit()
        db.refresh(db_type)
        return db_type
