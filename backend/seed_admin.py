"""Run this once to create the dummy admin account.
Usage: python seed_admin.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.admin import Admin

EMAIL = "admin@loanapp.com"
PASSWORD = "admin123"
FULL_NAME = "Admin"

db = SessionLocal()
try:
    existing = db.query(Admin).filter(Admin.email == EMAIL).first()
    if existing:
        print(f"Admin already exists: {EMAIL}")
    else:
        admin = Admin(email=EMAIL, password_hash=hash_password(PASSWORD), full_name=FULL_NAME)
        db.add(admin)
        db.commit()
        print(f"Admin created: {EMAIL} / {PASSWORD}")
finally:
    db.close()
