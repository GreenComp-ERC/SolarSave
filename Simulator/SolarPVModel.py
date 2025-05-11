import requests
import pandas as pd
from datetime import datetime, timedelta
from pvlib import location, pvsystem
from pvlib.modelchain import ModelChain
from pvlib.temperature import TEMPERATURE_MODEL_PARAMETERS
from dotenv import load_dotenv
import os


class SolarPVModel:
    def __init__(self, lat, lon, api_key, sandia_module_name='Canadian_Solar_CS5P_220M___2009_',
                 cec_inverter_name='ABB__MICRO_0_25_I_OUTD_US_208__208V_'):
        self.lat = lat
        self.lon = lon
        self.api_key = api_key

        # Initialize location and component parameters
        self.site = location.Location(self.lat, self.lon, tz='Asia/Shanghai')
        sandia_modules = pvsystem.retrieve_sam('SandiaMod')
        cec_inverters = pvsystem.retrieve_sam('cecinverter')

        self.sandia_module = sandia_modules.get(sandia_module_name, sandia_modules.iloc[0])
        self.cec_inverter = cec_inverters.get(cec_inverter_name, cec_inverters.iloc[0])
        self.temperature_model_parameters = TEMPERATURE_MODEL_PARAMETERS['sapm']['open_rack_glass_glass']

    def get_weather_data(self):
        """Fetch real-time weather data using OpenWeather API."""
        url = f"http://api.openweathermap.org/data/2.5/weather?lat={self.lat}&lon={self.lon}&appid={self.api_key}&units=metric"
        try:
            response = requests.get(url)
            response.raise_for_status()
            weather_data = response.json()
            return {
                "temp_air": weather_data["main"]["temp"],
                "wind_speed": weather_data["wind"]["speed"]
            }
        except requests.exceptions.RequestException as e:
            print(f"Failed to fetch weather data: {e}")
            return {"temp_air": 25, "wind_speed": 1}  # Default values

    def run_model(self, start_date, periods=24, freq='60min'):
        """Run the PV system model and generate simulated results."""
        system = pvsystem.PVSystem(
            surface_tilt=20,
            surface_azimuth=200,
            module_parameters=self.sandia_module,
            inverter_parameters=self.cec_inverter,
            temperature_model_parameters=self.temperature_model_parameters
        )
        mc = ModelChain(system, self.site)

        times = pd.date_range(start=start_date, periods=periods, freq=freq, tz=self.site.tz)
        clearsky = self.site.get_clearsky(times)

        weather_data = self.get_weather_data()
        weather = pd.DataFrame({
            'ghi': clearsky['ghi'],
            'dni': clearsky['dni'],
            'dhi': clearsky['dhi'],
            'temp_air': weather_data['temp_air'],
            'wind_speed': weather_data['wind_speed']
        }, index=times)

        mc.run_model(weather)
        return {
            'aoi': mc.results.aoi,
            'cell_temperature': mc.results.cell_temperature,
            'dc': mc.results.dc,
            'ac': mc.results.ac
        }

    def run_model_for_time_range(self, start_date, end_date, freq='60min'):
        """Run the PV model for a specific time range."""
        periods = int((pd.to_datetime(end_date) - pd.to_datetime(start_date)) / pd.Timedelta(freq)) + 1
        return self.run_model(start_date=start_date, periods=periods, freq=freq)

    def calculate_aggregated_output(self, start_date, end_date, interval='D'):
        """Calculate the aggregated AC and DC output over a time interval."""
        results = self.run_model_for_time_range(start_date, end_date, freq='60min')
        ac_data = results['ac']
        dc_data = results['dc']

        if ac_data is not None and dc_data is not None:
            ac_aggregated = ac_data.resample(interval).sum()
            dc_aggregated = dc_data.resample(interval).sum()
            return {
                'ac': ac_aggregated,
                'dc': dc_aggregated
            }
        return {'ac': None, 'dc': None}


def calculate_combined_output(api_key, coordinates, start_date, end_date, freq='60min', interval='D'):
    """Calculate combined AC and DC output for multiple locations."""
    combined_ac = 0
    combined_dc = 0

    for coord in coordinates:
        lat, lon = coord
        solar_model = SolarPVModel(lat, lon, api_key)
        aggregated_output = solar_model.calculate_aggregated_output(start_date, end_date, interval)

        ac_power = aggregated_output['ac'].sum() if aggregated_output['ac'] is not None else 0
        dc_power = aggregated_output['dc']['v_mp'].sum() if 'v_mp' in aggregated_output['dc'] else 0

        combined_ac += ac_power
        combined_dc += dc_power

    return combined_ac, combined_dc


if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    api_key = "0771554279f9204c977c7bf619352830"
    coordinates = [(45.739, 120.683), (46.739, 121.683), (47.739, 122.683)]

    # Set time range
    start_date = '2022-06-21'
    end_date = '2022-06-22'

    # Calculate total output
    combined_ac, combined_dc = calculate_combined_output(api_key, coordinates, start_date, end_date, interval='D')

    print(f"Combined AC Power: {combined_ac:.2f} W")
    print(f"Combined DC Power: {combined_dc:.2f} W")
