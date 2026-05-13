"""
Run once to seed the first admin account.
  cd backend
  venv\Scripts\python seed_admin.py
"""
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.admin import Admin

ADMIN_EMAIL    = "admin@cicilin.id"
ADMIN_PASSWORD = "Admin@1234"
ADMIN_NAME     = "Super Admin"


def seed():
    db = SessionLocal()
    try:
        if db.query(Admin).filter(Admin.email == ADMIN_EMAIL).first():
            print(f"[seed] Admin already exists: {ADMIN_EMAIL}")
            return

        admin = Admin(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            full_name=ADMIN_NAME,
        )
        db.add(admin)
        db.commit()
        print(f"[seed] Admin created successfully.")
        print(f"       Email    : {ADMIN_EMAIL}")
        print(f"       Password : {ADMIN_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
