"""
CITK Hostel Management System - Data Migration Script (SQLite to Supabase)
========================================================================
This script migrates data from the existing Flask SQLite database (instance/database.db)
to your new Supabase PostgreSQL database, mapping user IDs to Supabase Auth UUIDs.

Requirements:
    pip install supabase requests python-dotenv

Usage:
    python scripts/migrate_sqlite_to_supabase.py
"""

import os
import sqlite3
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('.env.local')
load_dotenv('.env')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), "../instance/database.db")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or "placeholder" in SUPABASE_URL:
    print("❌ ERROR: Please set valid NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before running migration.")
    exit(1)

if not os.path.exists(SQLITE_DB_PATH):
    print(f"❌ ERROR: SQLite database file not found at {SQLITE_DB_PATH}")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
conn = sqlite3.connect(SQLITE_DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

def main():
    print("🚀 Starting migration from SQLite to Supabase...")

    # Mapping from SQLite user ID (int) -> Supabase auth User UUID (str)
    user_id_map = {}
    complaint_id_map = {}
    diary_id_map = {}

    # 1. Migrate Users & Profiles
    print("\n--- 1. Migrating Users ---")
    users = cur.execute("SELECT * FROM user").fetchall()
    for u in users:
        sqlite_uid = u["id"]
        email = u["email"].strip().lower()
        username = u["username"].strip()
        role = u["role"].strip() if u["role"] else "student"
        if role not in ["student", "admin", "warden"]:
            role = "student"
        hostel = u["hostel"].strip() if u["hostel"] else "SJ"
        if hostel not in ['SNM', 'SJ', 'JD', 'BJ', 'Bakhungri', 'Gambari']:
            hostel = "SJ"
        room_no = str(u["room_no"]) if u["room_no"] else "N/A"
        profile_pic = u["profile_pic"]

        # Create or fetch Supabase Auth user
        try:
            # Create user via Supabase admin API
            auth_res = supabase.auth.admin.create_user({
                "email": email,
                "password": "TemporaryPassword123!", # users can reset via email
                "email_confirm": True,
                "user_metadata": {
                    "username": username,
                    "hostel": hostel,
                    "room_no": roomNo if 'roomNo' in locals() else room_no,
                    "role": role,
                }
            })
            new_uid = auth_res.user.id
            print(f"  ✅ Created Auth user for {email} -> {new_uid}")
        except Exception as e:
            print(f"  ⚠️ Auth user creation notice ({email}): {e}. Attempting lookup...")
            # If user already exists in auth, query profiles
            profile_res = supabase.table("profiles").select("id").eq("email", email).execute()
            if profile_res.data and len(profile_res.data) > 0:
                new_uid = profile_res.data[0]["id"]
            else:
                print(f"  ❌ Skipping user {email}")
                continue

        user_id_map[sqlite_uid] = new_uid

        # Upsert profile record
        supabase.table("profiles").upsert({
            "id": new_uid,
            "username": username,
            "email": email,
            "hostel": hostel,
            "room_no": room_no,
            "role": role,
            "profile_pic_url": profile_pic
        }).execute()

    # 2. Migrate Complaints
    print("\n--- 2. Migrating Complaints ---")
    complaints = cur.execute("SELECT * FROM complaint").fetchall()
    for c in complaints:
        old_uid = c["user_id"]
        new_uid = user_id_map.get(old_uid)
        if not new_uid:
            print(f"  ⚠️ Skipping complaint {c['id']}: owner user {old_uid} not found")
            continue

        hostel = c["hostel"] if c["hostel"] in ['SNM', 'SJ', 'JD', 'BJ', 'Bakhungri', 'Gambari'] else "SJ"
        category = c["category"] if c["category"] in [
            'Electricity', 'Water', 'Cleanliness', 'Food',
            'Furniture', 'Internet', 'Security', 'Bathroom', 'Other'
        ] else "Other"
        status = c["status"] if c["status"] in ['Pending', 'In Progress', 'Resolved'] else "Pending"

        res = supabase.table("complaints").insert({
            "user_id": new_uid,
            "hostel": hostel,
            "category": category,
            "description": c["description"],
            "status": status,
            "image_url": c["image"],
            "upvotes": c["upvotes"] or 1,
            "created_at": c["date_posted"]
        }).execute()

        if res.data and len(res.data) > 0:
            complaint_id_map[c["id"]] = res.data[0]["id"]
            print(f"  ✅ Migrated complaint {c['id']} -> {res.data[0]['id']}")

    # 3. Migrate Complaint Upvotes
    print("\n--- 3. Migrating Upvotes ---")
    upvotes = cur.execute("SELECT * FROM complaint_upvote").fetchall()
    for uv in upvotes:
        new_uid = user_id_map.get(uv["user_id"])
        new_cid = complaint_id_map.get(uv["complaint_id"])
        if new_uid and new_cid:
            try:
                supabase.table("complaint_upvotes").insert({
                    "user_id": new_uid,
                    "complaint_id": new_cid
                }).execute()
                print(f"  ✅ Migrated upvote for complaint {new_cid}")
            except Exception as e:
                pass

    # 4. Migrate Announcements
    print("\n--- 4. Migrating Announcements ---")
    announcements = cur.execute("SELECT * FROM announcement").fetchall()
    for a in announcements:
        hostel = a["hostel"] if a["hostel"] in ['SNM', 'SJ', 'JD', 'BJ', 'Bakhungri', 'Gambari'] else None
        supabase.table("announcements").insert({
            "title": a["title"],
            "message": a["message"],
            "hostel": hostel,
            "is_pinned": bool(a["is_pinned"]),
            "created_at": a["created_at"]
        }).execute()
        print(f"  ✅ Migrated announcement: {a['title']}")

    # 5. Migrate Hostel Diaries
    print("\n--- 5. Migrating Hostel Diaries ---")
    diaries = cur.execute("SELECT * FROM hostel_diary").fetchall()
    for d in diaries:
        new_uid = user_id_map.get(d["user_id"])
        if not new_uid:
            continue

        res = supabase.table("hostel_diaries").insert({
            "user_id": new_uid,
            "image_url": d["image"],
            "caption": d["caption"],
            "created_at": d["date_posted"]
        }).execute()

        if res.data and len(res.data) > 0:
            diary_id_map[d["id"]] = res.data[0]["id"]
            print(f"  ✅ Migrated diary memory {d['id']}")

    # 6. Migrate Feedback
    print("\n--- 6. Migrating Feedback ---")
    feedbacks = cur.execute("SELECT * FROM feedback").fetchall()
    for fb in feedbacks:
        supabase.table("feedback").insert({
            "username": fb["username"],
            "email": fb["email"],
            "feedback": fb["feedback"]
        }).execute()
        print(f"  ✅ Migrated feedback from {fb['username']}")

    print("\n🎉 Migration completed successfully!")

if __name__ == "__main__":
    main()
