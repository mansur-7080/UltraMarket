#!/bin/bash

# =============================================================================
# UltraMarket Security Hardening Script
# =============================================================================
# Bu script production environmentda security hardening amalga oshiradi
# OWASP va CIS benchmark'lariga asoslanadi

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/ultramarket-security-hardening.log"
REPORT_FILE="/var/log/ultramarket-security-report.txt"
BACKUP_DIR="/etc/ultramarket/backups"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

backup_config() {
    local config_file="$1"
    local backup_file="$BACKUP_DIR/$(basename "$config_file").backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -f "$config_file" ]; then
        mkdir -p "$BACKUP_DIR"
        cp "$config_file" "$backup_file"
        log_info "Backup yaratildi: $backup_file"
    fi
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Bu script root huquqida ishga tushirilishi kerak"
        exit 1
    fi
}

# =============================================================================
# System Security Hardening
# =============================================================================

harden_system() {
    log_info "Tizim xavfsizligini kuchaytirish..."
    
    # Update system packages
    log_info "Tizim paketlarini yangilash..."
    if command -v apt-get &> /dev/null; then
        apt-get update && apt-get upgrade -y
        apt-get install -y fail2ban ufw rkhunter chkrootkit aide
    elif command -v yum &> /dev/null; then
        yum update -y
        yum install -y fail2ban firewalld rkhunter aide
    fi
    
    # Configure automatic security updates
    log_info "Avtomatik xavfsizlik yangilanishlarini sozlash..."
    if command -v apt-get &> /dev/null; then
        apt-get install -y unattended-upgrades
        echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades
    fi
    
    log_success "Tizim xavfsizligi kuchaytirildi"
}

harden_ssh() {
    log_info "SSH xavfsizligini kuchaytirish..."
    
    local ssh_config="/etc/ssh/sshd_config"
    backup_config "$ssh_config"
    
    # SSH hardening configurations
    cat >> "$ssh_config" << 'EOF'

# UltraMarket SSH Security Hardening
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxStartups 10:30:60
LoginGraceTime 30
AllowUsers ultramarket
DenyUsers root
Banner /etc/ssh/banner
EOF
    
    # Create SSH banner
    cat > /etc/ssh/banner << 'EOF'
****************************************************************************
*                                                                          *
*  WARNING: This is a private system. Unauthorized access is prohibited.  *
*  All activities are monitored and logged.                               *
*  UltraMarket Security Team - security@ultramarket.uz                    *
*                                                                          *
****************************************************************************
EOF
    
    # Restart SSH service
    systemctl restart sshd
    log_success "SSH xavfsizligi kuchaytirildi"
}

configure_firewall() {
    log_info "Firewall sozlash..."
    
    # Configure UFW (Ubuntu/Debian)
    if command -v ufw &> /dev/null; then
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        
        # Allow SSH
        ufw allow 22/tcp
        
        # Allow HTTP/HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # Allow application ports
        ufw allow 8000/tcp  # API Gateway
        ufw allow 3000/tcp  # Grafana
        ufw allow 9090/tcp  # Prometheus
        
        # Allow database ports (only from localhost)
        ufw allow from 127.0.0.1 to any port 5432  # PostgreSQL
        ufw allow from 127.0.0.1 to any port 27017 # MongoDB
        ufw allow from 127.0.0.1 to any port 6379  # Redis
        ufw allow from 127.0.0.1 to any port 9200  # Elasticsearch
        
        # Enable firewall
        ufw --force enable
        
        log_success "UFW firewall sozlandi"
    fi
    
    # Configure fail2ban
    log_info "Fail2ban sozlash..."
    
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = auto
usedns = warn
logencoding = auto
enabled = false
filter = %(__name__)s
destemail = security@ultramarket.uz
sender = fail2ban@ultramarket.uz
mta = sendmail
protocol = tcp
chain = INPUT
port = 0:65535
fail2ban_agent = Fail2Ban/%(fail2ban_version)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[ultramarket-api]
enabled = true
filter = ultramarket-api
port = 8000
logpath = /var/log/ultramarket/api.log
maxretry = 5
bantime = 1800
EOF
    
    # Create custom fail2ban filter for UltraMarket API
    cat > /etc/fail2ban/filter.d/ultramarket-api.conf << 'EOF'
[Definition]
failregex = ^.*\[ERROR\].*Failed login attempt from <HOST>.*$
            ^.*\[ERROR\].*Invalid API key from <HOST>.*$
            ^.*\[ERROR\].*Rate limit exceeded from <HOST>.*$
ignoreregex =
EOF
    
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    log_success "Firewall va fail2ban sozlandi"
}

