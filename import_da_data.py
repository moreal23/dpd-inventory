import base64
import hashlib
import os
import sqlite3
from datetime import datetime
from pathlib import Path

SOURCE_DB = Path(r"c:\Users\monel\OneDrive\Desktop\DA\inventory_v2.db")
TARGET_ROOT = Path(__file__).resolve().parent
TARGET_D1_PATTERN = TARGET_ROOT / ".wrangler" / "state" / "v3" / "d1"

ITERATIONS = 200_000
KEY_LEN = 32


def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS, dklen=KEY_LEN)
    return f"{ITERATIONS}:{base64url_encode(salt)}:{base64url_encode(digest)}"


def find_d1_sqlite() -> Path:
    if not TARGET_D1_PATTERN.exists():
        raise FileNotFoundError(f"D1 local state directory not found: {TARGET_D1_PATTERN}")
    files = list(TARGET_D1_PATTERN.rglob("*.sqlite"))
    if not files:
        raise FileNotFoundError(f"No .sqlite D1 file found under {TARGET_D1_PATTERN}")
    if len(files) > 1:
        print("Warning: multiple .sqlite files found, using the first one:")
        for file in files:
            print(" -", file)
    return files[0]


def now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


def main():
    source = sqlite3.connect(SOURCE_DB)
    source.row_factory = sqlite3.Row
    target_path = find_d1_sqlite()
    target = sqlite3.connect(target_path)
    target.row_factory = sqlite3.Row

    now = now_iso()

    print(f"Importing from {SOURCE_DB}")
    print(f"Writing to {target_path}")

    with target:
        target.execute("PRAGMA foreign_keys = OFF")
        for table in ["history", "toner", "devices", "low_stock_alerts", "users"]:
            target.execute(f"DELETE FROM {table}")
        target.execute("DELETE FROM sessions")
        target.execute("PRAGMA foreign_keys = ON")

        # users from technicians
        technicians = source.execute("SELECT username, password, role FROM technicians").fetchall()
        inserted_users = 0
        for tech in technicians:
            username = tech["username"].strip()
            password = tech["password"].strip()
            role = tech["role"].strip() if tech["role"] else "technician"
            if not username or not password:
                continue
            target.execute(
                "INSERT INTO users (username, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (username, hash_password(password), role, now, now),
            )
            inserted_users += 1
        print(f"Imported {inserted_users} users.")

        # low stock alerts
        alerts = source.execute("SELECT device_type, threshold FROM low_stock_alerts").fetchall()
        alerted = 0
        for row in alerts:
            target.execute(
                "INSERT INTO low_stock_alerts (device_type, threshold, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (row["device_type"], row["threshold"], now, now),
            )
            alerted += 1
        print(f"Imported {alerted} low stock alerts.")

        # devices
        devices = source.execute("SELECT asset_tag, serial, type, model, status, assigned_to, department, notes, location FROM devices").fetchall()
        imported_devices = 0
        for row in devices:
            target.execute(
                "INSERT INTO devices (asset_tag, serial, type, model, status, assigned_to, department, notes, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (row["asset_tag"], row["serial"], row["type"], row["model"], row["status"], row["assigned_to"], row["department"], row["notes"], row["location"], now, now),
            )
            imported_devices += 1
        print(f"Imported {imported_devices} devices.")

        # history
        history = source.execute("SELECT asset_tag, serial, action, assigned_to, technician, timestamp FROM history").fetchall()
        imported_history = 0
        for row in history:
            target.execute(
                "INSERT INTO history (asset_tag, serial, action, assigned_to, technician, timestamp, actor_user_id) VALUES (?, ?, ?, ?, ?, ?, NULL)",
                (row["asset_tag"], row["serial"], row["action"], row["assigned_to"], row["technician"], row["timestamp"]),
            )
            imported_history += 1
        print(f"Imported {imported_history} history rows.")

        # toner
        toner = source.execute("SELECT serial, color, model, printer_asset, location, status, notes FROM toner").fetchall()
        imported_toner = 0
        for row in toner:
            target.execute(
                "INSERT INTO toner (serial, color, model, printer_asset, location, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (row["serial"], row["color"], row["model"], row["printer_asset"], row["location"], row["status"], row["notes"], now, now),
            )
            imported_toner += 1
        print(f"Imported {imported_toner} toner rows.")

    source.close()
    target.close()
    print("Import complete.")


if __name__ == "__main__":
    main()
