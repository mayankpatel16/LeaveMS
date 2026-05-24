from sqlalchemy import Column, Date, ForeignKey, Integer, String, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class LeaveStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    
class LeaveApplication(Base):
    __tablename__ = 'LeaveApplications'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('Users.id'), nullable=False)
    leave_type_id = Column(Integer, ForeignKey('LeaveTypes.id'), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(String(255), nullable=False)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    manager_comments = Column(String(255), nullable=True)

    user = relationship("User", back_populates="applications")
    leave_type = relationship("LeaveType", back_populates="applications")
