import sqlite3
from datetime import datetime, timedelta
from pathlib import Path


TARGET_ROOT = Path(__file__).resolve().parent.parent
TARGET_D1_PATTERN = TARGET_ROOT / ".wrangler" / "state" / "v3" / "d1"


def find_d1_sqlite() -> Path:
    if not TARGET_D1_PATTERN.exists():
        raise FileNotFoundError(f"D1 local state directory not found: {TARGET_D1_PATTERN}")
    files = list(TARGET_D1_PATTERN.rglob("*.sqlite"))
    if not files:
        raise FileNotFoundError(f"No .sqlite D1 file found under {TARGET_D1_PATTERN}")
    return files[0]


def stamp(days_ago: int, hour: int) -> str:
    value = datetime.now() - timedelta(days=days_ago)
    value = value.replace(hour=hour, minute=(days_ago * 7) % 60, second=0, microsecond=0)
    return value.strftime("%Y-%m-%d %H:%M:%S")


def device_rows():
    specs = [
        ("Laptop", "Dell Latitude 7450", "In Stock", "", "", "Central Supply"),
        ("Laptop", "HP EliteBook 840 G10", "Deployed", "Officer Hayes", "Special Ops", "Downtown Precinct"),
        ("Laptop", "Lenovo ThinkPad T14 Gen 4", "Deployed", "Detective Price", "Investigations", "HQ Floor 4"),
        ("Laptop", "Dell Latitude 5440", "In Stock", "", "", "Tech Bench"),
        ("Laptop", "HP ProBook 450 G10", "Deployed", "Sgt. Monroe", "Training", "Academy"),
        ("Laptop", "Lenovo ThinkPad L14", "In Stock", "", "", "Central Supply"),
        ("Laptop", "Dell Latitude 7440", "Deployed", "Officer Carter", "Patrol", "Northeast"),
        ("Laptop", "HP EliteBook 845", "In Stock", "", "", "Warehouse A"),
        ("Desktop", "Dell OptiPlex 7010", "Deployed", "Records Desk 2", "Records", "HQ Floor 2"),
        ("Desktop", "HP ProDesk 600 G6", "In Stock", "", "", "Central Supply"),
        ("Desktop", "Lenovo ThinkCentre M80s", "Deployed", "Dispatch Pod 4", "Dispatch", "Communications"),
        ("Desktop", "Dell OptiPlex 7000", "Deployed", "Evidence Intake", "Property", "Property Room"),
        ("Desktop", "HP Elite SFF 800", "In Stock", "", "", "Warehouse B"),
        ("Desktop", "Lenovo ThinkCentre M70s", "Deployed", "Admin Office 3", "Administration", "HQ Floor 1"),
        ("Monitor", 'Dell P2422H 24"', "In Stock", "", "", "Central Supply"),
        ("Monitor", 'HP E24 G5 24"', "Deployed", "Officer Hayes", "Special Ops", "Downtown Precinct"),
        ("Monitor", 'Dell P2723DE 27"', "Deployed", "Dispatch Pod 4", "Dispatch", "Communications"),
        ("Monitor", 'Lenovo T24m-20 24"', "In Stock", "", "", "Tech Bench"),
        ("Monitor", 'HP E27 G4 27"', "Deployed", "Records Desk 2", "Records", "HQ Floor 2"),
        ("Monitor", 'Dell U2424H 24"', "In Stock", "", "", "Warehouse B"),
        ("TV", 'Samsung 55" UHD Signage', "Deployed", "Roll Call Room", "Training", "Academy"),
        ("TV", 'LG 50" Commercial Display', "In Stock", "", "", "Warehouse A"),
        ("TV", 'Sony 65" Bravia Pro', "In Stock", "", "", "Warehouse A"),
        ("Dock", "Dell WD22TB4", "Deployed", "Detective Price", "Investigations", "HQ Floor 4"),
        ("Dock", "HP Thunderbolt Dock G4", "In Stock", "", "", "Central Supply"),
        ("Dock", "Lenovo ThinkPad Universal USB-C Dock", "Deployed", "Officer Carter", "Patrol", "Northeast"),
        ("Dock", "Dell WD19S", "In Stock", "", "", "Tech Bench"),
        ("Printer", "HP LaserJet Enterprise MFP M528", "Deployed", "Front Desk", "Administration", "HQ Lobby"),
        ("Printer", "Brother HL-L6400DW", "Deployed", "Records Office", "Records", "HQ Floor 2"),
        ("Printer", "Lexmark MX722ade", "In Stock", "", "", "Warehouse B"),
        ("Printer", "HP Color LaserJet Pro M479fdw", "Deployed", "Training Office", "Training", "Academy"),
        ("Printer", "Brother MFC-L6900DW", "In Stock", "", "", "Central Supply"),
        ("Laptop", "Panasonic Toughbook 40", "Deployed", "Crime Scene Unit", "CSI", "Garage East"),
        ("Monitor", 'Samsung ViewFinity 27"', "In Stock", "", "", "Warehouse C"),
        ("Desktop", "Dell Precision 3660", "Deployed", "Video Review", "Investigations", "HQ Floor 5"),
        ("Dock", "Plugable TBT4-UDZ", "In Stock", "", "", "Warehouse C"),
    ]

    rows = []
    base_day = 2
    for index, (device_type, model, status, assigned_to, department, location) in enumerate(specs, start=1):
        asset_tag = f"DPD-{10000 + index}"
        serial = f"SN-{device_type[:3].upper()}-{200000 + index}"
        created_at = stamp(base_day + index, 9)
        updated_at = stamp((index * 3) % 17, 14)
        rows.append(
            (
                asset_tag,
                serial,
                device_type,
                model,
                status,
                assigned_to,
                department,
                f"Demo seed item {index} for responsive UI and workflow testing.",
                location,
                created_at,
                updated_at,
            )
        )
    return rows


