from app.api.deps import get_db
from sqlalchemy import text

db = next(get_db())
try:
    db.execute(text("UPDATE alembic_version SET version_num='a7536a5c35a3'"))
    db.commit()
    print("Version reset successfully")
except Exception as e:
    print(f"Error resetting version: {e}")
