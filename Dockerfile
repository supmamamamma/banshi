# ===================================
# 基础镜像：带 LXDE 桌面 + noVNC + VNC
# ===================================
FROM dorowu/ubuntu-desktop-lxde-vnc:focal

ENV DEBIAN_FRONTEND=noninteractive
USER root

# ===================================
# 安装 Python、Firefox（APT 版）、中文环境
# ===================================
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        software-properties-common ca-certificates gnupg curl wget locales; \
    add-apt-repository -y ppa:deadsnakes/ppa; \
    apt-get update; \
    \
    # Python 3.12（deadsnakes），用 ensurepip 给 3.12 装 pip
    apt-get install -y --no-install-recommends \
        python3.12 python3.12-venv python3.12-dev; \
    python3.12 -m ensurepip --upgrade; \
    python3.12 -m pip install --no-cache-dir --upgrade pip setuptools wheel; \
    \
    # Firefox（Ubuntu 上没有 firefox-esr，用 APT 版 firefox 即可）
    apt-get install -y --no-install-recommends firefox; \
    \
    # 常用工具 + 中文支持
    apt-get install -y --no-install-recommends \
        git nano fonts-noto-cjk language-pack-zh-hans; \
    locale-gen zh_CN.UTF-8; \
    update-locale LANG=zh_CN.UTF-8; \
    \
    # 清理
    apt-get clean; rm -rf /var/lib/apt/lists/*

# ===================================
# 添加桌面图标（Firefox） —— 无 heredoc 版本
# ===================================
RUN set -eux; \
    mkdir -p /root/Desktop /etc/skel/Desktop; \
    for d in /root/Desktop /etc/skel/Desktop; do \
      mkdir -p "$d"; \
      printf '%s\n' \
        "[Desktop Entry]" \
        "Version=1.0" \
        "Type=Application" \
        "Name=Firefox" \
        "Name[zh_CN]=Firefox 浏览器" \
        "GenericName=Web Browser" \
        "Comment=Browse the Web" \
        "Exec=firefox %u" \
        "Icon=firefox" \
        "Terminal=false" \
        "Categories=Network;WebBrowser;" \
        "StartupNotify=true" \
        > "$d/firefox.desktop"; \
      chmod +x "$d/firefox.desktop"; \
    done

# ===================================
# 设置中文环境
# ===================================
ENV LANG=zh_CN.UTF-8
ENV LANGUAGE=zh_CN:zh
ENV LC_ALL=zh_CN.UTF-8

# ===================================
# 自启动脚本：启动桌面后自动打开 Firefox
# ===================================
RUN set -eux; \
    mkdir -p /root/.config/lxsession/LXDE/; \
    echo '@firefox' >> /root/.config/lxsession/LXDE/autostart

# ===================================
# 工作目录与端口
# ===================================
WORKDIR /app
EXPOSE 80 5900
