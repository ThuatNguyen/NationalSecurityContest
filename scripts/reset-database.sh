#!/bin/bash

# Script to reset database and apply new schema with seed data
# Usage: ./scripts/reset-database.sh

set -e

echo "🔄 Resetting database..."

# Load database credentials from drizzle.config.ts or .env
# Default values (change these if different)
DB_NAME="national_security_contest"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo "📋 Database info:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Ask for confirmation
read -p "⚠️  This will DROP ALL TABLES and recreate them. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Aborted."
  exit 1
fi

echo ""
echo "Step 1: Dropping all tables..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "
DO \$\$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
"

echo "✅ All tables dropped."
echo ""

echo "Step 2: Running migration..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h $DB_HOST -d $DB_NAME -f migrations/0001_update_clusters_units.sql

echo "✅ Migration applied."
echo ""

echo "Step 3: Running seed..."
npm run seed

echo ""
echo "✅ Database reset complete!"
echo "🎉 You can now start the server and test the application."
