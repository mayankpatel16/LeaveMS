# app/services/leave_type_service.py
from sqlalchemy.orm import Session
from app.models.leave_type_model import LeaveType
from app.schemas.leave_type_schema import LeaveTypeCreate, LeaveTypeUpdate

class LeaveTypeService:
    def create_leave_type(self, db: Session, data: LeaveTypeCreate):
        db_type = LeaveType(
            name=data.name,
            active=data.active,
            DaysAllowed=data.DaysAllowed,
            gender_allowed=data.gender_allowed
        )
        db.add(db_type)
        db.commit()
        db.refresh(db_type)
        return db_type

    def get_all_active(self, db: Session):
        return db.query(LeaveType).filter(LeaveType.active == True).all()

    def get_all(self, db: Session):
        return db.query(LeaveType).order_by(LeaveType.name).all()
    
    def get_eligible_for_user(self, db: Session, gender: str):
        """
        Returns active leave types where:
        - gender_allowed matches the user's gender OR
        - gender_allowed is 'All' (available to everyone)
        """
        return db.query(LeaveType).filter(
            LeaveType.active == True,
            (
                (LeaveType.gender_allowed == gender) |
                (LeaveType.gender_allowed == 'All')
            )
        ).all()
        
    def set_active(self, db: Session, leave_type_id: int, active: bool):
        db_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
        if not db_type:
            return None

        db_type.active = active
        db.commit()
        db.refresh(db_type)
        return db_type

    def update_leave_type(self, db: Session, leave_type_id: int, data: LeaveTypeUpdate):
        db_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
        if not db_type:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_type, field, value)

        db.commit()
        db.refresh(db_type)
        return db_type
