import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.db.session import SessionLocal
from app.api import settings, sharing
from app import models
from fastapi import Request

db = SessionLocal()

u = db.query(models.User).filter_by(username="demoahmet").first()
if not u:
    print("User not found.")
    sys.exit()

res = settings.get_settings(db, u)
print("Settings /me -> total_praise:", res.get("total_praise"))

res_pub = sharing.get_public_profile(username="demoahmet", db=db, current_user=None)
print("Public Profile -> total_praise:", res_pub.get("total_praise"))

