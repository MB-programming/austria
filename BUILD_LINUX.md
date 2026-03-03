# Linux Build Guide — Orbtasoft Automation

## Quick Build Commands

### Build All Linux Formats (Recommended)
```bash
npm run build:linux:all
```
This creates: **AppImage**, **deb**, **rpm**, **snap**, and **tar.gz** in `dist/` directory.

---

## Individual Format Builds

### 1. Universal AppImage (Works on ALL distros)
```bash
npm run build:linux
# or specifically:
npm run build:linux AppImage
```

**Compatible with:**
- AlmaLinux
- Debian
- Rocky Linux
- Ubuntu
- Alpine Linux
- Arch Linux
- CentOS
- CloudLinux
- Fedora
- Kali Linux
- openSUSE
- Any Linux distro with FUSE

**Installation:**
```bash
chmod +x Orbtasoft-Automation-*.AppImage
./Orbtasoft-Automation-*.AppImage
```

---

### 2. Debian Package (.deb)
```bash
npm run build:linux:deb
```

**Compatible with:**
- **Debian** (all versions)
- **Ubuntu** (all versions)
- **Kali Linux**
- Any Debian-based distro

**Installation:**
```bash
sudo dpkg -i orbtasoft-automation_*.deb
sudo apt-get install -f  # Fix dependencies if needed
```

**Uninstall:**
```bash
sudo apt-get remove orbtasoft-automation
```

---

### 3. RPM Package (.rpm)
```bash
npm run build:linux:rpm
```

**Compatible with:**
- **AlmaLinux** (RHEL clone)
- **Rocky Linux** (RHEL clone)
- **CentOS** (all versions)
- **CloudLinux**
- **Fedora** (all versions)
- **openSUSE**
- Any RPM-based distro

**Installation on Fedora/CentOS/RHEL/AlmaLinux/Rocky:**
```bash
sudo dnf install orbtasoft-automation-*.rpm
# or on older systems:
sudo yum install orbtasoft-automation-*.rpm
```

**Installation on openSUSE:**
```bash
sudo zypper install orbtasoft-automation-*.rpm
```

**Uninstall:**
```bash
sudo dnf remove orbtasoft-automation
# or:
sudo yum remove orbtasoft-automation
# or on openSUSE:
sudo zypper remove orbtasoft-automation
```

---

### 4. Snap Package (.snap)
```bash
npm run build:linux:snap
```

**Compatible with:**
- **Ubuntu** (16.04+)
- **Fedora**
- **Debian**
- **Arch Linux** (with snapd)
- **openSUSE**
- Any distro with snapd installed

**Installation:**
```bash
sudo snap install orbtasoft-automation_*.snap --dangerous --classic
```

**Uninstall:**
```bash
sudo snap remove orbtasoft-automation
```

---

### 5. Tarball (.tar.gz) — Manual Installation
```bash
npm run build:linux:tar
```

**Compatible with:**
- **Arch Linux**
- **Alpine Linux**
- **Any Linux distro** (manual extraction)

**Installation:**
```bash
tar -xzf orbtasoft-automation-*.tar.gz -C /opt/
ln -s /opt/orbtasoft-automation/orbtasoft-automation /usr/local/bin/orbtasoft-automation
```

**Run:**
```bash
orbtasoft-automation
```

---

## Distribution-Specific Recommendations

| Distribution | Recommended Format | Alternative |
|--------------|-------------------|-------------|
| **AlmaLinux** | RPM | AppImage |
| **Debian** | deb | AppImage |
| **Rocky Linux** | RPM | AppImage |
| **Ubuntu** | deb or snap | AppImage |
| **Alpine Linux** | tar.gz | AppImage |
| **Arch Linux** | tar.gz (AUR manual) | AppImage |
| **CentOS** | RPM | AppImage |
| **CloudLinux** | RPM | AppImage |
| **Fedora** | RPM or snap | AppImage |
| **Kali Linux** | deb | AppImage |
| **openSUSE** | RPM | AppImage |

---

## Build Requirements

### Prerequisites
```bash
# Install Node.js 18+ and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <repo-url>
cd austria
npm install
```

### Build Dependencies (Ubuntu/Debian)
```bash
sudo apt-get install -y build-essential libfuse2
```

### Build Dependencies (Fedora/CentOS/RHEL)
```bash
sudo dnf install -y gcc-c++ make fuse fuse-libs rpm-build
```

---

## Output Files

After running `npm run build:linux:all`, you'll find in `dist/`:

```
dist/
├── Orbtasoft-Automation-1.0.0.AppImage          # Universal
├── orbtasoft-automation_1.0.0_amd64.deb         # Debian/Ubuntu/Kali
├── orbtasoft-automation-1.0.0.x86_64.rpm        # Fedora/RHEL/CentOS/Rocky/Alma/openSUSE
├── orbtasoft-automation_1.0.0_amd64.snap        # Ubuntu/snap-enabled distros
└── orbtasoft-automation-1.0.0.tar.gz            # Arch/Alpine/manual
```

---

## Testing on Each Distro

### Docker Testing (Quick Validation)
```bash
# Debian
docker run -it --rm -v $(pwd)/dist:/dist debian:latest bash
apt-get update && apt-get install -y /dist/*.deb

# Fedora
docker run -it --rm -v $(pwd)/dist:/dist fedora:latest bash
dnf install -y /dist/*.rpm

# Ubuntu
docker run -it --rm -v $(pwd)/dist:/dist ubuntu:latest bash
apt-get update && apt-get install -y /dist/*.deb

# Alpine
docker run -it --rm -v $(pwd)/dist:/dist alpine:latest sh
tar -xzf /dist/*.tar.gz -C /opt/
```

---

## Troubleshooting

### "FUSE not found" (AppImage)
```bash
# Debian/Ubuntu
sudo apt-get install fuse libfuse2

# Fedora/RHEL
sudo dnf install fuse fuse-libs
```

### Missing Dependencies (deb/rpm)
```bash
# Debian/Ubuntu
sudo apt-get install -f

# Fedora/RHEL
sudo dnf install --skip-broken
```

### Permission Denied (AppImage)
```bash
chmod +x *.AppImage
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Build Linux
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build:linux:all
      - uses: actions/upload-artifact@v3
        with:
          name: linux-builds
          path: dist/*
```

---

## Notes

- **AppImage** is the most universal — works everywhere with FUSE
- **deb** is best for Debian/Ubuntu/Kali
- **rpm** is best for RHEL-based (AlmaLinux, Rocky, CentOS, Fedora, openSUSE)
- **snap** requires snapd but provides automatic updates
- **tar.gz** is for advanced users who prefer manual installation

For questions or issues, visit: https://orbtasoft.com/support
