# 使用 Node.js 作为基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 yarn.lock

COPY yarn.lock ./

# 安装依赖
RUN yarn install

# 复制智能合约项目文件
COPY . .

# 暴露端口（如果需要本地网络）
EXPOSE 8545

# 启动 Hardhat 本地开发网络
CMD ["npx", "hardhat", "node"]
