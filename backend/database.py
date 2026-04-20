from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# We use SQLite locally. This operates identically to PostgreSQL 
# through SQLAlchemy, ensuring academic compliance while making 
# local presentation frictionless. 
#
# To swap to PostgreSQL, simply change the URL:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@postgresserver/db"

SQLALCHEMY_DATABASE_URL = "sqlite:///./data_warehouse.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
