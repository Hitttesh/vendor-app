# vendor\backend\app\scripts/fill_sessions_vendor_id.py
import psycopg2
import base64
import json
import os
from psycopg2.extras import DictCursor

# adjust if needed
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:YOUR_PG_PASSWORD@localhost:5432/vendor_app_db")

def decode_jwt_payload(token):
    try:
        parts = token.split('.')
        if len(parts) < 2:
            return None
        b = parts[1]
        # pad base64
        padding = '=' * (-len(b) % 4)
        b += padding
        payload = base64.urlsafe_b64decode(b.encode('utf-8'))
        return json.loads(payload.decode('utf-8'))
    except Exception as e:
        return None

def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor(cursor_factory=DictCursor)
    cur.execute("SELECT id, token, vendor_id FROM sessions WHERE vendor_id IS NULL;")
    rows = cur.fetchall()
    print(f"Found {len(rows)} sessions with NULL vendor_id")
    for r in rows:
        sid = r['id']
        token = r['token']
        payload = decode_jwt_payload(token)
        if not payload:
            continue
        sub = payload.get('sub') or payload.get('sub')
        if isinstance(sub, str) and sub.startswith("vendor:"):
            try:
                vid = int(sub.split(":",1)[1])
            except:
                vid = None
            if vid:
                cur.execute("UPDATE sessions SET vendor_id = %s WHERE id = %s", (vid, sid))
                print(f"Updated session {sid} -> vendor_id {vid}")
    conn.commit()
    cur.close()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    main()
