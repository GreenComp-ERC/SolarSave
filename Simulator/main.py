from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from SolarPVModel import SolarPVModel
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = "0771554279f9204c977c7bf619352830"

# Initialize FastAPI app
app = FastAPI()

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust to specific frontend domains for security, e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all HTTP headers
)

# Define input models
class SolarRequest(BaseModel):
    lat: float
    lon: float
    start_date: str
    end_date: Optional[str] = None
    freq: str = "60min"

class MultiSolarRequest(BaseModel):
    coordinates: List[dict]
    start_date: str
    end_date: Optional[str] = None
    freq: str = "60min"

@app.post("/run_model/")
async def run_model(request: SolarRequest):
    try:
        solar_model = SolarPVModel(
            lat=request.lat,
            lon=request.lon,
            api_key=api_key
        )
        if request.end_date:
            results = solar_model.run_model_for_time_range(
                start_date=request.start_date,
                end_date=request.end_date,
                freq=request.freq
            )
        else:
            results = solar_model.run_model(
                start_date=request.start_date,
                periods=24,
                freq=request.freq
            )

        return {
            "status": "success",
            "data": {
                "aoi": results["aoi"],
                "cell_temperature": results["cell_temperature"],
                "dc(v_mp)": results["dc"]["v_mp"],  # Voltage at maximum power point (MPP)
                "ac": results["ac"],
            },
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/run_combined_model/")
async def run_combined_model(request: MultiSolarRequest):
    combined_ac = 0
    combined_dc = 0
    results = []

    try:
        for coord in request.coordinates:
            lat, lon = coord["lat"], coord["lon"]
            solar_model = SolarPVModel(lat, lon, api_key)

            if request.end_date:
                model_results = solar_model.run_model_for_time_range(
                    start_date=request.start_date,
                    end_date=request.end_date,
                    freq=request.freq
                )
            else:
                model_results = solar_model.run_model(
                    start_date=request.start_date,
                    periods=24,
                    freq=request.freq
                )

            ac_power = model_results["ac"].sum() if model_results["ac"] is not None else 0
            dc_power = model_results["dc"]["v_mp"].sum() if "v_mp" in model_results["dc"] else 0

            combined_ac += ac_power
            combined_dc += dc_power

            results.append({
                "lat": lat,
                "lon": lon,
                "dc(v_mp)": model_results["dc"]["v_mp"],
                "ac": model_results["ac"],
            })

        return {
            "status": "success",
            "combined_ac": combined_ac,
            "combined_dc": combined_dc,
            "details": results,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
async def root():
    return {"message": "SolarPVModel API is running!"}
# if __name__ == '__main__':
#     # 运行fastapi程序
#     uvicorn.run(app="run:app", host="127.0.0.1", port=8000, reload=True)