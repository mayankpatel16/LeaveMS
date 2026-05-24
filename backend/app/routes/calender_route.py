# from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy.orm import Session
# from datetime import datetime, date, timedelta
# import calendar
# from typing import Dict, List

# from app.database import get_db
# from app.utils.auth_utils import get_current_user
# from app.models.leave_application_model import LeaveApplication, LeaveStatus
# from app.models.user_model import User
# from app.models.leave_type_model import LeaveType

# router = APIRouter(prefix="/calendar", tags=["Calendar"])

# @router.get("/")
# def get_team_calendar(
#     month: str = Query(..., description="Format: YYYY-MM"),
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     """
#     Returns approved leaves for a specific month, grouped by date.
#     Required format for query param: ?month=2026-05
#     """
#     try:
#         # 1. Parse the month string (e.g., "2026-05")
#         year_str, month_str = month.split("-")
#         year = int(year_str)
#         month_int = int(month_str)

#         # 2. Calculate the first and last day of that month
#         start_of_month = date(year, month_int, 1)
#         last_day = calendar.monthrange(year, month_int)[1]
#         end_of_month = date(year, month_int, last_day)
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")

#     # 3. SQL Query with date-range filter (Requirement check!)
#     # We join with User and LeaveType to get the names needed for the calendar
#     approved_leaves = (
#         db.query(LeaveApplication)
#         .join(User, LeaveApplication.employee_id == User.id)
#         .join(LeaveType, LeaveApplication.leave_type_id == LeaveType.id)
#         .filter(
#             LeaveApplication.status == LeaveStatus.approved,
#             LeaveApplication.start_date <= end_of_month,
#             LeaveApplication.end_date >= start_of_month
#         )
#         .all()
#     )

#     # 4. Group by date for the frontend
#     # We create a dictionary where keys are "YYYY-MM-DD"
#     calendar_data = {}

#     # Initialize the dict with all days of the month as empty lists
#     for day in range(1, last_day + 1):
#         current_day_str = f"{year}-{month_str:0>2}-{day:0>2}"
#         calendar_data[current_day_str] = []

#     # Fill in the leave data
#     for leave in approved_leaves:
#         # We only care about the overlap within this specific month
#         current_date = max(leave.start_date, start_of_month)
#         actual_end = min(leave.end_date, end_of_month)

#         while current_date <= actual_end:
#             date_key = current_date.strftime("%Y-%m-%d")
            
#             # Only add if it's a weekday (Requirement: Working days Mon-Fri)
#             if current_date.weekday() < 5:
#                 calendar_data[date_key].append({
#                     "employee_name": leave.employee.username,
#                     "leave_type": leave.leave_type.name,
#                     "application_id": leave.id
#                 })
            
#             current_date += timedelta(days=1)

#     return calendar_data