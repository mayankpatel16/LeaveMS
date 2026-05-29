from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UserRole(enum.Enum):
    EMPLOYEE = "Employee"
    MANAGER = "Manager"
    HR = "HR"

class User(Base):
    __tablename__ = 'Users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    gender = Column(String(20), nullable=True)
    manager_name = Column(String(100), nullable=True)
    manager_id = Column(Integer, ForeignKey('Users.id'), nullable=True)

    balances=relationship(
        "LeaveBalance", back_populates="user", cascade="all, delete-orphan")
    
    applications=relationship(
        "LeaveApplication", back_populates="user", cascade="all, delete-orphan")
    
    manager=relationship(
        "User", remote_side=[id], back_populates="employees", foreign_keys=[manager_id])
    
    employees=relationship(
        "User", back_populates="manager")
    






    
    
