# 基础镜像：带 LXDE 桌面 + noVNC + VNC
FROM dorowu/ubuntu-desktop-lxde-vnc:latest

ENV DEBIAN_FRONTEND=noninteractive
USER root

# ==============================
# 安装 Python、Firefox ESR、中文环境
# ==============================
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        software-properties-common ca-certificates gnupg curl wget locales && \
    add-apt-repository -y ppa:deadsnakes/ppa && \
    add-apt-repository -y ppa:mozillateam/ppa && \
    apt-get update && \
    \
    # Python 最新稳定版 + pip
    apt-get install -y --no-install-recommends \
        python3.12 python3.12-venv python3.12-dev python3-pip && \
    ln -sf /usr/bin/python3.12 /usr/bin/python3 && \
    ln -sf /usr/bin/pip3 /usr/bin/pip && \
    \
    # Firefox ESR
    apt-get install -y --no-install-recommends firefox-esr && \
    \
    # 常用工具 + 中文支持
    apt-get install -y --no-install-recommends \
        git nano fonts-noto-cjk language-pack-zh-hans && \
    update-locale LANG=zh_CN.UTF-8 && \
    \
    # 清理
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ==============================
# 添加桌面图标（Firefox）
# ==============================
RUN mkdir -p /root/Desktop /etc/skel/Desktop && \
    for d in /root/Desktop /etc/skel/Desktop; do \
      cat > "$d/firefox.desktop" <<'EOF'; \
[Desktop Entry]
Version=1.0
Type=Application
Name=Firefox ESR
Name[zh_CN]=Firefox 浏览器 ESR
GenericName=Web Browser
Comment=Browse the Web
Exec=sh -c 'command -v firefox-esr >/dev/null && exec firefox-esr %u || exec firefox %u'
Icon=firefox
Terminal=false
Categories=Network;WebBrowser;
StartupNotify=true
EOF
      chmod +x "$d/firefox.desktop"; \
    done

# ==============================
# 设置中文环境
# ==============================
ENV LANG=zh_CN.UTF-8
ENV LANGUAGE=zh_CN:zh
ENV LC_ALL=zh_CN.UTF-8

# ==============================
# 自启动脚本：启动桌面后自动打开 Firefox
# ==============================
RUN mkdir -p /root/.config/lxsession/LXDE/ && \
    echo '@firefox-esr' >> /root/.config/lxsession/LXDE/autostart

# ==============================
# 工作目录与端口
# ==============================
WORKDIR /app
EXPOSE 80 5900
