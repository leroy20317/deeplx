FROM node:22-alpine

WORKDIR /app

# 安装PNPM
RUN npm install -g pnpm

# 首先只复制依赖相关的文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖（这一步会被缓存，除非package.json或pnpm-lock.yaml发生变化）
RUN pnpm install --prod

# 然后复制其他文件
COPY build ./build
COPY public ./public
COPY .env ./
COPY next.config.js ./

# 暴露应用端口
EXPOSE 5700

# 启动应用
CMD ["pnpm", "start"]
