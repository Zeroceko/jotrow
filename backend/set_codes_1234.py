from app.api.deps import get_db
from app.models import User

db = next(get_db())
try:
    db.query(User).update({User.share_code: '1234'})
    db.commit()
    print("All users updated successfully")
except Exception as e:
    print(f"Error: {e}")
