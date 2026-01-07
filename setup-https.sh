#!/bin/bash

# =====================================================
# HTTPS Setup Script for kingcloud.live on Lightsail
# =====================================================

echo "🚀 Setting up HTTPS for kingcloud.live..."

# Step 1: Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Certbot
echo "🔐 Installing Certbot for Let's Encrypt..."
sudo apt install -y certbot

# Step 3: Stop any running containers (to free port 80)
echo "⏹️ Stopping Docker containers..."
docker compose down 2>/dev/null || true

# Step 4: Get SSL certificate
echo "📜 Obtaining SSL certificate..."
sudo certbot certonly --standalone -d kingcloud.live -d www.kingcloud.live --non-interactive --agree-tos --email your-email@example.com

# If the above fails, try without www
if [ $? -ne 0 ]; then
    echo "⚠️ Trying without www subdomain..."
    sudo certbot certonly --standalone -d kingcloud.live --non-interactive --agree-tos --email your-email@example.com
fi

# Step 5: Set permissions for certificates
echo "🔑 Setting certificate permissions..."
sudo chmod -R 755 /etc/letsencrypt/live/
sudo chmod -R 755 /etc/letsencrypt/archive/

# Step 6: Pull latest code
echo "📥 Pulling latest code..."
git pull origin cloudflare-prod

# Step 7: Start containers
echo "🐳 Starting Docker containers..."
docker compose up -d --build

# Step 8: Set up auto-renewal
echo "⏰ Setting up certificate auto-renewal..."
echo "0 0 1 * * root certbot renew --quiet && docker compose restart nginx" | sudo tee /etc/cron.d/certbot-renewal

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Your site should now be available at:"
echo "   https://kingcloud.live"
echo "   https://www.kingcloud.live"
echo ""
echo "📋 To check logs:"
echo "   docker compose logs -f"
echo ""
echo "🔄 To restart:"
echo "   docker compose restart"