def toner_rows():
    specs = [
        ("Black", "HP 89X", "DPD-10028", "HQ Lobby", "In Stock"),
        ("Black", "HP 89X", "DPD-10029", "HQ Floor 2", "Installed"),
        ("Black", "Brother TN-850", "DPD-10032", "Central Supply", "In Stock"),
        ("Black", "Lexmark 58D1H00", "DPD-10030", "Warehouse B", "In Stock"),
        ("Black", "HP 414X", "DPD-10031", "Academy", "Installed"),
        ("Cyan", "HP 414X", "DPD-10031", "Academy", "In Stock"),
        ("Cyan", "HP 414A", "DPD-10028", "HQ Lobby", "In Stock"),
        ("Cyan", "Brother TN-436C", "DPD-10032", "Central Supply", "Installed"),
        ("Magenta", "HP 414X", "DPD-10031", "Academy", "In Stock"),
        ("Magenta", "HP 414A", "DPD-10028", "HQ Lobby", "Installed"),
        ("Magenta", "Brother TN-436M", "DPD-10032", "Central Supply", "In Stock"),
        ("Yellow", "HP 414X", "DPD-10031", "Academy", "In Stock"),
        ("Yellow", "HP 414A", "DPD-10028", "HQ Lobby", "Installed"),
        ("Yellow", "Brother TN-436Y", "DPD-10032", "Central Supply", "In Stock"),
        ("Black", "Canon 055H", "", "Warehouse C", "In Stock"),
        ("Cyan", "Canon 055", "", "Warehouse C", "In Stock"),
        ("Magenta", "Canon 055", "", "Warehouse C", "In Stock"),
        ("Yellow", "Canon 055", "", "Warehouse C", "In Stock"),
    ]

    rows = []
    for index, (color, model, printer_asset, location, status) in enumerate(specs, start=1):
        rows.append(
            (
                f"TON-{color[:1]}-{300000 + index}",
                color,
                model,
                printer_asset,
                location,
                status,
                f"{color} toner demo stock item {index}.",
                stamp((index * 2) % 15, 11),
                stamp((index * 3) % 12, 15),
            )
        )
    return rows


