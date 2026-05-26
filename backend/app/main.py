from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.routes import calender_route, leave_balance_route, leave_type_route

# Import the database connection and Base
from .database import get_db, engine, Base
from .routes import auth_route, leave_application_route


Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(auth_route.router)
app.include_router(leave_application_route.router)
app.include_router(leave_type_route.router)
app.include_router(leave_application_route.router)
app.include_router(leave_balance_route.router)
app.include_router(calender_route.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Leave Management System API!"}

@app.get("/test-db")
def test_connection(db: Session = Depends(get_db)):
    # This simple query confirms the connection is active
    return {"message": "Successfully connected to the database!"}

