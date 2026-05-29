from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class LeaveType(Base):
    __tablename__ = 'LeaveTypes'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    active = Column(Boolean, default=True)
    DaysAllowed = Column(Integer, nullable=False)
    gender_allowed = Column(String(20), nullable=True)
    
    applications=relationship(
        "LeaveApplication", back_populates="leave_type", cascade="all, delete-orphan")
    
    balances=relationship(
        "LeaveBalance", back_populates="leave_type", cascade="all, delete-orphan")
