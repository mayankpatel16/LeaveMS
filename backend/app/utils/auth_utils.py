import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Import your database and models
from app.database import get_db
from app.models.user_model import User

load_dotenv()

# --- Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# This tells FastAPI that the token should be in the "Authorization" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Password hashing setup
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password Hashing Logic ---

def verify_password(plain_password, hashed_password):
    return password_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return password_context.hash(password)

# --- Dependency: Get Current User ---

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Decodes the JWT token to find the user in the database.
    Used in routes like: @router.get("/", current_user = Depends(get_current_user))
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the token using the same Secret Key and Algorithm as auth_service
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        # This happens if the token is expired, tampered with, or signed with a different key
        raise credentials_exception
        
    # Fetch the actual User object from the database
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
        
    return user 
