#!/bin/bash

echo "🚀 Starting deployment..."

# Stop the service
echo "⏹️ Stopping service..."
pm2 stop juki-fe || true
pm2 delete juki-fe || true

# Clear caches completely
echo "🧹 Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf out

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

# Check if static files exist
if [ ! -d ".next/static" ]; then
    echo "❌ Build failed - .next/static directory not found"
    exit 1
fi

echo "✅ Build successful"
echo "📁 Static files:"
ls -la .next/static/chunks/ | head -5

# Create logs directory
mkdir -p logs

# Set proper permissions
echo "🔐 Setting permissions..."
chmod -R 755 .next/
chmod -R 755 logs/

# Start the service with ecosystem config
echo "▶️ Starting service..."
pm2 start ecosystem.config.js

# Wait a moment for service to start
sleep 5

# Show status
pm2 status

# Test if service is responding
echo "🧪 Testing service..."
if curl -s http://localhost:3002 > /dev/null; then
    echo "✅ Service is responding"
else
    echo "❌ Service not responding"
    echo "📋 Checking logs..."
    pm2 logs juki-fe --lines 10
fi

# Test static file serving
echo "🧪 Testing static file serving..."
if curl -s -I http://localhost:3002/_next/static/ | grep -q "200\|404"; then
    echo "✅ Static file endpoint accessible"
else
    echo "❌ Static file endpoint not accessible"
fi

echo "🎉 Deployment complete!"
echo "🌐 Application should be available at https://juki-hub.rurustudio.cloud"
echo "📋 To check logs: pm2 logs juki-fe"