from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime

from app.models.leave_application_model import LeaveApplication, LeaveStatus
from app.models.user_model import User
from app.models.leave_balance_model import LeaveBalance


from app.schemas.leave_application_schema import LeaveApplicationCreate
from app.utils.date_utils import calculate_working_days

class LeaveApplicationService:

    def apply(self, db: Session, employee_id: int, data: LeaveApplicationCreate):
        # Convert string dates to Python date objects
        try:
            start_dt = datetime.strptime(data.start_date, "%Y-%m-%d").date()
            end_dt = datetime.strptime(data.end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Dates must be in YYYY-MM-DD format")

        # Calculate working days (Mon-Fri)
        days = calculate_working_days(start_dt, end_dt)
        if days <= 0:
            raise HTTPException(status_code=400, detail="The selected range has no working days")

        # Check if user has enough balance
        balance_rec = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == data.leave_type_id
        ).first()

        if not balance_rec or balance_rec.balance < days:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient balance. Required: {days}, Available: {balance_rec.balance if balance_rec else 0}"
            )

        # Save application as 'Pending'
        new_app = LeaveApplication(
            employee_id=employee_id,
            leave_type_id=data.leave_type_id,
            start_date=start_dt,
            end_date=end_dt,
            reason=data.reason,
            working_days=days,
            status=LeaveStatus.PENDING
        )
        
        db.add(new_app)
        db.commit()
        db.refresh(new_app)
        return self.with_display_names(new_app)

    def process_approval(self, db: Session, application_id: int, manager_id: int, approved: bool, comment: str = None):
        # Fetch application
        app = db.query(LeaveApplication).filter(LeaveApplication.id == application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Requirement: Manager verification
        employee = db.query(User).filter(User.id == app.employee_id).first()
        if employee.manager_id != manager_id:
            raise HTTPException(status_code=403, detail="You are not authorized to manage this employee's leave")

        # Requirement: Ensure it hasn't been processed already
        if app.status != LeaveStatus.PENDING:
            raise HTTPException(status_code=400, detail="This application has already been processed")

        # DATABASE TRANSACTION
        try:
            if approved:
                app.status = LeaveStatus.APPROVED
                # Deduct from the balance record
                balance_rec = db.query(LeaveBalance).filter(
                    LeaveBalance.employee_id == app.employee_id,
                    LeaveBalance.leave_type_id == app.leave_type_id
                ).first()
                
                if balance_rec:
                    balance_rec.balance -= app.working_days
            else:
                app.status = LeaveStatus.REJECTED
            
            app.manager_comments = comment
            
            # Commit both the status change and the balance deduction together
            db.commit()
            db.refresh(app)
            return self.with_display_names(app)
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="An error occurred during the transaction")

    def cancel_application(self, db: Session, application_id: int, employee_id: int):

        app = db.query(LeaveApplication).filter(
            LeaveApplication.id == application_id, 
            LeaveApplication.employee_id == employee_id
        ).first()

        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        
        if app.status != LeaveStatus.PENDING:
            raise HTTPException(status_code=400, detail="Cannot cancel a leave that is already processed")

        app.status = LeaveStatus.CANCELLED
        db.commit()
        db.refresh(app)
        return self.with_display_names(app)

    def with_display_names(self, app: LeaveApplication):
        app.employee_name = app.user.username if app.user else None
        app.leave_type_name = app.leave_type.name if app.leave_type else None
        return app
