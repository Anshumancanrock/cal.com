#!/bin/bash

echo "🔍 GitPod Database Setup for Attributes"
echo "======================================="

# Check if database is accessible
echo "1. Checking database connection..."
npx prisma db pull --force 2>/dev/null && echo "✅ Database connected" || echo "❌ Database connection failed"

# Run Prisma Studio to inspect database
echo ""
echo "2. Opening Prisma Studio to check current data..."
echo "   - This will open in a new browser tab"
echo "   - Look for 'Attribute' and 'AttributeOption' tables"
echo "   - Check if any teams exist in 'Team' table"
echo ""

# Start Prisma Studio in background
npx prisma studio --port 5556 &
STUDIO_PID=$!

echo "Prisma Studio started at: https://5556-$GITPOD_WORKSPACE_ID.$GITPOD_WORKSPACE_CLUSTER_HOST"
echo ""

# Create test attributes using Prisma Client
echo "3. Creating test attributes..."
npx tsx scripts/quick-insert-attributes.ts

echo ""
echo "4. Verification:"
echo "   - Check Prisma Studio for new attributes"
echo "   - Restart your dev server: yarn dev"
echo "   - Test the 'Filter by attributes' dropdown"
echo ""
echo "To stop Prisma Studio: kill $STUDIO_PID"