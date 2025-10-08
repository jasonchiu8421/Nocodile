# 使用官方 Python 3.10 瘦版本镜像作为基础镜像
FROM python:3.10.11-slim AS base

# 设置工作目录
WORKDIR /app

# 将 requirements.txt 文件复制到工作目录
COPY requirements.txt .

# 安装依赖
RUN --mount=type=cache,target=/home/appuser/.cache/pip \
    --mount=type=bind,source=requirements.txt,target=requirements.txt \
    python -m pip install -r requirements.txt

# 复制项目文件到工作目录
COPY . .

EXPOSE 8888

# 设置默认命令
CMD ["uvicorn", "back:app", "--host", "0.0.0.0", "--port", "8888"]
