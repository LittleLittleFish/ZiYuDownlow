# 部署说明

## 1. 当前版本怎么上线

当前版本可以直接部署到服务器，并通过电脑浏览器和手机浏览器访问。

运行结构如下：

- 前台 Web：3000
- 管理后台 Admin：3001
- API 服务：4000
- 数据存储：SQLite，默认文件路径为 services/api/data/ziyu.sqlite

当前版本不需要 PostgreSQL 和 Redis 才能工作，所以最适合的上线方式是：

1. 本地打包代码
2. 上传到服务器
3. 服务器用 Docker Compose 启动三个服务
4. Nginx 把域名转发到 3000、3001、4000
5. 配置 HTTPS 后，网页和手机都能直接访问

## 2. 域名建议

建议使用三个域名：

- 主站：www.your-domain.com
- 后台：admin.your-domain.com
- API：api.your-domain.com

手机访问时，直接打开主站域名即可，因为前台页面已经是响应式布局。

## 3. 本地打包

在项目根目录执行：

```bash
npm install
npm run typecheck
npm run build
npm run package:release
```

执行完以后会生成一个发布包：

```text
release/ziyu-downlow-时间戳.tar.gz
```

## 4. 服务器准备

以下以 Ubuntu 22.04 为例。

### 4.1 安装 Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

重新登录服务器后检查：

```bash
docker --version
docker compose version
```

### 4.2 准备部署目录

```bash
mkdir -p ~/www/ziyu-downlow
cd ~/www/ziyu-downlow
```

## 5. 上传并解压发布包

在你的本地电脑执行：

```bash
scp release/ziyu-downlow-*.tar.gz root@你的服务器IP:~/www/ziyu-downlow/
```

在服务器执行：

```bash
cd ~/www/ziyu-downlow
tar -xzf ziyu-downlow-*.tar.gz
```

## 6. 配置服务器环境变量

如果你希望后续只维护一份访问配置，推荐先使用统一配置文件，再自动生成 `.env` 和 Nginx 配置。

### 6.0 统一站点配置文件

仓库里提供了一个统一模板：

- `deploy/site-config.env.example`

使用方法：

```bash
cp deploy/site-config.env.example deploy/site-config.env
```

然后只修改 `deploy/site-config.env` 这一份文件。

- 当前继续使用 IP + 端口，填 `DEPLOY_MODE=ip`
- 后续切成域名访问，改成 `DEPLOY_MODE=domain`
- 生成配置：

```bash
npm run deploy:render-config
```

生成结果：

- `.env.generated`
- `infra/nginx/ziyu.conf.generated`
- `deploy/site-config.generated.md`

这样后面切域名时，只需要改 `deploy/site-config.env`，再重新执行一次生成命令。

在服务器项目根目录执行：

```bash
cp .env.example .env
```

然后把 .env 改成生产值，例如：

```env
NODE_ENV=production
APP_NAME=ZiYuDownlow
API_PORT=4000
SQLITE_DB_PATH=./data/ziyu.sqlite
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com/api
NEXT_PUBLIC_ADMIN_BASE_URL=https://admin.your-domain.com
NPM_REGISTRY=https://registry.npmmirror.com
NPM_FETCH_RETRIES=5
NPM_FETCH_RETRY_MINTIMEOUT=20000
NPM_FETCH_RETRY_MAXTIMEOUT=120000
PLATFORM_COMMISSION_RATE=0.30
SELLER_COMMISSION_RATE=0.70
MIN_WITHDRAWAL_AMOUNT=10
PAYMENT_PROVIDER=stripe
PAYMENT_CALLBACK_URL=https://api.your-domain.com/api/payments/callback
```

关键说明：

- NEXT_PUBLIC_API_BASE_URL 必须改成线上 API 域名
- NEXT_PUBLIC_ADMIN_BASE_URL 必须改成后台域名
- NPM_REGISTRY 用于 Docker 构建阶段拉 npm 包，服务器网络不稳定时建议保持为 `https://registry.npmmirror.com`
- API 容器会把 SQLite 文件持久化到 Docker volume，不会因为容器重启丢失

## 7. 启动线上容器

在服务器项目根目录执行：

```bash
docker compose -f infra/docker/docker-compose.prod.yml up -d --build
```

如果你切到 `infra/docker` 目录再执行 compose，记得显式带上根目录的环境文件，否则会看到 `NEXT_PUBLIC_API_BASE_URL variable is not set` 之类的警告：

```bash
cd ~/www/ziyu-downlow/infra/docker
docker compose --env-file ../../.env -f docker-compose.prod.yml up -d --build
```

如果构建阶段卡在 `npm ci` 并报 `ECONNRESET`，优先检查这 4 个变量是否已经写进服务器的 `.env`：

```env
NPM_REGISTRY=https://registry.npmmirror.com
NPM_FETCH_RETRIES=5
NPM_FETCH_RETRY_MINTIMEOUT=20000
NPM_FETCH_RETRY_MAXTIMEOUT=120000
```

如果你所在服务器访问镜像站反而不稳定，可以改回官方源：

```env
NPM_REGISTRY=https://registry.npmjs.org/
```

查看服务状态：

```bash
docker compose -f infra/docker/docker-compose.prod.yml ps
```

查看日志：

```bash
docker compose -f infra/docker/docker-compose.prod.yml logs -f api
docker compose -f infra/docker/docker-compose.prod.yml logs -f web
docker compose -f infra/docker/docker-compose.prod.yml logs -f admin
```

## 8. 配置 Nginx 反向代理

仓库里已经提供模板：

- infra/nginx/ziyu.conf.example

把模板复制到服务器：

```bash
sudo cp infra/nginx/ziyu.conf.example /etc/nginx/sites-available/ziyu.conf
sudo ln -s /etc/nginx/sites-available/ziyu.conf /etc/nginx/sites-enabled/ziyu.conf
```

把下面域名替换成你的真实域名：

- www.example.com
- example.com
- admin.example.com
- api.example.com

检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 9. 配 HTTPS

推荐使用 Certbot：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d admin.your-domain.com -d api.your-domain.com
```

证书生效后：

- 电脑浏览器可以访问前台和后台
- 手机浏览器可以直接访问前台主站

## 10. 上线后怎么验证

先在服务器本机验证：

```bash
curl http://127.0.0.1:4000/api/health
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:3001/login
```

再用浏览器验证：

1. 打开 https://www.your-domain.com
2. 打开 https://admin.your-domain.com/login
3. 打开 https://api.your-domain.com/api/health

## 11. 后续更新版本怎么发

本地：

```bash
npm run typecheck
npm run build
npm run package:release
scp release/ziyu-downlow-*.tar.gz root@你的服务器IP:~/www/ziyu-downlow/
```

服务器：

```bash
cd ~/www/ziyu-downlow
tar -xzf ziyu-downlow-*.tar.gz
docker compose -f infra/docker/docker-compose.prod.yml up -d --build
```

## 12. 当前版本的边界

当前版本已经可以部署并对外访问，但还属于 MVP/演示可上线形态：

- 订单、退款、提现流程已打通
- 数据已经持久化到 SQLite
- 支付仍是演示流，不是正式支付网关
- 提现审核和退款审核已是真实业务状态流，但未接银行或第三方支付打款系统

如果你后面准备正式商用，优先继续升级：

1. SQLite 切换 PostgreSQL
2. 接真实支付与支付回调
3. 接短信、邮件或站内消息通知
4. 增加监控、备份和日志采集
