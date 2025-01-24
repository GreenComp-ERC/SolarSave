# 使用 Python 作为基础镜像
FROM python:3.10

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt ./

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制模拟器项目文件
COPY . .

# 暴露端口（如果需要后端 API）
EXPOSE 5000

# 运行模拟器
CMD ["python", "main.py"]
