# Tumaini AI Platform: Hetzner Cloud Production Deployment Guide

This guide provides a comprehensive, step-by-step walkthrough to deploy the **Tumaini AI Recruitment Platform** on a secure, high-performance, and cost-effective **Hetzner Cloud Virtual Private Server (VPS)**. 

---

## Table of Contents
1. [Step 1: Create a Hetzner Cloud Account](#step-1-create-a-hetzner-cloud-account)
2. [Step 2: Generate an SSH Key on your Mac](#step-2-generate-an-ssh-key-on-your-mac)
3. [Step 3: Provision the Virtual Server (VPS)](#step-3-provision-the-virtual-server-vps)
4. [Step 4: Configure Domain DNS Records](#step-4-configure-domain-dns-records)
5. [Step 5: Connect and Harden the Server](#step-5-connect-and-harden-the-server)
6. [Step 6: Clone and Deploy the Application](#step-6-clone-and-deploy-the-application)
7. [Step 7: Verification and Maintenance](#step-7-verification-and-maintenance)

---

## Step 1: Create a Hetzner Cloud Account

To host your application, you first need a billing account with Hetzner.

1. Go to the [Hetzner Cloud Registration Portal](https://accounts.hetzner.com/signUp).
2. Enter your email address and choose a secure password. Click **Register**.
3. **Verify your Email:** Open your inbox, find the confirmation email from Hetzner, and click the verification link.
4. **Complete Identity Verification:**
   * Hetzner is a high-security European provider. To prevent abuse, they require identity verification.
   * You will be prompted to fill out your name, billing address, and phone number.
   * You must complete a quick automatic verification either by uploading a photo of a government-issued ID (Passport, National ID, or Driver's License) or by linking a credit card / PayPal account.
5. Once verified, log in to the [Hetzner Cloud Console](https://console.hetzner.cloud/).

---

## Step 2: Generate an SSH Key on your Mac

Hetzner relies on SSH keys instead of traditional passwords to secure server access. Follow these instructions on your Mac terminal to generate and copy a key:

1. Open your Mac's **Terminal** app.
2. Check if you already have an existing key:
   ```bash
   ls -al ~/.ssh/id_*.pub
   ```
   *If a file like `id_rsa.pub` or `id_ed25519.pub` is printed, skip to step 4.*
3. If no key exists, generate a new secure one:
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   ```
   *Press `Enter` through all prompts to accept the default file locations and leave the passphrase blank.*
4. Copy your public SSH key to your clipboard:
   ```bash
   cat ~/.ssh/id_ed25519.pub | pbcopy
   ```
   *(If you generated an older RSA key, run `cat ~/.ssh/id_rsa.pub | pbcopy` instead).*

---

## Step 3: Provision the Virtual Server (VPS)

1. In the Hetzner Cloud Console, click **New Project** and name it `tumaini-platform`.
2. Open the project and click **Add Server**.
3. Select the following settings:
   * **Location:** Select **Falkenstein (DE)** or **Helsinki (FI)**. These European locations offer the absolute lowest latency to cloud AI models and are highly cost-efficient.
   * **Image:** Select **Ubuntu 24.04** (the latest long-term support release).
   * **Type:** Select **Shared vCPU** -> **AMD** (AMD processors offer faster floating-point operations for microservice calculations).
   * **Plan:** Select **CPX31** (4 vCPUs, 8GB RAM, 160GB SSD for €15/mo) or **CPX41** (8 vCPUs, 16GB RAM, 240GB SSD for €28/mo).
   * **Networking:** Ensure **Public IPv4** is enabled.
   * **SSH Keys:** Click **Add SSH Key**, paste the public key you copied from your clipboard in Step 2, and label it `MacBook-Deploy`.
   * **Name:** Label your server (e.g., `tumaini-prod-server`).
4. Click **Create & Buy Now**. 

> [!NOTE]  
> Within 10 seconds, your server will be initialized. Copy the **Public IPv4 Address** displayed on your dashboard.

---

## Step 4: Configure Domain DNS Records

Before routing traffic, you must point your domain to the new Hetzner server so Caddy can automatically fetch SSL certificates.

1. Log into your domain registrar dashboard (e.g. GoDaddy, Namecheap, Cloudflare, Route 53, etc.).
2. Go to your domain's **DNS Management** settings.
3. Create a new **A Record**:
   * **Type:** `A`
   * **Name/Host:** `@` (represents your root domain, e.g. `yourdomain.com`) or a custom subdomain (e.g. `recruitment`).
   * **Value/Points to:** Paste your **Hetzner Server Public IPv4 Address** (from Step 3).
   * **TTL:** Set to **Automatic** or **300 seconds** (5 minutes).
4. Save the record.

---

## Step 5: Connect and Harden the Server

Now, connect to your server and run the automated provisioning script to install Docker, Caddy, and secure your firewall.

1. On your Mac, open the terminal and SSH into the server:
   ```bash
   ssh root@<YOUR_SERVER_IP>
   ```
   *(Type `yes` when prompted to authorize the host finger-print).*
2. Open a new file for the setup script:
   ```bash
   nano setup.sh
   ```
3. Copy the entire contents of your project's [setup_server.sh](file:///Users/gaudencio/workspace/quantic_final_project-main/deploy/setup_server.sh) file, paste it directly into your terminal screen, then save and exit:
   * Press `CTRL + O` then `Enter` (Saves the file)
   * Press `CTRL + X` (Closes the editor)
4. Execute the provisioning script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   *This script runs system upgrades, configures Docker, installs Caddy, and sets up a robust system firewall (UFW) blocking database ports while keeping SSH, HTTP, and HTTPS open.*

---

## Step 6: Clone and Deploy the Application

With the server secured and software installed, you are ready to pull your codebase and boot the containers.

1. **Clone your Git Repository:**
   ```bash
   git clone <your-git-repo-url>
   cd quantic_final_project-main
   ```
2. **Apply the Production Caddyfile:**
   ```bash
   sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
   sudo nano /etc/caddy/Caddyfile
   ```
   *Replace `your-domain.com` with your domain, and `your-email@example.com` with your email. Save and exit (`CTRL+O`, `Enter`, `CTRL+X`).*
3. **Reload the Web Server:**
   ```bash
   sudo systemctl reload caddy
   ```
   *Caddy will immediately ping Let's Encrypt, verify your DNS domain record, and install a free SSL certificate.*
4. **Set Up the Production Environment File:**
   Create a dedicated production `.env` file in the root folder:
   ```bash
   cp .env.example .env
   nano .env
   ```
   *Configure the following variables:*
   * `POSTGRES_PASSWORD`: Use a strong random string (e.g. `c0mp1ex_P@ssw0rd`). Do not use default dev passwords.
   * `JWT_SECRET`: Use a long random alphanumeric string (e.g., `openssl rand -hex 32`).
   * `OPENAI_API_KEY`: Input your production **DeepSeek API Key**.
   * `VITE_API_BASE_URL`: Set this to `https://your-domain.com`.
   * Save and close the editor.
5. **Launch the Microservices Stack:**
   ```bash
   sudo docker compose -f deploy/docker-compose.prod.yml up -d --build
   ```

---

## Step 7: Verification and Maintenance

Your platform is now online! Here are the core maintenance commands you will need:

### 1. Verification Commands
Check that all 11 backend, frontend, database, cache, and message queue services are healthy:
```bash
sudo docker compose -f deploy/docker-compose.prod.yml ps
```
To view real-time log aggregates for a specific microservice:
```bash
sudo docker compose -f deploy/docker-compose.prod.yml logs -f <service-name>
```
*Replace `<service-name>` with `identity`, `cv`, `vector`, `matching`, or `job`.*

### 2. Updating the Code (Continuous Integration)
When you push changes from your local Mac to GitHub, log into the server and run this rebuild sequence:
```bash
cd ~/quantic_final_project-main
git pull origin main
sudo docker compose -f deploy/docker-compose.prod.yml up -d --build
```
*Docker Compose will build and replace only the updated services, causing zero downtime for unchanged containers.*

### 3. Backing Up Databases
To backup your production PostgreSQL databases, run:
```bash
sudo docker compose -f deploy/docker-compose.prod.yml exec identity-db pg_dump -U tumaini auth_db > auth_backup.sql
```
