from sqlalchemy.orm import Session
from ..models.leave_balance_model import LeaveBalance
from datetime import date

class BalanceService:
    def get_user_balances(self, db: Session, employee_id: int):
        """
        Fetches all leave balances for a specific user for the current calendar year.
        """
        return db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.current_year == date.today().year
        ).all()

    def adjust_balance(self, db: Session, user_id: int, leave_type_id: int, new_balance: int):
        """
        Updates an existing balance or creates a new record if it doesn't exist.
        Used exclusively by the HR role.
        """
        # Search for an existing record for this user, type, and year
        record = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == user_id,
            LeaveBalance.leave_type_id == leave_type_id,
            LeaveBalance.current_year == date.today().year
        ).first()

        if record:
            # Update existing
            record.balance = new_balance
        else:
            # Create new record
            record = LeaveBalance(
                employee_id=user_id,
                leave_type_id=leave_type_id,
                balance=new_balance,
                current_year=date.today().year
            )
            db.add(record)
        
        db.commit()
        db.refresh(record)
        return record