import csv
import sqlite3
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
LEGACY_DB = BASE.parent / "inventory_v2.db"
EXPORT_DIR = BASE / "exports"
EXPORT_DIR.mkdir(exist_ok=True)

TABLES = {
    "devices": ["id", "asset_tag", "serial", "type", "model", "status", "assigned_to", "department", "notes", "location"],
    "history": ["id", "asset_tag", "serial", "action", "assigned_to", "technician", "timestamp"],
    "toner": ["id", "serial", "color", "model", "printer_asset", "location", "status", "notes"],
    "low_stock_alerts": ["id", "device_type", "threshold"],
}


def export_table(connection: sqlite3.Connection, name: str, columns: list[str]) -> None:
    rows = connection.execute(f"SELECT {', '.join(columns)} FROM {name}").fetchall()
    target = EXPORT_DIR / f"{name}.csv"
    with target.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(columns)
        writer.writerows(rows)
    print(f"Exported {len(rows)} rows -> {target}")


if __name__ == "__main__":
    if not LEGACY_DB.exists():
        raise SystemExit(f"Legacy database not found: {LEGACY_DB}")

    conn = sqlite3.connect(LEGACY_DB)
    try:
        for table_name, cols in TABLES.items():
            export_table(conn, table_name, cols)
    finally:
        conn.close()
