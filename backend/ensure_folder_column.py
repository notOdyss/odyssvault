from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    cols = conn.execute(text("PRAGMA table_info(notes)")).fetchall()
    names = [c[1] for c in cols]
    if "folder_id" in names:
        print("folder_id column already present")
    else:
        conn.execute(text("ALTER TABLE notes ADD COLUMN folder_id INTEGER"))
        print("Added folder_id column to notes")