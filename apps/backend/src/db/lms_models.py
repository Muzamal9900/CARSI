"""
CARSI LMS — SQLAlchemy ORM Models

All LMS tables use the lms_ prefix to coexist cleanly with the starter
project's existing schema. Models map 1:1 to the 001_lms_core_schema migration.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from .models import Base  # shared Base from starter project


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------


class LMSRole(Base):
    __tablename__ = "lms_roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)

    user_roles = relationship("LMSUserRole", back_populates="role")


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class LMSUser(Base):
    __tablename__ = "lms_users"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(Text)
    bio = Column(Text)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    theme_preference = Column(String(10), default="light")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user_roles = relationship("LMSUserRole", back_populates="user", cascade="all, delete-orphan")
    courses_taught = relationship("LMSCourse", back_populates="instructor")
    enrollments = relationship("LMSEnrollment", back_populates="student", cascade="all, delete-orphan")
    cec_transactions = relationship("LMSCECTransaction", back_populates="student")
    certificates = relationship("LMSCertificate", back_populates="student")
    lesson_notes = relationship("LMSLessonNote", back_populates="student", cascade="all, delete-orphan")

    @property
    def roles(self) -> list[str]:
        return [ur.role.name for ur in self.user_roles if ur.role]


class LMSUserRole(Base):
    __tablename__ = "lms_user_roles"

    user_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("lms_roles.id", ondelete="CASCADE"), primary_key=True)
    granted_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("LMSUser", back_populates="user_roles")
    role = relationship("LMSRole", back_populates="user_roles")


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------


class LMSCourse(Base):
    __tablename__ = "lms_courses"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    short_description = Column(String(500))
    thumbnail_url = Column(Text)
    instructor_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_users.id"), nullable=False)
    status = Column(String(50), default="draft")  # draft|published|archived
    price_aud = Column(Numeric(10, 2), default=Decimal("0"))
    is_free = Column(Boolean, default=False)
    duration_hours = Column(Numeric(5, 1))
    level = Column(String(50))   # beginner|intermediate|advanced
    category = Column(String(100))
    tags = Column(JSONB, default=list)
    # IICRC & CPP40421 alignment
    iicrc_discipline = Column(String(10))          # WRT|CRT|OCT|ASD|CCT
    cec_hours = Column(Numeric(5, 1))
    cppp40421_unit_code = Column(String(20))
    cppp40421_unit_name = Column(Text)
    meta = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    instructor = relationship("LMSUser", back_populates="courses_taught")
    modules = relationship(
        "LMSModule",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="LMSModule.order_index",
    )
    enrollments = relationship("LMSEnrollment", back_populates="course")
    certificates = relationship("LMSCertificate", back_populates="course")
    cec_transactions = relationship("LMSCECTransaction", back_populates="course")


class LMSModule(Base):
    __tablename__ = "lms_modules"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    order_index = Column(Integer, nullable=False)
    is_preview = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    course = relationship("LMSCourse", back_populates="modules")
    lessons = relationship(
        "LMSLesson",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="LMSLesson.order_index",
    )


class LMSLesson(Base):
    __tablename__ = "lms_lessons"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_modules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    content_type = Column(String(50))  # video|pdf|text|quiz|drive_file
    content_body = Column(Text)
    drive_file_id = Column(String(255))
    duration_minutes = Column(Integer)
    order_index = Column(Integer, nullable=False)
    is_preview = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    module = relationship("LMSModule", back_populates="lessons")
    progress_records = relationship("LMSProgress", back_populates="lesson", cascade="all, delete-orphan")
    notes = relationship("LMSLessonNote", back_populates="lesson", cascade="all, delete-orphan")
    quiz = relationship("LMSQuiz", back_populates="lesson", uselist=False, cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Enrolments & Progress
# ---------------------------------------------------------------------------


class LMSEnrollment(Base):
    __tablename__ = "lms_enrollments"
    __table_args__ = (UniqueConstraint("student_id", "course_id", name="uq_lms_enrollment"),)

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_courses.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True))
    status = Column(String(50), default="active")  # active|completed|suspended
    payment_reference = Column(String(255))

    student = relationship("LMSUser", back_populates="enrollments")
    course = relationship("LMSCourse", back_populates="enrollments")
    progress_records = relationship("LMSProgress", back_populates="enrollment", cascade="all, delete-orphan")

    @property
    def completion_percentage(self) -> float:
        if not self.course or not self.course.modules:
            return 0.0
        total = sum(len(m.lessons) for m in self.course.modules)
        if total == 0:
            return 0.0
        completed = sum(1 for p in self.progress_records if p.completed_at)
        return round((completed / total) * 100, 1)


class LMSProgress(Base):
    __tablename__ = "lms_progress"
    __table_args__ = (UniqueConstraint("enrollment_id", "lesson_id", name="uq_lms_progress"),)

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_enrollments.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_lessons.id", ondelete="CASCADE"), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    time_spent_seconds = Column(Integer, default=0)

    enrollment = relationship("LMSEnrollment", back_populates="progress_records")
    lesson = relationship("LMSLesson", back_populates="progress_records")


# ---------------------------------------------------------------------------
# Assessments
# ---------------------------------------------------------------------------


class LMSQuiz(Base):
    __tablename__ = "lms_quizzes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_lessons.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    pass_percentage = Column(Integer, default=70)
    time_limit_minutes = Column(Integer)
    attempts_allowed = Column(Integer, default=3)

    lesson = relationship("LMSLesson", back_populates="quiz")
    questions = relationship(
        "LMSQuizQuestion",
        back_populates="quiz",
        cascade="all, delete-orphan",
        order_by="LMSQuizQuestion.order_index",
    )
    attempts = relationship("LMSQuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class LMSQuizQuestion(Base):
    __tablename__ = "lms_quiz_questions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="multiple_choice")
    options = Column(JSONB)  # [{"text": "...", "is_correct": true}]
    explanation = Column(Text)
    order_index = Column(Integer, nullable=False)
    points = Column(Integer, default=1)

    quiz = relationship("LMSQuiz", back_populates="questions")


class LMSQuizAttempt(Base):
    __tablename__ = "lms_quiz_attempts"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_users.id", ondelete="CASCADE"), nullable=False)
    answers = Column(JSONB)
    score_percentage = Column(Numeric(5, 2))
    passed = Column(Boolean)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True))

    quiz = relationship("LMSQuiz", back_populates="attempts")
    student = relationship("LMSUser")


# ---------------------------------------------------------------------------
# IICRC CEC Tracking & Certificates
# ---------------------------------------------------------------------------


class LMSCertificate(Base):
    __tablename__ = "lms_certificates"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_courses.id"), nullable=False)
    credential_id = Column(String(30), unique=True, nullable=False)
    pdf_drive_file_id = Column(String(255))
    pdf_url = Column(Text)
    issued_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    is_revoked = Column(Boolean, default=False)

    student = relationship("LMSUser", back_populates="certificates")
    course = relationship("LMSCourse", back_populates="certificates")
    cec_transactions = relationship("LMSCECTransaction", back_populates="certificate")


class LMSCECTransaction(Base):
    __tablename__ = "lms_cec_transactions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_courses.id"), nullable=False)
    certificate_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_certificates.id"))
    iicrc_discipline = Column(String(10))
    cec_hours = Column(Numeric(5, 1), nullable=False)
    earned_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    student = relationship("LMSUser", back_populates="cec_transactions")
    course = relationship("LMSCourse", back_populates="cec_transactions")
    certificate = relationship("LMSCertificate", back_populates="cec_transactions")


# ---------------------------------------------------------------------------
# Lesson Notes
# ---------------------------------------------------------------------------


class LMSLessonNote(Base):
    __tablename__ = "lms_lesson_notes"
    __table_args__ = (UniqueConstraint("student_id", "lesson_id", name="uq_lms_lesson_note"),)

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_users.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(PGUUID(as_uuid=True), ForeignKey("lms_lessons.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("LMSUser", back_populates="lesson_notes")
    lesson = relationship("LMSLesson", back_populates="notes")


# ---------------------------------------------------------------------------
# Google Drive Assets
# ---------------------------------------------------------------------------


class LMSDriveAsset(Base):
    __tablename__ = "lms_drive_assets"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drive_file_id = Column(String(255), unique=True, nullable=False)
    file_name = Column(String(500), nullable=False)
    mime_type = Column(String(100))
    file_size_bytes = Column(BigInteger)
    drive_url = Column(Text)
    uploaded_by = Column(PGUUID(as_uuid=True), ForeignKey("lms_users.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    uploader = relationship("LMSUser")
