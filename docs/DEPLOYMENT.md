# DEPLOYMENT.md — saas-identity-platform-vue

> ch42 之后的实际部署经验汇总。本仓是 React 姊妹仓 `saas-identity-platform` 的
> Vue 双栈对照，**部署链路与 React 仓完全同构**，本文档在 React 仓
> [DEPLOYMENT.md](../saas-identity-platform/docs/DEPLOYMENT.md) 基础上做了
> Vue 特定的差异化标注（端口、镜像名、子域）。

---

## 1. TL;DR

发布新版本：

```bash
git tag v1.4-011 master
git push origin v1.4-011
```

Action 跑 → docker build → push 到 Docker Hub → VPS 拉 → 容器起来 → `https://<domain>/` 看到 SPA。整个流程 5-15 分钟。

回滚一次老版本：

```bash
ssh deploy@VPS
cd /home/deploy/saas-identity-platform-vue
sh saas-identity-platform-vue.sh <DOCKER_USER> <DOCKER_PAT> v1.3-011   # ← 老 tag
```

---

## 2. 架构

```
浏览器
   │
   │  HTTPS
   ▼
┌─────────────────────────────────────────────────────────┐
│ VPS nginx                            nginx/1.24 (Ubuntu)│ ←── TLS 终结 + HSTS 头
│   反代 gateway（public-facing）                            │
└─────────────────────────────────────────────────────────┘
   │
   │  http://127.0.0.1:8062   （docker run -p 决定端口；React 仓用 8061）
   ▼
┌─────────────────────────────────────────────────────────┐
│ 容器内 nginx                       nginx/1.31 (alpine)  │ ←── SPA 静态 serve + 缓存
│   app server（private）                                  │
└─────────────────────────────────────────────────────────┘
   │
   ▼
/var/www/frontend/  ←── Vite build 产物（index.html + assets/）
```

两层反向代理是公开 SaaS 的标准做法：**外部 TLS / HSTS / 域名前缀 / 反代**放在 VPS 这一层；**SPA 静态文件、缓存、gzip、未来 API 反代**放容器里。两层职责彻底分开。

与 React 仓的差异只在端口：Vue 用 **8062**，React 用 **8061**。同 VPS 共存时不冲突。

---

## 3. 前置依赖

| 项 | 要求 |
|---|---|
| VPS | Ubuntu 22.04+ amd64 |
| 公网 IP | 一个 |
| 域名 | 已 A 指向 VPS IP（或 Cloudflare Proxied 但**先切 DNS-only**） |
| Docker | ≥ 24.x |
| SSH | 你本地能给 deploy 用户一把 ed25519 key |
| GitHub Actions | repo 里有 workflow 可跑 |

---

## 4. GitHub Secrets（Repository 级别）

Repository secrets（**不是** environment 级）：

| Name | 用途 | 来源 |
|---|---|---|
| `VPS_HOST` | VPS 公网 IP / 域名 | 静态 |
| `VPS_USER` | SSH 用户名 | 固定 `deploy` |
| `VPS_SSH_KEY` | deploy 用户的 ed25519 **私钥**全文 | `cat ~/.ssh/id_ed25519_gh-deploy` |
| `DOCKER_USERNAME` | Docker Hub 用户名 | 静态 |
| `DOCKER_PASSWORD` | Docker Hub PAT（`dckr_pat_xxx...`） | Docker Hub → Security → New Token，**Read, Write, Delete** |

> **别建 environment**，别用 `environment: VPS` 这种声明——会让 secrets 全部解析成空字符串，CI 跑到 docker/login-action 直接 `Username and password required`。

---

## 5. VPS 一次性配置

`deploy/setup-vps.sh <your-domain>` 一把搞完：

1. apt 装 nginx、docker（如未装）
2. 创建 deploy 用户，key-only SSH
3. 加 deploy 进 docker 组
4. 创建 `/home/deploy/saas-identity-platform-vue/`
5. 渲染 `deploy/nginx-vps.conf.example` → `/etc/nginx/sites-available/<your-domain>`
6. 启用：建 symlink + 删 Ubuntu 默认页（避免 `default_server` 重复）
7. nginx -t && reload

