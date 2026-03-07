from app.api.deps import get_db
from app.models import Note

db = next(get_db())
note = db.query(Note).filter(Note.id == 1).first()
print(f"Note 1 praise_count: {note.praise_count}")
if note.praise_count is None:
    note.praise_count = 0
note.praise_count += 1
db.commit()
print(f"Note 1 praise_count after: {note.praise_count}")
