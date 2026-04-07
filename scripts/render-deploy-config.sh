#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_FILE="${1:-$ROOT_DIR/deploy/site-config.env}"
OUTPUT_ENV="$ROOT_DIR/.env.generated"
OUTPUT_NGINX="$ROOT_DIR/infra/nginx/ziyu.conf.generated"
OUTPUT_SUMMARY="$ROOT_DIR/deploy/site-config.generated.md"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Missing config file: $CONFIG_FILE" >&2
  echo "Create it from deploy/site-config.env.example first." >&2
  exit 1
fi

set -a
. "$CONFIG_FILE"
set +a

DEPLOY_MODE="${DEPLOY_MODE:-ip}"
ENABLE_HTTPS="${ENABLE_HTTPS:-false}"
APP_NAME="${APP_NAME:-ZiYuDownlow}"
SERVER_IP="${SERVER_IP:-127.0.0.1}"
ROOT_DOMAIN="${ROOT_DOMAIN:-}"
WEB_HOST="${WEB_HOST:-}"
ADMIN_HOST="${ADMIN_HOST:-}"
API_HOST="${API_HOST:-}"
WEB_PORT="${WEB_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-3001}"
API_PORT="${API_PORT:-4000}"
SQLITE_DB_PATH="${SQLITE_DB_PATH:-./data/ziyu.sqlite}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"
NPM_FETCH_RETRIES="${NPM_FETCH_RETRIES:-5}"
NPM_FETCH_RETRY_MINTIMEOUT="${NPM_FETCH_RETRY_MINTIMEOUT:-20000}"
NPM_FETCH_RETRY_MAXTIMEOUT="${NPM_FETCH_RETRY_MAXTIMEOUT:-120000}"
PLATFORM_COMMISSION_RATE="${PLATFORM_COMMISSION_RATE:-0.30}"
SELLER_COMMISSION_RATE="${SELLER_COMMISSION_RATE:-0.70}"
MIN_WITHDRAWAL_AMOUNT="${MIN_WITHDRAWAL_AMOUNT:-10}"
PAYMENT_PROVIDER="${PAYMENT_PROVIDER:-stripe}"

case "$DEPLOY_MODE" in
  ip|domain)
    ;;
  *)
    echo "DEPLOY_MODE must be ip or domain" >&2
    exit 1
    ;;
esac

protocol="http"
if [[ "$ENABLE_HTTPS" == "true" ]]; then
  protocol="https"
fi

if [[ "$DEPLOY_MODE" == "domain" ]]; then
  if [[ -z "$WEB_HOST" ]]; then
    if [[ -n "$ROOT_DOMAIN" ]]; then
      WEB_HOST="www.$ROOT_DOMAIN"
    else
      echo "WEB_HOST or ROOT_DOMAIN is required in domain mode" >&2
      exit 1
    fi
  fi

  if [[ -z "$ADMIN_HOST" || -z "$API_HOST" ]]; then
    if [[ -n "$ROOT_DOMAIN" ]]; then
      ADMIN_HOST="${ADMIN_HOST:-admin.$ROOT_DOMAIN}"
      API_HOST="${API_HOST:-api.$ROOT_DOMAIN}"
    else
      echo "ADMIN_HOST and API_HOST are required in domain mode" >&2
      exit 1
    fi
  fi

  WEB_ORIGIN="$protocol://$WEB_HOST"
  ADMIN_ORIGIN="$protocol://$ADMIN_HOST"
  API_ORIGIN="$protocol://$API_HOST"
  WEB_SERVER_NAMES="$WEB_HOST"
  if [[ -n "$ROOT_DOMAIN" && "$ROOT_DOMAIN" != "$WEB_HOST" ]]; then
    WEB_SERVER_NAMES="$WEB_SERVER_NAMES $ROOT_DOMAIN"
  fi

  cat > "$OUTPUT_NGINX" <<EOF
server {
  listen 80;
  server_name $WEB_SERVER_NAMES;

  location / {
    proxy_pass http://127.0.0.1:$WEB_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

server {
  listen 80;
  server_name $ADMIN_HOST;

  location / {
    proxy_pass http://127.0.0.1:$ADMIN_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

server {
  listen 80;
  server_name $API_HOST;

  location / {
    proxy_pass http://127.0.0.1:$API_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
EOF
else
  WEB_ORIGIN="http://$SERVER_IP:$WEB_PORT"
  ADMIN_ORIGIN="http://$SERVER_IP:$ADMIN_PORT"
  API_ORIGIN="http://$SERVER_IP:$API_PORT"

  cat > "$OUTPUT_NGINX" <<EOF
# IP mode keeps direct port access.
# Current public URLs:
# Web: $WEB_ORIGIN
# Admin: $ADMIN_ORIGIN
# API: $API_ORIGIN
#
# Switch DEPLOY_MODE=domain in deploy/site-config.env to generate hostname-based Nginx config.
EOF
fi

API_BASE_URL="$API_ORIGIN/api"
PAYMENT_CALLBACK_URL="$API_ORIGIN/api/payments/callback"

cat > "$OUTPUT_ENV" <<EOF
NODE_ENV=production
APP_NAME=$APP_NAME
API_PORT=$API_PORT
SQLITE_DB_PATH=$SQLITE_DB_PATH
NEXT_PUBLIC_API_BASE_URL=$API_BASE_URL
NEXT_PUBLIC_ADMIN_BASE_URL=$ADMIN_ORIGIN
NPM_REGISTRY=$NPM_REGISTRY
NPM_FETCH_RETRIES=$NPM_FETCH_RETRIES
NPM_FETCH_RETRY_MINTIMEOUT=$NPM_FETCH_RETRY_MINTIMEOUT
NPM_FETCH_RETRY_MAXTIMEOUT=$NPM_FETCH_RETRY_MAXTIMEOUT
PLATFORM_COMMISSION_RATE=$PLATFORM_COMMISSION_RATE
SELLER_COMMISSION_RATE=$SELLER_COMMISSION_RATE
MIN_WITHDRAWAL_AMOUNT=$MIN_WITHDRAWAL_AMOUNT
PAYMENT_PROVIDER=$PAYMENT_PROVIDER
PAYMENT_CALLBACK_URL=$PAYMENT_CALLBACK_URL
EOF

cat > "$OUTPUT_SUMMARY" <<EOF
# 站点配置结果

- 配置来源: $CONFIG_FILE
- 部署模式: $DEPLOY_MODE
- Web: $WEB_ORIGIN
- Admin: $ADMIN_ORIGIN
- API: $API_ORIGIN

## 生成文件

- .env 目标内容: $OUTPUT_ENV
- Nginx 配置: $OUTPUT_NGINX

## 使用方式

1. 检查并确认上面的访问地址。
2. 把 $OUTPUT_ENV 覆盖到服务器项目根目录的 .env。
3. 如果是域名模式，把 $OUTPUT_NGINX 部署到 Nginx。
EOF

echo "Generated: $OUTPUT_ENV"
echo "Generated: $OUTPUT_NGINX"
echo "Generated: $OUTPUT_SUMMARY"
