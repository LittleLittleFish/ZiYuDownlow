# 站点配置结果

- 配置来源: /Users/carl/test/ZiYuDownlow/deploy/site-config.env
- 部署模式: ip
- Web: http://45.197.145.82:3000
- Admin: http://45.197.145.82:3001
- API: http://45.197.145.82:4000

## 生成文件

- .env 目标内容: /Users/carl/test/ZiYuDownlow/.env.generated
- Nginx 配置: /Users/carl/test/ZiYuDownlow/infra/nginx/ziyu.conf.generated

## 使用方式

1. 检查并确认上面的访问地址。
2. 把 /Users/carl/test/ZiYuDownlow/.env.generated 覆盖到服务器项目根目录的 .env。
3. 如果是域名模式，把 /Users/carl/test/ZiYuDownlow/infra/nginx/ziyu.conf.generated 部署到 Nginx。
