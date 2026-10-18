# Lightsail Deployment Guide for kingcloud.live

## Prerequisites
- AWS Lightsail instance with Node.js installed
- Domain `kingcloud.live` configured in DNS to point to your Lightsail IP
- Ports **3000** and **3001** open in Lightsail firewall

## Step 1: Open Required Ports in Lightsail

Since you're not using nginx, you need to open both ports in Lightsail:

1. Go to AWS Lightsail Console
2. Select your instance
3. Go to **Networking** tab
4. Add the following firewall rules:
   - **Port 3000** (TCP) - For the Next.js web application
   - **Port 3001** (TCP) - For the Socket.IO server

## Step 2: Clone/Upload Your Code

```bash
# SSH into your Lightsail instance
ssh -i your-key.pem ubuntu@your-lightsail-ip

# Navigate to your project directory or clone the repo
cd /home/ubuntu
git clone your-repo-url Chat-application-enhanced
cd Chat-application-enhanced
```

## Step 3: Install Dependencies

```bash
# Install Node.js 18+ if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm (or use npm)
npm install -g pnpm

# Install project dependencies
pnpm install
```

## Step 4: Configure Environment Variables

The `.env.production` file is already configured for your domain. Verify it:

```bash
cat .env.production
```

It should contain:
```
NEXT_PUBLIC_BASE_URL=http://kingcloud.live
NEXT_PUBLIC_SOCKET_URL=http://kingcloud.live:3001
SOCKET_PORT=3001
NEXT_PORT=3000
PORT=3000
NODE_ENV=production
```

## Step 5: Build the Application

```bash
pnpm build
```

## Step 6: Set Up Static Files for Standalone Build

After building, copy the static files:

```bash
# Copy static files to standalone build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
```

## Step 7: Run the Application

### Option A: Using the start script (Recommended)
```bash
node start-production.js
```

### Option B: Running separately (for debugging)
```bash
# Terminal 1 - Socket.IO Server
SOCKET_PORT=3001 node server.js

# Terminal 2 - Next.js Server
cd .next/standalone
PORT=3000 node server.js
```

## Step 8: Keep the App Running with PM2

```bash
# Install PM2
npm install -g pm2

# Start the application with PM2
pm2 start start-production.js --name "chatwave"

# Save PM2 configuration to restart on reboot
pm2 save
pm2 startup
```

## Step 9: Verify Deployment

1. Access your app at: `http://kingcloud.live:3000`
2. The Socket.IO server runs at: `http://kingcloud.live:3001`

## Troubleshooting

### Check if ports are listening:
```bash
sudo netstat -tlnp | grep -E '3000|3001'
```

### Check PM2 logs:
```bash
pm2 logs chatwave
```

### Check if firewall allows connections:
```bash
sudo ufw status
```

If UFW is enabled, allow the ports:
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

### Test Socket.IO connection:
Open browser console on your site and check for WebSocket connection logs.

## DNS Configuration

Make sure your DNS A record points to your Lightsail public IP:
- **Type**: A
- **Name**: @ (or kingcloud.live)
- **Value**: Your Lightsail public IP
- **TTL**: 300 (or default)

## HTTPS Setup (Optional but Recommended)

To enable HTTPS without nginx, you can use:

1. **Cloudflare** (Easiest) - Use Cloudflare as DNS and enable their free SSL
2. **Let's Encrypt with Node.js** - More complex, requires code changes

For Cloudflare:
1. Add your domain to Cloudflare
2. Update nameservers at your registrar
3. Enable "Flexible" SSL in Cloudflare
4. Update `.env.production`:
   ```
   NEXT_PUBLIC_BASE_URL=https://kingcloud.live
   NEXT_PUBLIC_SOCKET_URL=https://kingcloud.live:3001
   ```

## Access URLs

Once deployed:
- **Main App**: http://kingcloud.live:3000
- **Socket Server**: http://kingcloud.live:3001 (used internally)

Users will access your chat at: `http://kingcloud.live:3000`
