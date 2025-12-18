import re
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import Note, Folder, User, Vault, NoteVersion, note_links
from schemas import (
    NoteCreate, NoteUpdate, NoteResponse,
    FolderCreate, FolderUpdate, FolderResponse,
    GraphData, GraphNode, GraphEdge,
    UserCreate, UserLogin, UserResponse, TokenResponse,
    VaultCreate, VaultResponse,
    NoteVersionResponse
)
from auth import (
    get_password_hash, authenticate_user, create_access_token,
    get_current_user, get_current_user_required, create_guest_user,
    get_user_by_email, get_user_by_username
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Odyss Notes API",
    description="REST API for markdown notes with .od extension, folders, and linking.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_links(content: str) -> List[str]:
    pattern = r'\[\[([^\]]+)\]\]'
    return re.findall(pattern, content)


def update_note_links(db: Session, note: Note):
    note.links_to = []
    link_titles = parse_links(note.content)

    for title in link_titles:
        target = db.query(Note).filter(Note.title == title).first()
        if target and target.id != note.id:
            note.links_to.append(target)

@app.get("/folders", response_model=List[FolderResponse], tags=["Folders"])
def get_folders(
    vault_id: Optional[int] = Query(None, description="Filter by vault"),
    db: Session = Depends(get_db)
):
    query = db.query(Folder)
    if vault_id is not None:
        query = query.filter(Folder.vault_id == vault_id)
    return query.all()


@app.post("/folders", response_model=FolderResponse, status_code=201, tags=["Folders"])
def create_folder(folder_data: FolderCreate, db: Session = Depends(get_db)):
    folder = Folder(
        name=folder_data.name,
        parent_id=folder_data.parent_id,
        vault_id=folder_data.vault_id
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@app.put("/folders/{folder_id}", response_model=FolderResponse, tags=["Folders"])
def update_folder(folder_id: int, folder_data: FolderUpdate, db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    if folder_data.name is not None:
        folder.name = folder_data.name
    if folder_data.parent_id is not None:
        folder.parent_id = folder_data.parent_id

    db.commit()
    db.refresh(folder)
    return folder


@app.delete("/folders/{folder_id}", tags=["Folders"])
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    db.query(Note).filter(Note.folder_id == folder_id).update({"folder_id": None})
    db.delete(folder)
    db.commit()
    return {"message": "Folder deleted"}

@app.get("/notes", response_model=List[NoteResponse], tags=["Notes"])
def get_notes(
    folder_id: Optional[int] = Query(None, description="Filter by folder"),
    vault_id: Optional[int] = Query(None, description="Filter by vault"),
    db: Session = Depends(get_db)
):
    query = db.query(Note)
    if folder_id is not None:
        query = query.filter(Note.folder_id == folder_id)
    if vault_id is not None:
        query = query.filter(Note.vault_id == vault_id)
    return query.order_by(Note.updated_at.desc()).all()


@app.get("/notes/{note_id}", response_model=NoteResponse, tags=["Notes"])
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@app.post("/notes", response_model=NoteResponse, status_code=201, tags=["Notes"])
def create_note(note_data: NoteCreate, db: Session = Depends(get_db)):
    note = Note(
        title=note_data.title.strip(),
        content=note_data.content,
        folder_id=note_data.folder_id,
        vault_id=note_data.vault_id
    )
    db.add(note)
    db.commit()

    update_note_links(db, note)
    db.commit()
    db.refresh(note)

    return note


@app.put("/notes/{note_id}", response_model=NoteResponse, tags=["Notes"])
def update_note(note_id: int, note_data: NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if (note_data.title is not None and note_data.title.strip() != note.title) or \
       (note_data.content is not None and note_data.content != note.content):
        version = NoteVersion(
            note_id=note.id,
            title=note.title,
            content=note.content
        )
        db.add(version)

    if note_data.title is not None:
        note.title = note_data.title.strip()
    if note_data.content is not None:
        note.content = note_data.content
    if note_data.folder_id is not None:
        note.folder_id = note_data.folder_id if note_data.folder_id > 0 else None

    note.updated_at = datetime.utcnow()
    update_note_links(db, note)
    db.commit()
    db.refresh(note)

    return note


@app.delete("/notes/{note_id}", tags=["Notes"])
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Note deleted"}


@app.get("/notes/{note_id}/versions", response_model=List[NoteVersionResponse], tags=["Versions"])
def get_note_versions(note_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    versions = db.query(NoteVersion).filter(NoteVersion.note_id == note_id).order_by(NoteVersion.created_at.desc()).all()
    return versions


@app.post("/notes/{note_id}/versions/{version_id}/restore", response_model=NoteResponse, tags=["Versions"])
def restore_note_version(note_id: int, version_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    version = db.query(NoteVersion).filter(
        NoteVersion.id == version_id,
        NoteVersion.note_id == note_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    current_version = NoteVersion(
        note_id=note.id,
        title=note.title,
        content=note.content
    )
    db.add(current_version)

    note.title = version.title
    note.content = version.content
    note.updated_at = datetime.utcnow()

    update_note_links(db, note)
    db.commit()
    db.refresh(note)

    return note


@app.get("/graph", response_model=GraphData, tags=["Graph"])
def get_graph(
    vault_id: Optional[int] = Query(None, description="Filter by vault"),
    db: Session = Depends(get_db)
):
    query = db.query(Note)
    if vault_id is not None:
        query = query.filter(Note.vault_id == vault_id)
    notes = query.all()

    nodes = [GraphNode(id=n.id, title=n.title, folder_id=n.folder_id) for n in notes]

    edges = []
    for note in notes:
        for linked in note.links_to:
            edges.append(GraphEdge(source=note.id, target=linked.id))

    return GraphData(nodes=nodes, edges=edges)


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy"}


@app.post("/auth/register", response_model=TokenResponse, status_code=201, tags=["Auth"])
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    default_vault = Vault(
        name="My Vault",
        owner_id=user.id,
        is_default=True
    )
    db.add(default_vault)
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        user=user
    )


@app.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        user=user
    )


@app.post("/auth/guest", response_model=TokenResponse, tags=["Auth"])
def guest_login(db: Session = Depends(get_db)):
    guest = create_guest_user(db)

    default_vault = Vault(
        name="Guest Vault",
        owner_id=guest.id,
        is_default=True
    )
    db.add(default_vault)
    db.commit()

    access_token = create_access_token(data={"sub": str(guest.id)})

    return TokenResponse(
        access_token=access_token,
        user=guest
    )


@app.get("/auth/me", response_model=UserResponse, tags=["Auth"])
async def get_me(current_user: User = Depends(get_current_user_required)):
    return current_user


@app.post("/auth/logout", tags=["Auth"])
async def logout(current_user: User = Depends(get_current_user_required)):
    return {"message": "Logged out successfully"}


@app.get("/vaults", response_model=List[VaultResponse], tags=["Vaults"])
async def get_vaults(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    return db.query(Vault).filter(Vault.owner_id == current_user.id).all()


@app.post("/vaults", response_model=VaultResponse, status_code=201, tags=["Vaults"])
async def create_vault(
    vault_data: VaultCreate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    vault_count = db.query(Vault).filter(Vault.owner_id == current_user.id).count()
    if vault_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maximum vault limit reached (3). Upgrade to create more."
        )

    vault = Vault(
        name=vault_data.name,
        owner_id=current_user.id
    )
    db.add(vault)
    db.commit()
    db.refresh(vault)

    return vault


@app.delete("/vaults/{vault_id}", tags=["Vaults"])
async def delete_vault(
    vault_id: int,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    vault = db.query(Vault).filter(
        Vault.id == vault_id,
        Vault.owner_id == current_user.id
    ).first()

    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")

    if vault.is_default:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete default vault"
        )

    db.delete(vault)
    db.commit()

    return {"message": "Vault deleted"}
