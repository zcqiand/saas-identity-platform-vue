#!/bin/sh
# Usage: saas-identity-platform-vue.sh <DOCKER_USERNAME> <DOCKER_PASSWORD> [VERSION]
#
# 由 .github/workflows/ci.yml 的 deploy job 远程调用：
#   ssh deploy@vps -- cd /home/deploy/saas-identity-platform-vue
#                    && sh saas-identity-platform-vue.sh $DOCKER_USERNAME $DOCKER_PASSWORD $VERSION
#
# VERSION 默认是 latest。tag-based deploy 时显式传 tag 名（v1.4-011）。
# CI 同时 push :latest + :<tag> 两份镜像，回滚只要再 push 一次旧 tag（或手动指定）。
#
# 前置：deploy 用户需在 docker 组中（sudo usermod -aG docker deploy），
# 才能免 sudo 跑 docker 命令。
#
# 与 React 姊妹仓 saas-identity-platform 的 deploy/saas-identity-platform.sh 同构（双栈对照）。

set -eu

USERNAME="${1:-}"
PASSWORD="${2:-}"
VERSION="${3:-latest}"
IMAGE="${USERNAME}/saas-identity-platform-vue:${VERSION}"

if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: $0 <DOCKER_USERNAME> <DOCKER_PASSWORD> [VERSION]" >&2
  exit 2
fi

echo "→ image: $IMAGE"
echo "→ docker login"
printf '%s' "$PASSWORD" | docker login -u "$USERNAME" --password-stdin

echo "→ docker pull"
docker pull "$IMAGE"

echo "→ docker stop & rm saas-identity-platform-vue"
docker stop saas-identity-platform-vue 2>/dev/null || true
docker rm saas-identity-platform-vue 2>/dev/null || true

echo "→ docker run"
docker run -d \
  --name saas-identity-platform-vue \
  --restart unless-stopped \
  -p "127.0.0.1:8063:80" \
  "$IMAGE"

echo "→ docker image prune"
docker image prune -f

echo "→ docker ps"
docker ps --filter name=saas-identity-platform-vue

echo "→ deploy done at $(date -u)"