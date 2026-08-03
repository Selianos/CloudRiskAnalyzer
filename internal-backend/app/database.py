import json
import uuid
from contextlib import contextmanager
from datetime import datetime

from sqlalchemy import (
    create_engine,
    String,
    ForeignKey,
    update,
    select,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    Session,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.config import DATABASE_URL


# ──────────────────────────────────────────────
# Engine
# ──────────────────────────────────────────────

engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=5)


@contextmanager
def get_session():
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise


# ──────────────────────────────────────────────
# ORM Models  (mirror the existing DB schema)
# ──────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


class Connection(Base):
    __tablename__ = "connections"

    id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id:     Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    name:        Mapped[str]       = mapped_column(String)
    provider:    Mapped[str]       = mapped_column(String)
    credentials: Mapped[str]       = mapped_column(String)   # Fernet-encrypted blob

    scan_jobs: Mapped[list["ScanJob"]] = relationship(back_populates="connection")


class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id:            Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    connection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("connections.id"))
    user_id:       Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    status:        Mapped[str]       = mapped_column(String, default="PENDING")
    created_at:    Mapped[datetime]

    connection: Mapped["Connection"] = relationship(back_populates="scan_jobs")


class Resource(Base):
    __tablename__ = "resources"

    id:                   Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_job_id:          Mapped[uuid.UUID] = mapped_column(ForeignKey("scan_jobs.id"))
    resource_type:        Mapped[str]       = mapped_column(String)
    provider_resource_id: Mapped[str]       = mapped_column(String)
    name:                 Mapped[str]       = mapped_column(String)
    region:               Mapped[str | None]= mapped_column(String, nullable=True)
    configuration:        Mapped[dict]      = mapped_column(JSONB)


class Finding(Base):
    __tablename__ = "findings"

    id:          Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("scan_jobs.id"))
    resource_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resources.id"))
    rule_id:     Mapped[str]       = mapped_column(ForeignKey("rules.id"))
    status:      Mapped[str]       = mapped_column(String)
    details:     Mapped[dict | None] = mapped_column(JSONB, nullable=True)


# ──────────────────────────────────────────────
# Query layer
# ──────────────────────────────────────────────

class ScanDatabase:

    @staticmethod
    def check_db() -> bool:
        from sqlalchemy import text
        try:
            with get_session() as db:
                db.execute(text("SELECT 1"))
            return True
        except Exception:
            return False

    @staticmethod
    def get_job(job_id: str) -> dict | None:
        with get_session() as db:
            job = db.get(ScanJob, uuid.UUID(job_id))

            if not job:
                return None

            return {
                "id":            str(job.id),
                "connection_id": str(job.connection_id),
                "status":        job.status,
                "provider":      job.connection.provider,
                "credentials":   job.connection.credentials,
            }

    @staticmethod
    def next_pending_job() -> dict | None:
        """
        Atomically claim the next PENDING job.
        with_for_update(skip_locked=True) ensures concurrent workers
        never pick up the same job.
        """
        with get_session() as db:
            stmt = (
                select(ScanJob)
                .where(ScanJob.status == "PENDING")
                .order_by(ScanJob.created_at)
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            job = db.scalars(stmt).first()

            if not job:
                return None

            job.status = "RUNNING"

            return {
                "id":            str(job.id),
                "connection_id": str(job.connection_id),
                "provider":      job.connection.provider,
                "credentials":   job.connection.credentials,
            }

    @staticmethod
    def update_status(job_id: str, status: str) -> None:
        with get_session() as db:
            db.execute(
                update(ScanJob)
                .where(ScanJob.id == uuid.UUID(job_id))
                .values(status=status)
            )

    @staticmethod
    def insert_resource(job_id: str, resource: dict) -> None:
        with get_session() as db:
            db.add(Resource(
                scan_job_id=          uuid.UUID(job_id),
                resource_type=        resource.get("resource_type"),
                provider_resource_id= resource.get("provider_resource_id"),
                name=                 resource.get("name"),
                region=               resource.get("region"),
                configuration=        resource.get("configuration", {}),
            ))

    @staticmethod
    def insert_finding(job_id: str, finding: dict) -> None:
        with get_session() as db:
            db.add(Finding(
                scan_job_id= uuid.UUID(job_id),
                resource_id= uuid.UUID(finding.get("resource_id")),
                rule_id=     finding.get("rule_id"),
                status=      finding.get("status"),
                details=     finding.get("details"),
            ))
