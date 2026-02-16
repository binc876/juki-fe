#!/bin/bash

echo "🚀 Starting deployment..."

# Stop the service
echo "⏹️ Stopping service..."
pm2 stop juki-fe || true

# Clear caches
echo "🧹 Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# Install dependencies (in case of updates)
echo "📦 Installing dependencies..."
npm ci --production=false

# Build the application
echo "🔨 Building application..."
NODE_ENV=production npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    echo "❌ Build failed - .next directory not found"
    exit 1
fi

echo "✅ Build successful"

# Start the service
echo "▶️ Starting service..."
pm2 start ecosystem.config.js || pm2 start npm --name "juki-fe" -- start

# Show status
pm2 status

echo "🎉 Deployment complete!"
echo "🌐 Application should be available at https://juki-hub.rurustudio.cloud"