脚本**做完上面的**，你**还要手工**做的 3 件事：

| 事项 | 怎么 |
|---|---|
| Cert | 把 `fullchain.pem` + `privkey.pem` 拷到 VPS `/etc/nginx/ssl/your-cert.{crt,key}` |
| SSH key | 本地：`ssh-copy-id -i ~/.ssh/id_ed25519_gh-deploy.pub deploy@<VPS-IP>` |
| GitHub Secrets | 加 5 个如上表 |

---

## 6. DNS / Cloudflare

| 想要 | 配置 |
|---|---|
| 简单（推荐 ch42 阶段）| Cloudflare → DNS → Records → 🟠 → ❄ 切 DNS-only |
| 长期高频流量 + 防 DDoS | Cloudflare Proxied + Origin Cert（复杂，跳过） |

DNS-only 模式下 `nslookup vue-id.<your-domain>` 直接解析到 VPS IP，不经过 Cloudflare 边缘。

---

## 7. 触发发布

```bash
git checkout master
git pull --rebase origin master
git tag v1.4-011 master    # ← Project 号 NNN=011，自增
git push origin v1.4-011
```

Action 自动跑 4 个 step：

```
test            vitest + coverage
docker login    DOCKER_USERNAME + DOCKER_PASSWORD
docker build    多阶段 build（npm ci + vue-tsc + vite build），push :latest + :v1.4-011
ssh → VPS       sh saas-identity-platform-vue.sh USER PASS v1.4-011
                docker login + pull + stop + rm + run + prune
                → deploy done at 2026-07-21Txx:xx:xxZ UTC  ← 整链绿
```

镜像名：`saas-identity-platform-vue`（与 React 仓 `saas-identity-platform` 区分）。

---

## 8. 回滚

```bash
ssh -i ~/.ssh/id_ed25519_gh-deploy deploy@VPS
cd /home/deploy/saas-identity-platform-vue
sh saas-identity-platform-vue.sh zcqiand <DOCKER_PAT> v1.3-011   # 老 tag
# 容器立刻把镜像切到老 tag、起 nginx
```

或更简单：**re-tag 老 commit** 走 Action。回头 `git tag -f v1.4-011 <old-commit-sha> && git push origin v1.4-011 --force` —— 但 GitHub Releases 会指向错乱，**生产慎用**。

---

## 9. 这次踩过的坑（按出现顺序）

