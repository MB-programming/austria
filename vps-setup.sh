#!/bin/bash
# Orbtasoft VPS Auto-Setup Script
# For Ubuntu 20.04+ / Debian 11+

set -e  # Exit on error

echo "=================================="
echo "  Orbtasoft VPS Setup Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo -e "${RED}Cannot detect OS. This script supports Ubuntu/Debian.${NC}"
    exit 1
fi

echo -e "${GREEN}Detected OS: $OS $VERSION${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use: sudo bash vps-setup.sh)${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt update && apt upgrade -y
elif [ "$OS" = "centos" ] || [ "$OS" = "almalinux" ] || [ "$OS" = "rocky" ]; then
    dnf update -y
fi
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# Step 2: Install Node.js 18
echo -e "${YELLOW}[2/8] Installing Node.js 18...${NC}"
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
elif [ "$OS" = "centos" ] || [ "$OS" = "almalinux" ] || [ "$OS" = "rocky" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    dnf install -y nodejs
fi
echo -e "${GREEN}✓ Node.js $(node -v) installed${NC}"
echo ""

# Step 3: Install system dependencies
echo -e "${YELLOW}[3/8] Installing system dependencies (Xvfb, Electron deps)...${NC}"
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt install -y \
        git \
        xvfb \
        libgtk-3-0 \
        libgbm1 \
        libnss3 \
        libxss1 \
        libasound2 \
        libxtst6 \
        xdg-utils \
        libatspi2.0-0 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libgbm-dev \
        libpango-1.0-0 \
        libcairo2 \
        build-essential
elif [ "$OS" = "centos" ] || [ "$OS" = "almalinux" ] || [ "$OS" = "rocky" ]; then
    dnf install -y \
        git \
        xorg-x11-server-Xvfb \
        gtk3 \
        nss \
        libXScrnSaver \
        libXtst \
        xdg-utils \
        at-spi2-core \
        mesa-libgbm \
        alsa-lib \
        gcc-c++ \
        make
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 4: Install PM2
echo -e "${YELLOW}[4/8] Installing PM2 process manager...${NC}"
npm install -g pm2
echo -e "${GREEN}✓ PM2 installed${NC}"
echo ""

# Step 5: Clone or update repository
echo -e "${YELLOW}[5/8] Setting up Orbtasoft application...${NC}"
read -p "Enter git repository URL (or press Enter to skip if already cloned): " REPO_URL

if [ ! -z "$REPO_URL" ]; then
    if [ -d "/opt/orbtasoft" ]; then
        echo "Directory /opt/orbtasoft already exists. Pulling latest changes..."
        cd /opt/orbtasoft
        git pull
    else
        echo "Cloning repository..."
        git clone "$REPO_URL" /opt/orbtasoft
    fi
else
    echo "Skipping git clone. Make sure code is in /opt/orbtasoft"
fi

if [ ! -d "/opt/orbtasoft" ]; then
    echo -e "${RED}Error: /opt/orbtasoft directory not found. Please clone manually.${NC}"
    exit 1
fi

cd /opt/orbtasoft
echo -e "${GREEN}✓ Application code ready${NC}"
echo ""

# Step 6: Install npm dependencies
echo -e "${YELLOW}[6/8] Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 7: Setup environment
echo -e "${YELLOW}[7/8] Setting up environment...${NC}"
if [ ! -f "/opt/orbtasoft/.env" ]; then
    echo "Creating .env file..."
    cat > /opt/orbtasoft/.env <<EOF
# Orbtasoft Configuration
LICENSE_KEY=

# Bot Settings (optional - can be set from UI)
OFFICE=KAIRO
RESERVATION_TYPE=Bachelor
REFRESH_INTERVAL=30
NAV_DELAY=800

# OpenAI API Key (for CAPTCHA solving)
OPENAI_API_KEY=
EOF
    echo -e "${YELLOW}⚠ Please edit /opt/orbtasoft/.env and add your license key${NC}"
else
    echo ".env file already exists. Skipping."
fi
echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Step 8: Setup PM2 ecosystem
echo -e "${YELLOW}[8/8] Setting up PM2 service...${NC}"
cat > /opt/orbtasoft/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'orbtasoft-bot',
    script: 'src/main.js',
    interpreter: 'node',
    cwd: '/opt/orbtasoft',
    env: {
      NODE_ENV: 'production',
      DISPLAY: ':99'
    },
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/var/log/orbtasoft-error.log',
    out_file: '/var/log/orbtasoft-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}
EOF

# Start Xvfb
echo "Starting Xvfb virtual display..."
if pgrep -x "Xvfb" > /dev/null; then
    echo "Xvfb already running"
else
    Xvfb :99 -screen 0 1920x1080x24 > /dev/null 2>&1 &
    sleep 2
    echo "Xvfb started on display :99"
fi

# Setup PM2 startup
pm2 startup | tail -n 1 | bash
echo -e "${GREEN}✓ PM2 configured${NC}"
echo ""

# Create log directory
mkdir -p /var/log
touch /var/log/orbtasoft.log
touch /var/log/orbtasoft-error.log

echo "=================================="
echo -e "${GREEN}  ✓ Setup Complete!${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Edit configuration:"
echo "   nano /opt/orbtasoft/.env"
echo ""
echo "2. Start the bot:"
echo "   cd /opt/orbtasoft"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo ""
echo "3. Check status:"
echo "   pm2 list"
echo "   pm2 logs orbtasoft-bot"
echo ""
echo "4. View logs:"
echo "   tail -f /var/log/orbtasoft.log"
echo ""
echo "For detailed documentation, see: DEPLOY_VPS.md"
echo ""
