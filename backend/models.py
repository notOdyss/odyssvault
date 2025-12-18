from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_guest = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    vaults = relationship("Vault", back_populates="owner", cascade="all, delete-orphan")


class Vault(Base):
    __tablename__ = "vaults"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="vaults")
    folders = relationship("Folder", back_populates="vault", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="vault", cascade="all, delete-orphan")


note_links = Table(
    'note_links',
    Base.metadata,
    Column('source_id', Integer, ForeignKey('notes.id'), primary_key=True),
    Column('target_id', Integer, ForeignKey('notes.id'), primary_key=True)
)


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey('folders.id'), nullable=True)
    vault_id = Column(Integer, ForeignKey('vaults.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    vault = relationship("Vault", back_populates="folders")
    notes = relationship("Note", back_populates="folder")
    children = relationship("Folder", backref="parent", remote_side=[id])


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False, default="")
    folder_id = Column(Integer, ForeignKey('folders.id'), nullable=True)
    vault_id = Column(Integer, ForeignKey('vaults.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    vault = relationship("Vault", back_populates="notes")
    folder = relationship("Folder", back_populates="notes")
    versions = relationship("NoteVersion", back_populates="note", cascade="all, delete-orphan", order_by="desc(NoteVersion.created_at)")

    links_to = relationship(
        "Note",
        secondary=note_links,
        primaryjoin=id == note_links.c.source_id,
        secondaryjoin=id == note_links.c.target_id,
        backref="linked_from"
    )

    @property
    def filename(self):
        return f"{self.title}.od"


class NoteVersion(Base):
    __tablename__ = "note_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    note_id = Column(Integer, ForeignKey('notes.id'), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    note = relationship("Note", back_populates="versions")
