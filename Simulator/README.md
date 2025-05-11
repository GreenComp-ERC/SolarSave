# SolarPVModel FastAPI

`SolarPVModel FastAPI` 是基于 `FastAPI` 的 API 服务，提供太阳能光伏系统模拟和输出计算功能。通过集成 `SolarPVModel` 类和 OpenWeather API，支持对单个和多个地点的太阳能输出进行实时建模和分析。
该库用于模拟实际太阳能板的运作

---

## 功能特点

- **单地点建模**：计算单个位置的太阳能光伏系统输出。
- **多地点建模**：聚合多个地点的太阳能输出。
- **实时天气数据集成**：获取实时天气数据，优化系统建模。
- **高性能 REST API**：基于 FastAPI 框架，支持快速请求处理。

---

## 环境要求

- Python 3.8 及以上版本
- OpenWeather API 密钥（放置于 `.env` 文件中）
- 依赖库见 `requirements.txt`

---

## 安装步骤

1. 克隆此仓库：

    ```bash
    git clone <仓库地址>
    cd <仓库目录>
    ```

2. 安装依赖：

    ```bash
    pip install -r requirements.txt
    ```

3. 配置环境变量：
    - 在项目根目录下创建 `.env` 文件，添加以下内容：
    ```env
    API_KEY=<你的_openweather_api_key>
    ```

4. 启动 API 服务：
    - 使用以下命令运行服务：
    ```bash
    uvicorn main:app --host 127.0.0.1 --port 8000 --reload
    ```

---

## 使用方法

### 可用接口

#### 1. 根路径测试
- **路径**：`/`
- **方法**：`GET`
- **功能**：测试 API 是否正常运行。
- **示例响应**：
    ```json
    {
        "message": "SolarPVModel API is running!"
    }
    ```

#### 2. 单地点建模
- **路径**：`/run_model/`
- **方法**：`POST`
- **功能**：计算单个地点的太阳能光伏系统输出。
- **请求体**：
    ```json
    {
        "lat": 45.739,
        "lon": 120.683,
        "start_date": "2022-06-21",
        "end_date": "2022-06-22",
        "freq": "60min"
    }
    ```
- **示例响应**：
    ```json
    {
        "status": "success",
        "data": {
            "aoi": [...],
            "cell_temperature": [...],
            "dc(v_mp)": [...],
            "ac": [...]
        }
    }
    ```

#### 3. 多地点建模
- **路径**：`/run_combined_model/`
- **方法**：`POST`
- **功能**：计算多个地点的太阳能光伏系统聚合输出。
- **请求体**：
    ```json
    {
        "coordinates": [
            {"lat": 45.739, "lon": 120.683},
            {"lat": 46.739, "lon": 121.683}
        ],
        "start_date": "2022-06-21",
        "end_date": "2022-06-22",
        "freq": "60min"
    }
    ```
- **示例响应**：
    ```json
    {
        "status": "success",
        "combined_ac": 1200.5,
        "combined_dc": 3000.7,
        "details": [
            {
                "lat": 45.739,
                "lon": 120.683,
                "dc(v_mp)": [...],
                "ac": [...]
            },
            {
                "lat": 46.739,
                "lon": 121.683,
                "dc(v_mp)": [...],
                "ac": [...]
            }
        ]
    }
    ```

---


"# SolarPay" 
