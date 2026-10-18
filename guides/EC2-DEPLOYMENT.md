# EC2 Deployment Guide for ChatWave

## Prerequisites
- AWS Account with EC2 access
- Domain name (optional, for HTTPS)

## Step 1: Launch EC2 Instance

1. **Go to AWS Console → EC2 → Launch Instance**

2. **Choose AMI:** Amazon Linux 2023 or Ubuntu 22.04 LTS

3. **Instance Type:** t2.micro (free tier) or t2.small for better performance

4. **Configure Security Group:**
   - SSH (22) - Your IP
   - HTTP (80) - Anywhere (0.0.0.0/0)
   - HTTPS (443) - Anywhere (0.0.0.0/0)
   - Custom TCP (3000) - Anywhere (for Next.js)
   - Custom TCP (3001) - Anywhere (for Socket.IO)

5. **Create or select a key pair** for SSH access

6. **Launch the instance**

## Step 2: Connect to EC2

```bash
# Connect via SSH
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# For Ubuntu:
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 3: Install Docker on EC2

### For Amazon Linux 2023:
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
```

### For Ubuntu:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Logout and login again
exit
```

## Step 4: Deploy the Application

### Option A: Clone from GitHub
```bash
# Reconnect to EC2
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# Clone repository
git clone https://github.com/kingslayer458/Chat-application-enhanced.git
cd Chat-application-enhanced

# Build and run with Docker Compose
docker-compose up -d --build

# Check if running
docker-compose ps
docker-compose logs -f
```

### Option B: Build locally and push to Docker Hub
```bash
# On your local machine
docker build -t yourusername/chatwave:latest .
docker push yourusername/chatwave:latest

# On EC2
docker pull yourusername/chatwave:latest
docker run -d -p 3000:3000 -p 3001:3001 --name chatwave yourusername/chatwave:latest
```

## Step 5: Setup Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx
sudo yum install nginx -y  # Amazon Linux
# OR
sudo apt install nginx -y  # Ubuntu

# Create Nginx config
sudo nano /etc/nginx/conf.d/chatwave.conf
```

Add this configuration:
```nginx
upstream nextjs {
    server 127.0.0.1:3000;
}

upstream socketio {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name your-domain.com;  # Or use EC2 public IP

    # Next.js
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://socketio;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test and restart Nginx ok
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 6: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y  # Amazon Linux
# OR
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 7: Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Stop application
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check container status
docker ps

# Enter container shell
docker exec -it chatwave-app sh
```

## Step 8: Environment Variables (Optional)

Create a `.env` file for production:
```bash
nano .env
```

```env
NODE_ENV=production
PORT=3000
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
```

Update `docker-compose.yml` to use it:
```yaml
services:
  chatwave:
    env_file:
      - .env
```

## Troubleshooting

### Check if ports are open:
```bash
sudo netstat -tlnp | grep -E '3000|3001'
```

### Check Docker logs:
```bash
docker logs chatwave-app
```

### Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Restart everything:
```bash
docker-compose down
docker-compose up -d --build
sudo systemctl restart nginx
```

## Estimated Costs (AWS)
- t2.micro: Free tier eligible (750 hours/month for 12 months)
- t2.small: ~$17/month
- t2.medium: ~$34/month

## Security Recommendations
1. Use HTTPS with SSL certificates
2. Configure proper security groups
3. Keep Docker and system updated
4. Use strong SSH keys
5. Consider using AWS Application Load Balancer for production
