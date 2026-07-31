# dev-server 模式：supervisord + nginx + node + vite 同时跑
# ch43：与之前静态 build 模式不同，本镜像承担 SSO + 全部 /api/* 后端
# 容器内 nginx 反代：/ → vite web (5173)，/api/、/sso/ → vite dev-api (5174)
# 与 saas-react REF 对齐（saas-react 用 supervisord 跑 nginx + node dev-server）

FROM node:20-alpine

RUN apk add --no-cache nginx supervisor

WORKDIR /app

# 先装依赖（层缓存友好）
COPY package.json package-lock.json ./
RUN npm ci

# 拷源码
COPY . .

# 容器内 nginx：/ → vite web (5173) + /api/、/sso/ → vite dev-api (5174)
# 拷完整 nginx.conf（含 http {} 块）覆盖默认配置 — conf.d/*.conf 在 node:alpine
# 默认 nginx.conf 下不被 include，upstream directive 会报 'not allowed here'。
COPY deploy/nginx.conf /etc/nginx/nginx.conf

# supervisord 配置
COPY deploy/supervisord.conf /etc/supervisord.conf

# 健康检查：nginx 80 端口能连即视为健康
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

EXPOSE 80

# supervisord 前台跑（容器主进程）
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]