Vue 仓直接复用 React 仓踩出的全部经验；以下是与 Vue 特定差异化的条目（端口、镜像名、子域），完整坑清单见姊妹仓 [DEPLOYMENT.md §9](../saas-identity-platform/docs/DEPLOYMENT.md#9-这次踩过的-15-个坑按出现顺序)。

### Vue 坑 1：镜像名 / 容器名复用 React 的会撞

- **症状**：同 VPS 想跑两个仓（Vue + React），如果都用 `saas-identity-platform` 做 image 名 / container 名，第二次 `docker run` 直接冲突（`name already in use` / `repository does not exist` 看你先后顺序）
- **根因**：镜像和容器名都全局唯一，不是按 path 分
- **修法**：Vue 仓全栈用 `saas-identity-platform-vue`（image 名 + container 名 + 部署目录名统一）；React 仓沿用 `saas-identity-platform`。两个仓的 `deploy/*.sh` / `ci.yml` / `setup-vps.sh` 互不感知

### Vue 坑 2：端口撞

- **症状**：docker run 起不来 / VPS nginx 502
- **根因**：Vue / React 都用 `127.0.0.1:8061:80`，VPS vhost 反代到这个端口只能命中先起的那个
- **修法**：
  - Vue 用 **8062**（`deploy/saas-identity-platform-vue.sh` + `deploy/nginx-vps.conf.example` 同步锁死）
  - React 用 **8061**（姊妹仓）
  - 端口变动要 grep 至少两个文件：`deploy/saas-identity-platform-vue.sh` 和 VPS nginx vhost

### Vue 坑 3：子域名区分

- **症状**：浏览器访问 `vue-id.<your-domain>/` 拿到 React 仓的页面（共享 VPS 反代冲突）
- **根因**：`nginx-vps.conf.example` 默认子域 `vue-id.YOUR_DOMAIN` vs React 仓 `react-id.YOUR_DOMAIN`——如果你想两仓同 VPS 部署，必须子域分开
- **修法**：用 `vue-id.<your-domain>` + `react-id.<your-domain>` 两个独立子域（或两仓用完全不同的主域）；两者 VPS vhost 的 `server_name` 不能重叠

### Vue 坑 4：`vue-tsc` 类型检查在 Docker build 内会卡

- **症状**：本地 `npm run build` 通过，但 CI 里 docker build 在 `RUN npm run build` 步骤超时 / OOM
- **根因**：`vue-tsc` 类型检查比 `tsc` 重，CI runner 内存吃紧时（默认 7GB）偶发卡顿
- **修法**：保持 package.json 当前 `"build": "vue-tsc --noEmit -p tsconfig.app.json && vite build"` 不动；CI runner 用 ubuntu-latest 默认配置一般够用；若仍 OOM 可在 workflow 加 `runs-on: ubuntu-latest-4-cores` 或把 vue-tsc 拆到独立 job

---

## 10. 文件索引

```
.github/workflows/ci.yml            # workflow：test → docker build & push → ssh deploy
deploy/nginx.conf                   # 容器内 nginx（serve SPA + cache + gzip，/api/vitals 返 204）
deploy/nginx-vps.conf.example       # VPS nginx 参考模板（含 cert / proxy_pass 占位，端口 8062）
deploy/saas-identity-platform-vue.sh # VPS deploy 脚本（CI ssh 调用，跑容器切换）
deploy/setup-vps.sh                 # VPS bootstrap 脚本（一次性）
deploy/DELIVERY-CHECKLIST.md        # ch42 交付清单（已有）
docs/DEPLOYMENT.md                  # 你正在读的这篇
Dockerfile                          # 多阶段 build（node:20-alpine → nginx:alpine）
.dockerignore                       # 排除 node_modules / dist / coverage / .git / .env 等
```

---

## 11. 与 React 姊妹仓对照

不依赖 saas-identity-platform-vue 业务的部分（直接复用 / 改业务层即可）：

1. `.github/workflows/ci.yml` — 整段，**改镜像名** + **改 VPS 部署目录** 即可
2. `deploy/nginx.conf`（不含 `/api/` `/sso/` 那几个）通用模板
3. `deploy/setup-vps.sh` —— 大部分直接复用
4. 姊妹仓 [DEPLOYMENT.md §9 坑清单](../saas-identity-platform/docs/DEPLOYMENT.md#9-这次踩过的-15-个坑按出现顺序)（坑 4-15 是流程问题，不是 saas 业务问题）

Vue 仓差异化（必须改的部分）：

- `Dockerfile` —— 多阶段构建，业务命令 `npm run build`（含 vue-tsc + vite build）
- `package.json` —— Vue 业务依赖（vue / pinia / vue-router / @sentry/vue 等）
- 测试套件 —— vue-test-utils + jsdom + 自家 mocks
- 子域、端口、镜像名 —— 见本文档 §9

---

## 12. 关键提醒（贴在每次部署前）

```
1. ls /etc/nginx/sites-enabled/                       ← 看到 symlink 才证明 vhost 真生效
2. sudo nginx -t                                       ← 改了 vhost 必跑
3. docker ps -a --filter name=saas-identity-platform-vue  ← 看到 Up 才证明镜像跑的版本对
4. curl -kI https://<VPS>/ -H "Host: <DOMAIN>"        ← 直连验 VPS 后置 proxy
5. Cloudflare DNS Records: A record 状态              ← 灰云 / 橙云
6. Container 端: docker logs <ID> --tail 30            ← 头一次发现 crash loop
```