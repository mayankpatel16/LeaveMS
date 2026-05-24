from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user_model import User, UserRole
from app.models.leave_type_model import LeaveType
from app.models.leave_balance_model import LeaveBalance
from app.models.leave_application_model import LeaveApplication, LeaveStatus
from app.utils.auth_utils import get_password_hash
from datetime import date, timedelta

def seed_data():
    db = SessionLocal()
    
    # 1. Clear existing data (Optional, but helps keep it clean)
    print("Cleaning database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    common_password = get_password_hash("password123")

    # 2. Create Leave Types
    print("Seeding Leave Types...")
    annual_leave = LeaveType(name="Annual Leave", active=True, DaysAllowed=21)
    sick_leave = LeaveType(name="Sick Leave", active=True, DaysAllowed=10)
    db.add_all([annual_leave, sick_leave])
    db.commit()

    # 3. Create HR Admin
    print("Seeding Users...")
    hr_admin = User(
        username="admin_jane",
        email="admin@company.com",
        password_hash=common_password,
        role=UserRole.HR,
        manager_id=None
    )
    db.add(hr_admin)
    db.commit()

    # 4. Create 2 Managers
    manager1 = User(username="manager_bob", email="bob@company.com", password_hash=common_password, role=UserRole.MANAGER)
    manager2 = User(username="manager_alice", email="alice@company.com", password_hash=common_password, role=UserRole.MANAGER)
    db.add_all([manager1, manager2])
    db.commit()

    # 5. Create 4 Employees (2 for each manager)
    employees = [
        User(username="emp_john", email="john@company.com", password_hash=common_password, role=UserRole.EMPLOYEE, manager_id=manager1.id),
        User(username="emp_doe", email="doe@company.com", password_hash=common_password, role=UserRole.EMPLOYEE, manager_id=manager1.id),
        User(username="emp_sam", email="sam@company.com", password_hash=common_password, role=UserRole.EMPLOYEE, manager_id=manager2.id),
        User(username="emp_lee", email="lee@company.com", password_hash=common_password, role=UserRole.EMPLOYEE, manager_id=manager2.id),
    ]
    db.add_all(employees)
    db.commit()

    # 6. Create Leave Balances for everyone
    print("Seeding Balances...")
    all_users = db.query(User).all()
    for user in all_users:
        db.add(LeaveBalance(employee_id=user.id, leave_type_id=annual_leave.id, balance=21, current_year=2026))
        db.add(LeaveBalance(employee_id=user.id, leave_type_id=sick_leave.id, balance=10, current_year=2026))
    db.commit()

    # 7. Create Sample Leave Applications
    print("Seeding Applications...")
    # John has an approved leave
    app1 = LeaveApplication(
        employee_id=employees[0].id,
        leave_type_id=annual_leave.id,
        start_date=date(2026, 6, 1),
        end_date=date(2026, 6, 3),
        reason="Family vacation",
        status=LeaveStatus.APPROVED
    )
    # Sam has a pending leave
    app2 = LeaveApplication(
        employee_id=employees[2].id,
        leave_type_id=sick_leave.id,
        start_date=date(2026, 6, 10),
        end_date=date(2026, 6, 10),
        reason="Doctor appointment",
        status=LeaveStatus.PENDING
    )
    db.add_all([app1, app2])
    db.commit()

    print("Database successfully seeded!")
    print(f"Login with: admin@company.com / password123")
    db.close()

if __name__ == "__main__":
    seed_data()
