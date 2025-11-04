# 第一阶段：构建前端项目
FROM node:18 AS build

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY package.json package-lock.json ./
COPY . .

# 安装依赖
RUN npm install

RUN npm run dev

# 第二阶段：创建运行环境
FROM nginx:alpine

# 复制构建后的静态资源到 Nginx 的默认目录
COPY --from=build /app/build /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off"]
