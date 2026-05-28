#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================================="
echo " Starting Hetzner Server Provisioning for Tumaini AI"
echo "=========================================================="

# 1. Update and upgrade packages
echo "[1/6] Updating system repositories and upgrading packages..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get upgrade -y

# 2. Install essential dependencies
echo "[2/6] Installing general system dependencies..."
sudo apt-get install -y curl git apt-transport-https ca-certificates gnupg lsb-release ufw

# 3. Install Docker & Docker Compose
echo "[3/6] Installing Docker and Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "Docker is already installed."
fi

# Ensure Docker service is enabled and running
sudo systemctl enable --now docker

# 4. Install Caddy Web Server
echo "[4/6] Installing Caddy Web Server for automatic SSL..."
if ! command -v caddy &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt-get update
    sudo apt-get install -y caddy
else
    echo "Caddy is already installed."
fi

sudo systemctl enable --now caddy

# 5. Setup System Firewall (UFW)
echo "[5/6] Hardening server security using UFW..."
# Set default rules: block all incoming, allow all outgoing
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow standard web and server ports
sudo ufw allow 22/tcp     # SSH (Crucial to prevent locking yourself out!)
sudo ufw allow 80/tcp     # HTTP for Caddy redirects
sudo ufw allow 443/tcp    # HTTPS for Caddy SSL

# Enable the firewall (non-interactive mode)
echo "y" | sudo ufw enable

# 6. Final Steps Summary
echo "=========================================================="
echo " Server Provisioning Complete!"
echo "=========================================================="
echo "Your server now has:"
echo " 1. Docker & Docker Compose (v2) installed."
echo " 2. Caddy Server installed and running."
echo " 3. Firewall active. Only SSH, HTTP, and HTTPS are open."
echo "=========================================================="
echo "NEXT STEPS:"
echo " 1. Create a DNS 'A' Record pointing your domain to this server IP."
echo " 2. Clone your git repository on this server."
echo " 3. Copy './deploy/Caddyfile' to '/etc/caddy/Caddyfile' (update domain)."
echo " 4. Run: sudo systemctl reload caddy"
echo " 5. Create a secure '.env' file in the project root."
echo " 6. Deploy with: sudo docker compose -f deploy/docker-compose.prod.yml up -d --build"
echo "=========================================================="
