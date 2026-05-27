from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

database_url = make_url(DATABASE_URL)

if database_url.drivername.startswith("mysql") and database_url.database:
    database_name = database_url.database.replace("`", "``")
    server_url = database_url.set(database="")
    server_engine = create_engine(server_url)

    with server_engine.connect() as connection:
        connection.execute(text(f"CREATE DATABASE IF NOT EXISTS `{database_name}`"))
        connection.commit()

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