harden_kernel() {
    log_info "Kernel xavfsizligini kuchaytirish..."
    
    # Kernel security parameters
    cat > /etc/sysctl.d/99-ultramarket-security.conf << 'EOF'
# UltraMarket Kernel Security Hardening

# Network Security
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Memory Protection
kernel.randomize_va_space = 2
kernel.exec-shield = 1
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.yama.ptrace_scope = 1

# File System Security
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
fs.suid_dumpable = 0

# Process Security
kernel.core_uses_pid = 1
kernel.ctrl-alt-del = 0
EOF
    
    # Apply sysctl settings
    sysctl -p /etc/sysctl.d/99-ultramarket-security.conf
    
    log_success "Kernel xavfsizligi kuchaytirildi"
}

# =============================================================================
# Application Security Hardening
# =============================================================================

harden_nginx() {
    log_info "Nginx xavfsizligini kuchaytirish..."
    
    local nginx_config="/etc/nginx/nginx.conf"
    backup_config "$nginx_config"
    
    # Create security configuration
    cat > /etc/nginx/conf.d/security.conf << 'EOF'
# UltraMarket Nginx Security Configuration

# Hide Nginx version
server_tokens off;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; child-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;

# Buffer size limitations
client_body_buffer_size 1K;
client_header_buffer_size 1k;
client_max_body_size 10M;
large_client_header_buffers 2 1k;

# Timeouts
client_body_timeout 10;
client_header_timeout 10;
keepalive_timeout 5 5;
send_timeout 10;

# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_stapling on;
ssl_stapling_verify on;

# Disable unnecessary HTTP methods
if ($request_method !~ ^(GET|HEAD|POST|PUT|DELETE|OPTIONS)$ ) {
    return 405;
}

# Block common attack patterns
location ~* \.(php|asp|aspx|jsp)$ {
    return 444;
}

location ~* /\. {
    deny all;
}

location ~* /(wp-admin|wp-login|phpmyadmin|admin|administrator) {
    return 444;
}
EOF
    
    # Test nginx configuration
    if nginx -t; then
        systemctl reload nginx
        log_success "Nginx xavfsizligi kuchaytirildi"
    else
        log_error "Nginx konfiguratsiyasida xatolik"
    fi
}

harden_postgresql() {
    log_info "PostgreSQL xavfsizligini kuchaytirish..."
    
    local pg_config="/etc/postgresql/*/main/postgresql.conf"
    local pg_hba="/etc/postgresql/*/main/pg_hba.conf"
    
    # Find actual PostgreSQL version
    local pg_version=$(ls /etc/postgresql/ | head -1)
    pg_config="/etc/postgresql/$pg_version/main/postgresql.conf"
    pg_hba="/etc/postgresql/$pg_version/main/pg_hba.conf"
    
    if [ -f "$pg_config" ]; then
        backup_config "$pg_config"
        
        # PostgreSQL security settings
        cat >> "$pg_config" << 'EOF'

# UltraMarket PostgreSQL Security Settings
listen_addresses = 'localhost'
port = 5432
max_connections = 100
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
password_encryption = scram-sha-256
log_connections = on
log_disconnections = on
log_statement = 'ddl'
log_min_duration_statement = 1000
shared_preload_libraries = 'pg_stat_statements'
EOF
        
        # Configure pg_hba.conf
        backup_config "$pg_hba"
        
        cat > "$pg_hba" << 'EOF'
# UltraMarket PostgreSQL Client Authentication

# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
EOF
        
        systemctl restart postgresql
        log_success "PostgreSQL xavfsizligi kuchaytirildi"
    fi
}

harden_mongodb() {
    log_info "MongoDB xavfsizligini kuchaytirish..."
    
    local mongo_config="/etc/mongod.conf"
    backup_config "$mongo_config"
    
    cat > "$mongo_config" << 'EOF'
# UltraMarket MongoDB Security Configuration

storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      journalCompressor: snappy
      directoryForIndexes: false
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: reopen
  verbosity: 1

net:
  port: 27017
  bindIp: 127.0.0.1
  maxIncomingConnections: 100
  wireObjectCheck: true
  ipv6: false

security:
  authorization: enabled
  javascriptEnabled: false
  
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid
  timeZoneInfo: /usr/share/zoneinfo

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 1000
EOF
    
    systemctl restart mongod
    log_success "MongoDB xavfsizligi kuchaytirildi"
}

harden_redis() {
    log_info "Redis xavfsizligini kuchaytirish..."
    
    local redis_config="/etc/redis/redis.conf"
    backup_config "$redis_config"
    
    # Redis security settings
    cat >> "$redis_config" << 'EOF'

# UltraMarket Redis Security Settings
bind 127.0.0.1
protected-mode yes
port 6379
requirepass CHANGE_ME_REDIS_PASSWORD
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG "CONFIG_ULTRAMARKET_SECURE"
rename-command SHUTDOWN "SHUTDOWN_ULTRAMARKET_SECURE"
rename-command DEBUG ""
rename-command EVAL ""
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 300
EOF
    
    systemctl restart redis
    log_success "Redis xavfsizligi kuchaytirildi"
}

