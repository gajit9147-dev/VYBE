#!/bin/bash
set -e
service postgresql start
service redis-server start

su - postgres <<'EOF'
psql -c "CREATE USER vybe WITH PASSWORD 'vybe_local_password_change_me' SUPERUSER;" || true
psql -c "CREATE DATABASE vybe OWNER vybe;" || true
psql -d vybe -c "CREATE EXTENSION IF NOT EXISTS postgis;" || true
EOF

sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/18/main/postgresql.conf || true
echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/18/main/pg_hba.conf || true
echo "host all all 127.0.0.1/32 trust" >> /etc/postgresql/18/main/pg_hba.conf || true
echo "host all all ::1/128 trust" >> /etc/postgresql/18/main/pg_hba.conf || true

service postgresql restart
echo "Services ready!"
