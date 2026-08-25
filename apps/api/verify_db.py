import psycopg2
import re

env_content = open('.env').read()
match = re.search(r'DATABASE_URL=postgresql\+asyncpg://([^:]+):([^@]+)@([^/]+)/(.+)', env_content)
if match:
    user, pw, host_port, db = match.groups()
    pw = pw.replace('%40', '@')
    host, port = host_port.split(':')
    print(f"Connecting to DB: {db} as {user}")
    
    conn = psycopg2.connect(user=user, password=pw, host=host, port=port, dbname=db)
    cursor = conn.cursor()
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
    tables = cursor.fetchall()
    print("--- TABLES IN DATABASE ---")
    for t in tables:
        print(t[0])
    cursor.close()
    conn.close()
else:
    print('Failed to parse URL')
