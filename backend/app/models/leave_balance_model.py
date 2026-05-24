from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base

class LeaveBalance(Base):
    __tablename__ = 'LeaveBalances'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('Users.id'), nullable=False)
    leave_type_id = Column(Integer, ForeignKey('LeaveTypes.id'), nullable=False)
    balance = Column(Integer, nullable=False)
    current_year = Column(Integer, nullable=False)
    
    user=relationship(
        "User", back_populates="balances")
    
    leave_type=relationship(
        "LeaveType", back_populates="balances")
