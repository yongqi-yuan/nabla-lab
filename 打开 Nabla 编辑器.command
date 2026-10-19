#!/bin/zsh
cd "$(dirname "$0")" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if ! command -v node >/dev/null; then
  print '未找到 Node.js。请安装 Node.js 22 或更新版本后重新打开。'
  read -r '?按回车关闭窗口…'
  exit 1
fi
node studio-server.mjs --open
