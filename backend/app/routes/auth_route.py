from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..schemas.user_schema import UserResponse, UserCreate, TokenResponse, Login
from ..models.user_model import User, UserRole
from ..services import auth_service
from app.database import get_db
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HR admin only")

    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = auth_service.get_password_hash(user_data.password)

    manager = None
    if user_data.manager_name:
        manager = db.query(User).filter(
            User.username == user_data.manager_name,
            User.role == UserRole.MANAGER
        ).first()

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_pwd,
        role=user_data.role,
        gender=user_data.gender,
        manager_name=user_data.manager_name,
        manager_id=manager.id if manager else None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenResponse)
def login(login_data: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not auth_service.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = auth_service.create_access_token(
        data={"sub": user.email, "id": user.id, "role": user.role.value}
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HR admin only")

    return db.query(User).order_by(User.username).all()