def history_rows(devices):
    assignments = {}
    for asset_tag, serial, _, _, status, assigned_to, _, _, _, _, _ in devices:
        assignments[asset_tag] = (serial, status, assigned_to)

    events = []
    technicians = ["admin", "robinp", "tech1", "shiftlead", "monroe"]
    offsets = [35, 28, 24, 20, 17, 14, 11, 8, 5, 3, 1]
    tracked_assets = [
        "DPD-10002", "DPD-10003", "DPD-10005", "DPD-10007", "DPD-10009",
        "DPD-10011", "DPD-10012", "DPD-10016", "DPD-10017", "DPD-10019",
        "DPD-10021", "DPD-10024", "DPD-10026", "DPD-10028", "DPD-10029",
        "DPD-10031", "DPD-10033", "DPD-10035",
    ]

    for index, asset_tag in enumerate(tracked_assets):
        serial, status, assigned_to = assignments[asset_tag]
        tech = technicians[index % len(technicians)]
        deploy_time = stamp(offsets[index % len(offsets)], 10)
        events.append((asset_tag, serial, "DEPLOYED", assigned_to or f"Unit {index + 1}", tech, deploy_time))
        if status == "In Stock":
            return_time = stamp(max(0, offsets[index % len(offsets)] - 2), 16)
            events.append((asset_tag, serial, "RETURNED", "", technicians[(index + 1) % len(technicians)], return_time))

    events.sort(key=lambda row: row[5], reverse=True)
    return events


def alert_rows():
    created = stamp(45, 8)
    updated = stamp(1, 9)
    return [
        ("Laptop", 6, created, updated),
        ("Desktop", 4, created, updated),
        ("Monitor", 5, created, updated),
        ("TV", 2, created, updated),
        ("Dock", 4, created, updated),
        ("Printer", 3, created, updated),
    ]


def audit_rows(history):
    rows = []
    for index, event in enumerate(history[:24], start=1):
        asset_tag, _, action, assigned_to, technician, timestamp = event
        summary = f"{action.title()} {asset_tag}" + (f" for {assigned_to}" if assigned_to else "")
        rows.append((None, technician, action, summary, timestamp))
    return rows


def main():
    target_path = find_d1_sqlite()
    connection = sqlite3.connect(target_path)

    devices = device_rows()
    toner = toner_rows()
    history = history_rows(devices)
    alerts = alert_rows()
    audit = audit_rows(history)

    with connection:
        connection.execute("PRAGMA foreign_keys = OFF")
        for table in ["audit_log", "history", "toner", "devices", "low_stock_alerts"]:
            connection.execute(f"DELETE FROM {table}")
        connection.execute("PRAGMA foreign_keys = ON")

        connection.executemany(
            """
            INSERT INTO devices (
              asset_tag, serial, type, model, status, assigned_to, department, notes, location, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            devices,
        )
        connection.executemany(
            """
            INSERT INTO toner (
              serial, color, model, printer_asset, location, status, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            toner,
        )
        connection.executemany(
            """
            INSERT INTO history (
              asset_tag, serial, action, assigned_to, technician, timestamp, actor_user_id
            ) VALUES (?, ?, ?, ?, ?, ?, NULL)
            """,
            history,
        )
        connection.executemany(
            """
            INSERT INTO low_stock_alerts (
              device_type, threshold, created_at, updated_at
            ) VALUES (?, ?, ?, ?)
            """,
            alerts,
        )
        connection.executemany(
            """
            INSERT INTO audit_log (
              actor_user_id, actor_username, action, summary, created_at
            ) VALUES (?, ?, ?, ?, ?)
            """,
            audit,
        )

    connection.close()
    print(f"Seeded local D1 database at {target_path}")
    print(f"Devices: {len(devices)}")
    print(f"Toner: {len(toner)}")
    print(f"History: {len(history)}")
    print(f"Alerts: {len(alerts)}")
    print("Users and sessions were preserved.")


if __name__ == "__main__":
    main()
