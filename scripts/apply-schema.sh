#!/bin/bash
set -e

echo "🔄 Applying schema changes..."

# Drop session table if exists
echo "Dropping old session table..."
PGPASSWORD=123456 psql -U postgres -h localhost -d contestdb -c "DROP TABLE IF EXISTS session CASCADE;" 2>/dev/null || true

# Now push schema
echo "Running drizzle-kit push..."
npx drizzle-kit push --yes 2>/dev/null || {
    echo "⚠️  Please run manually and select 'Yes' when prompted:"
    echo "   npx drizzle-kit push"
}

echo "✅ Schema applied!"
