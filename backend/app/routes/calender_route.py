from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
import calendar

# Import DB and Security
from app.database import get_db
from app.utils.auth_utils import get_current_user

# Import Models
from app.models.leave_application_model import LeaveApplication, LeaveStatus
from app.models.user_model import User
from app.models.leave_type_model import LeaveType

router = APIRouter(prefix="/calendar", tags=["Calendar"])

@router.get("/")
def get_team_calendar(
    month: str = Query(..., description="Format: YYYY-MM (e.g., 2026-05)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # 1. Parse the month string
        year, month_int = map(int, month.split("-"))
        
        # 2. Calculate the first and last day of that month
        start_of_month = date(year, month_int, 1)
        _, last_day_int = calendar.monthrange(year, month_int)
        end_of_month = date(year, month_int, last_day_int)
    except (ValueError, Exception):
        raise HTTPException(
            status_code=400, 
            detail="Invalid month format. Please use YYYY-MM (e.g., 2026-05)"
        )

    # 3. Query approved leaves that overlap with this month
    approved_leaves = (
        db.query(LeaveApplication)
        .filter(
            LeaveApplication.status == LeaveStatus.APPROVED,
            LeaveApplication.start_date <= end_of_month,
            LeaveApplication.end_date >= start_of_month
        )
        .all()
    )

    # 4. Initialize the dictionary with every day of the month
    calendar_data = {}
    for day in range(1, last_day_int + 1):
        date_str = f"{year}-{month_int:02d}-{day:02d}"
        calendar_data[date_str] = []

    # 5. Populate the leave data
    for leave in approved_leaves:
        # Determine the actual days this leave covers WITHIN this specific month
        current_date = max(leave.start_date, start_of_month)
        actual_end = min(leave.end_date, end_of_month)

        while current_date <= actual_end:
            # We only show leaves on Working Days (Mon-Fri) per project rules
            if current_date.weekday() < 5:
                date_key = current_date.strftime("%Y-%m-%d")
                
                calendar_data[date_key].append({
                    "employee_name": leave.user.username, # Uses 'user' relationship from your model
                    "leave_type": leave.leave_type.name,  # Uses 'leave_type' relationship
                    "application_id": leave.id
                })
            
            current_date += timedelta(days=1)

    return calendar_data