# =============================================================================
# File System Security
# =============================================================================

harden_filesystem() {
    log_info "Fayl tizimi xavfsizligini kuchaytirish..."
    
    # Set proper permissions for sensitive files
    chmod 600 /etc/shadow
    chmod 600 /etc/gshadow
    chmod 644 /etc/passwd
    chmod 644 /etc/group
    
    # Secure /tmp directory
    if ! mount | grep -q "on /tmp type tmpfs"; then
        echo "tmpfs /tmp tmpfs defaults,rw,nosuid,nodev,noexec,relatime,size=1G 0 0" >> /etc/fstab
        mount -a
    fi
    
    # Find and secure SUID/SGID files
    log_info "SUID/SGID fayllarni tekshirish..."
    find / -type f \( -perm -4000 -o -perm -2000 \) -exec ls -la {} \; 2>/dev/null | tee -a "$LOG_FILE"
    
    # Remove unnecessary SUID/SGID bits
    local unnecessary_suid_files=(
        "/usr/bin/at"
        "/usr/bin/wall"
        "/usr/bin/write"
        "/usr/bin/chfn"
        "/usr/bin/chsh"
        "/usr/bin/newgrp"
    )
    
    for file in "${unnecessary_suid_files[@]}"; do
        if [ -f "$file" ]; then
            chmod u-s "$file"
            log_info "SUID olib tashlandi: $file"
        fi
    done
    
    # Set up file integrity monitoring
    if command -v aide &> /dev/null; then
        log_info "AIDE (Advanced Intrusion Detection Environment) sozlash..."
        aideinit
        log_success "AIDE sozlandi"
    fi
    
    log_success "Fayl tizimi xavfsizligi kuchaytirildi"
}

# =============================================================================
# Application-Specific Security
# =============================================================================

harden_nodejs() {
    log_info "Node.js xavfsizligini kuchaytirish..."
    
    # Create security configuration for Node.js applications
    cat > /etc/ultramarket/security.js << 'EOF'
// UltraMarket Node.js Security Configuration

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

module.exports = {
  // Security middleware
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
  
  // Rate limiting
  apiLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  authLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Data sanitization
  mongoSanitize: mongoSanitize(),
  xss: xss(),
  hpp: hpp(),
  
  // Security headers
  securityHeaders: (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  },
};
EOF
    
    log_success "Node.js xavfsizligi kuchaytirildi"
}

# =============================================================================
# Security Monitoring
# =============================================================================

setup_security_monitoring() {
    log_info "Xavfsizlik monitoringini sozlash..."
    
    # Create security monitoring script
    cat > /usr/local/bin/ultramarket-security-monitor.sh << 'EOF'
#!/bin/bash

# UltraMarket Security Monitoring Script

LOG_FILE="/var/log/ultramarket-security-monitor.log"
ALERT_EMAIL="security@ultramarket.uz"

# Function to send alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    echo "$(date): [$severity] $message" >> "$LOG_FILE"
    
    # Send email alert
    echo "UltraMarket Security Alert: $message" | mail -s "Security Alert - $severity" "$ALERT_EMAIL"
    
    # Send to syslog
    logger -p auth.warning "UltraMarket Security Alert: $message"
}

# Check for failed login attempts
failed_logins=$(grep "Failed password" /var/log/auth.log | grep "$(date +%b\ %d)" | wc -l)
if [ "$failed_logins" -gt 10 ]; then
    send_alert "High number of failed login attempts: $failed_logins" "HIGH"
fi

# Check for root login attempts
root_logins=$(grep "root" /var/log/auth.log | grep "$(date +%b\ %d)" | wc -l)
if [ "$root_logins" -gt 0 ]; then
    send_alert "Root login attempts detected: $root_logins" "CRITICAL"
fi

# Check disk usage
disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 90 ]; then
    send_alert "High disk usage: ${disk_usage}%" "HIGH"
fi

# Check for suspicious network connections
netstat_output=$(netstat -tuln | grep -E ":(22|80|443|3000|5432|27017|6379|9200)" | wc -l)
if [ "$netstat_output" -gt 50 ]; then
    send_alert "High number of network connections: $netstat_output" "MEDIUM"
fi

# Check for file system changes
if command -v aide &> /dev/null; then
    aide_output=$(aide --check 2>/dev/null | grep -E "^(Added|Removed|Changed)" | wc -l)
    if [ "$aide_output" -gt 0 ]; then
        send_alert "File system changes detected: $aide_output files" "HIGH"
    fi
