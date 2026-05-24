from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class LeaveType(Base):
    __tablename__ = 'LeaveTypes'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    active = Column(Boolean, default=True)
    DaysAllowed = Column(Integer, nullable=False)
    
    applications=relationship(
        "LeaveApplication", back_populates="leave_type", cascade="all, delete-orphan")
    
    balances=relationship(
        "LeaveBalance", back_populates="leave_type", cascade="all, delete-orphan")
