# SolarPVModel FastAPI

`SolarPVModel FastAPI` is a FastAPI-based API service that provides solar PV system simulation and output calculations. By integrating the `SolarPVModel` class and the OpenWeather API, it supports real-time modeling and analysis of solar output for single and multiple locations.
This library is used to simulate the operation of real solar panels.

---

## Features

- **Single-location modeling**: Compute solar PV output for one location.
- **Multi-location modeling**: Aggregate solar output across multiple locations.
- **Real-time weather data integration**: Fetch live weather data to improve modeling.
- **High-performance REST API**: FastAPI-based for fast request handling.

---

## Requirements

- Python 3.8 or later
- OpenWeather API key (place it in the `.env` file)
- Dependencies listed in `requirements.txt`

---

## Installation

1. Clone this repository:

    ```bash
    git clone <repository-url>
    cd <repository-dir>
    ```

2. Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3. Configure environment variables:
    - Create a `.env` file in the project root and add the following:
    ```env
    API_KEY=<your_openweather_api_key>
    ```

4. Start the API service:
    - Run the service with:
    ```bash
    uvicorn main:app --host 127.0.0.1 --port 8000 --reload
    ```

---

## Usage

### Available Endpoints

#### 1. Root Path Test
- **Path**: `/`
- **Method**: `GET`
- **Purpose**: Check whether the API is running.
- **Example response**:
    ```json
    {
        "message": "SolarPVModel API is running!"
    }
    ```

#### 2. Single-Location Modeling
- **Path**: `/run_model/`
- **Method**: `POST`
- **Purpose**: Compute solar PV output for a single location.
- **Request body**:
    ```json
    {
        "lat": 45.739,
        "lon": 120.683,
        "start_date": "2022-06-21",
        "end_date": "2022-06-22",
        "freq": "60min"
    }
    ```
- **Example response**:
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

#### 3. Multi-Location Modeling
- **Path**: `/run_combined_model/`
- **Method**: `POST`
- **Purpose**: Compute aggregated solar PV output for multiple locations.
- **Request body**:
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
- **Example response**:
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