fi

# Check for malware
if command -v rkhunter &> /dev/null; then
    rkhunter --check --skip-keypress --report-warnings-only > /tmp/rkhunter_output 2>&1
    if [ -s /tmp/rkhunter_output ]; then
        send_alert "Rootkit hunter found issues" "CRITICAL"
    fi
fi
EOF
    
    chmod +x /usr/local/bin/ultramarket-security-monitor.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/15 * * * * /usr/local/bin/ultramarket-security-monitor.sh") | crontab -
    
    log_success "Xavfsizlik monitoringi sozlandi"
}

# =============================================================================
# Security Audit
# =============================================================================

run_security_audit() {
    log_info "Xavfsizlik auditini ishga tushirish..."
    
    {
        echo "UltraMarket Security Audit Report"
        echo "=================================="
        echo "Date: $(date)"
        echo "Hostname: $(hostname)"
        echo ""
        
        echo "System Information:"
        echo "==================="
        uname -a
        echo ""
        
        echo "Listening Ports:"
        echo "================"
        netstat -tuln
        echo ""
        
        echo "Running Processes:"
        echo "=================="
        ps aux | head -20
        echo ""
        
        echo "User Accounts:"
        echo "=============="
        cat /etc/passwd | grep -E ":/bin/(bash|sh)$"
        echo ""
        
        echo "Sudo Users:"
        echo "==========="
        grep -E "^sudo:" /etc/group
        echo ""
        
        echo "SUID/SGID Files:"
        echo "================"
        find / -type f \( -perm -4000 -o -perm -2000 \) -exec ls -la {} \; 2>/dev/null | head -20
        echo ""
        
        echo "World Writable Files:"
        echo "===================="
        find / -type f -perm -002 -exec ls -la {} \; 2>/dev/null | head -10
        echo ""
        
        echo "Failed Login Attempts (Last 24h):"
        echo "=================================="
        grep "Failed password" /var/log/auth.log | grep "$(date +%b\ %d)" | tail -10
        echo ""
        
        echo "Firewall Status:"
        echo "================"
        if command -v ufw &> /dev/null; then
            ufw status
        fi
        echo ""
        
        echo "Fail2ban Status:"
        echo "================"
        if command -v fail2ban-client &> /dev/null; then
            fail2ban-client status
        fi
        echo ""
        
        echo "SSL Certificate Status:"
        echo "======================="
        if [ -f "/etc/ssl/certs/ultramarket.crt" ]; then
            openssl x509 -in /etc/ssl/certs/ultramarket.crt -text -noout | grep -A2 "Validity"
        fi
        echo ""
        
    } > "$REPORT_FILE"
    
    log_success "Xavfsizlik audit hisoboti yaratildi: $REPORT_FILE"
}

# =============================================================================
# Main Security Hardening Function
# =============================================================================

main() {
    log_info "UltraMarket Security Hardening boshlandi"
    
    # Check if running as root
    check_root
    
    # Create necessary directories
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # System hardening
    harden_system
    harden_ssh
    configure_firewall
    harden_kernel
    harden_filesystem
    
    # Application hardening
    harden_nginx
    harden_postgresql
    harden_mongodb
    harden_redis
    harden_nodejs
    
    # Security monitoring
    setup_security_monitoring
    
    # Run security audit
    run_security_audit
    
    log_success "UltraMarket Security Hardening yakunlandi!"
    log_info "Xavfsizlik hisoboti: $REPORT_FILE"
    log_info "Backup fayllar: $BACKUP_DIR"
    
    echo ""
    echo "==================================="
    echo "Security Hardening Summary:"
    echo "==================================="
    echo "✅ System security hardened"
    echo "✅ SSH security configured"
    echo "✅ Firewall and fail2ban setup"
    echo "✅ Kernel security parameters set"
    echo "✅ Database security hardened"
    echo "✅ Web server security configured"
    echo "✅ File system security improved"
    echo "✅ Security monitoring enabled"
    echo "✅ Security audit completed"
    echo ""
    echo "⚠️  Important: Review the security report and update passwords!"
    echo "📄 Security Report: $REPORT_FILE"
    echo "💾 Configuration Backups: $BACKUP_DIR"
    echo ""
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Show usage if help requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "UltraMarket Security Hardening Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --audit-only    Run security audit only"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "This script hardens the security of UltraMarket production environment."
    echo "It should be run as root on the production server."
    echo ""
    exit 0
fi

# Run audit only if requested
if [ "$1" = "--audit-only" ]; then
    check_root
    run_security_audit
    exit 0
fi

# Run main function
main "$@" 