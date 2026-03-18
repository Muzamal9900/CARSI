"""Seed admin user + demo courses into production database.

Run via: fly ssh console --app carsi-backend -C "/app/.venv/bin/python /app/scripts/seed_production.py"
Or via: python scripts/seed_production.py (with DATABASE_URL env var set)
"""

import os
import sys

# Allow running from project root or from inside the container
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "backend"))
sys.path.insert(0, "/app")

from sqlalchemy import create_engine, text

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:Nn5lGdB8O438dCk@carsi-db.flycast:5432/postgres",
)
# Normalise scheme for SQLAlchemy
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DB_URL)

ADMIN_ID = "ecb3011b-04b8-462f-9a5f-2f2bedcf761f"
INSTRUCTOR_ID = "e879d5c4-5a69-4c03-8e5e-49b52eee13b7"
STUDENT_ID = "87159e2e-39ff-4cbc-acfd-2f85cff07bd0"

# bcrypt hash of "admin123"
ADMIN_HASH = "$2b$12$LJ3m4ks5QvYzqPgBPfwBiuzCHlRPpJK2HT5G3H7VjxYmMzU./JXXu"

COURSES = [
    {
        "id": "75a01990-bef0-42d4-9c2c-6aa36c3ec34a",
        "title": "Water Restoration Technician (WRT)",
        "slug": "wrt-water-restoration-technician",
        "description": "IICRC-approved Water Restoration Technician course covering the principles and practices of water damage restoration. Learn moisture measurement, drying science, and structural drying techniques used in the Australian restoration industry.",
        "short_description": "Master water damage restoration fundamentals with IICRC CECs.",
        "price_aud": 500.00,
        "level": "beginner",
        "category": "Water Restoration",
        "iicrc_discipline": "WRT",
        "cec_hours": 8.0,
        "status": "published",
        "is_published": True,
    },
    {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "title": "Carpet Repair & Reinstallation Technician (CRT)",
        "slug": "crt-carpet-repair-reinstallation",
        "description": "IICRC-approved Carpet Repair and Reinstallation Technician course. Learn seaming, stretching, and re-installation techniques for residential and commercial carpet restoration across Australian standards.",
        "short_description": "Professional carpet repair techniques with IICRC CECs.",
        "price_aud": 450.00,
        "level": "intermediate",
        "category": "Carpet Restoration",
        "iicrc_discipline": "CRT",
        "cec_hours": 6.0,
        "status": "published",
        "is_published": True,
    },
    {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "title": "Odour Control Technician (OCT)",
        "slug": "oct-odour-control-technician",
        "description": "IICRC-approved Odour Control Technician course. Master the science of odour identification, source removal, and treatment methods for fire, smoke, and biological odours in Australian restoration projects.",
        "short_description": "Master odour identification and treatment with IICRC CECs.",
        "price_aud": 550.00,
        "level": "intermediate",
        "category": "Odour Control",
        "iicrc_discipline": "OCT",
        "cec_hours": 7.0,
        "status": "published",
        "is_published": True,
    },
    {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "title": "Applied Structural Drying (ASD)",
        "slug": "asd-applied-structural-drying",
        "description": "Advanced IICRC-approved Applied Structural Drying course. Covers psychrometry, equipment selection, drying chamber design, and monitoring techniques for complex structural drying projects in Australian conditions.",
        "short_description": "Advanced structural drying techniques with IICRC CECs.",
        "price_aud": 650.00,
        "level": "advanced",
        "category": "Structural Drying",
        "iicrc_discipline": "ASD",
        "cec_hours": 10.0,
        "status": "published",
        "is_published": True,
    },
    {
        "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
        "title": "Commercial Carpet & Textile Care (CCT)",
        "slug": "cct-commercial-carpet-textile-care",
        "description": "IICRC-approved Commercial Carpet and Textile Care course. Learn fibre identification, cleaning chemistry, and maintenance programmes for commercial environments across Australia.",
        "short_description": "Commercial carpet maintenance with IICRC CECs.",
        "price_aud": 495.00,
        "level": "beginner",
        "category": "Carpet Care",
        "iicrc_discipline": "CCT",
        "cec_hours": 6.0,
        "status": "published",
        "is_published": True,
    },
]


def seed():
    with engine.connect() as conn:
        # 1. Seed users
        print("Seeding users...")
        conn.execute(text("""
            INSERT INTO lms_users (id, email, full_name, hashed_password, role, is_active)
            VALUES
                (:admin_id, 'admin@carsi.com.au', 'CARSI Admin', :hash, 'admin', true),
                (:instructor_id, 'instructor@carsi.com.au', 'Sarah Mitchell', :hash, 'instructor', true),
                (:student_id, 'student@carsi.com.au', 'James Wilson', :hash, 'student', true)
            ON CONFLICT (id) DO NOTHING
        """), {
            "admin_id": ADMIN_ID,
            "instructor_id": INSTRUCTOR_ID,
            "student_id": STUDENT_ID,
            "hash": ADMIN_HASH,
        })
        print("  -> Users seeded (admin, instructor, student)")

        # 2. Seed courses
        print("Seeding courses...")
        for course in COURSES:
            conn.execute(text("""
                INSERT INTO lms_courses (
                    id, title, slug, description, short_description,
                    price_aud, level, category, iicrc_discipline,
                    cec_hours, status, is_published, instructor_id
                ) VALUES (
                    :id, :title, :slug, :description, :short_description,
                    :price_aud, :level, :category, :iicrc_discipline,
                    :cec_hours, :status, :is_published, :instructor_id
                ) ON CONFLICT (id) DO NOTHING
            """), {
                **course,
                "instructor_id": INSTRUCTOR_ID,
            })
            print(f"  -> {course['title']}")

        # 3. Enrol student in WRT course
        print("Creating demo enrolment...")
        conn.execute(text("""
            INSERT INTO lms_enrollments (id, student_id, course_id, status)
            VALUES (
                '530ea6ef-6576-492a-bd78-febf6d4ca0b0',
                :student_id,
                '75a01990-bef0-42d4-9c2c-6aa36c3ec34a',
                'active'
            ) ON CONFLICT (id) DO NOTHING
        """), {"student_id": STUDENT_ID})
        print("  -> James Wilson enrolled in WRT course")

        conn.commit()
        print("\nSeed complete!")

        # Verify
        result = conn.execute(text("SELECT count(*) FROM lms_courses WHERE status = 'published'"))
        count = result.scalar()
        print(f"Published courses: {count}")


if __name__ == "__main__":
    seed()
