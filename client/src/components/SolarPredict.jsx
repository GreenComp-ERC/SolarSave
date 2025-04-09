import React, { useState, useEffect } from "react";
import axios from "axios";
import Chart from "react-google-charts";
import "../style/Test.css";

const SolarPredict = () => {
  const [lat, setLat] = useState(31.2992);
  const [lng, setLng] = useState(120.7467);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interval, setInterval] = useState("hour");
  const [timeRange, setTimeRange] = useState(24);
  const [startDate, setStartDate] = useState("2022-06-21");
  const [endDate, setEndDate] = useState("2022-06-22");
  const [showCharts, setShowCharts] = useState(true);

  // Create floating particles effect
  useEffect(() => {
    const createParticles = () => {
      const container = document.querySelector('.gradient-bg-welcome');
      if (!container) return;

      const particleCount = 20;

      // Remove existing particles first
      const existingParticles = container.querySelectorAll('.particle');
      existingParticles.forEach(particle => particle.remove());

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random size between 5px and 20px
        const size = Math.random() * 15 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;

        // Random animation duration between 15s and 30s
        const duration = Math.random() * 15 + 15;
        particle.style.animation = `float ${duration}s infinite ease-in-out`;

        // Random delay
        particle.style.animationDelay = `${Math.random() * 5}s`;

        // Random opacity
        particle.style.opacity = Math.random() * 0.5 + 0.1;

        container.appendChild(particle);
      }
    };

    createParticles();

    // Recreate particles on window resize
    window.addEventListener('resize', createParticles);

    return () => {
      window.removeEventListener('resize', createParticles);
    };
  }, []);

  // Fetch solar data
  const fetchSolarData = async () => {
    setLoading(true);
    setData(null);
    setError(null);

    try {
      const response = await axios.post("https://solarpay-8e3p.onrender.com/run_model/", {
        lat: parseFloat(lat),
        lon: parseFloat(lng),
        start_date: startDate,
        end_date: endDate,
        freq: interval === "second" ? "1s" : interval === "minute" ? "1min" : interval === "hour" ? "60min" : "1D",
      });

      if (response.data.status === "success") {
        setData(response.data.data);
        setShowCharts(true);
      } else {
        setError("API 返回错误: " + response.data.message);
      }
    } catch (err) {
      setError("数据获取失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format data for charts
  const transformDataForChart = (dataKey) => {
    if (!data || !data[dataKey]) return [];

    const chartData = [["时间", dataKey]];
    const timestamps = Object.keys(data[dataKey]);

    timestamps.forEach((timestamp) => {
      chartData.push([
        new Date(timestamp).toLocaleTimeString(),
        data[dataKey][timestamp],
      ]);
    });

    return chartData;
  };

  return (
    <div className="test-container gradient-bg-welcome">
      <h1 className="test-title">太阳能数据可视化</h1>

      <div className="input-container white-glassmorphism">
        <div className="coordinate-inputs">
          <label>
            纬度:
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="coordinate-input"
              step="0.0001"
            />
          </label>
          <label>
            经度:
            <input
              type="number"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="coordinate-input"
              step="0.0001"
            />
          </label>
        </div>

        <div className="time-controls">
          <label>
            开始日期:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="time-input"
            />
          </label>
          <label>
            结束日期:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="time-input"
            />
          </label>
          <label>
            时间间隔:
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="time-interval-select"
            >
              <option value="second">秒</option>
              <option value="minute">分钟</option>
              <option value="hour">小时</option>
              <option value="day">天</option>
            </select>
          </label>
          <label>
            时间范围 (小时):
            <div className="range-container">
              <input
                type="range"
                min="1"
                max="48"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="time-range-slider"
              />
              <span>{timeRange} 小时</span>
            </div>
          </label>
        </div>

        <button className="fetch-button" onClick={fetchSolarData}>
          获取数据
        </button>
      </div>

      {loading && (
        <div className="loading-text">
          <div className="spinner"></div>
          数据加载中...
        </div>
      )}

      {error && <div className="error-text">{error}</div>}

      {showCharts && data && (
        <div className="chart-container">
          <button
            className="close-button"
            onClick={() => setShowCharts(false)}
          >
            关闭图表
          </button>

          {Object.keys(data).map((key) => (
            <div key={key} className="chart-box blue-glassmorphism">
              <h3 className="chart-subtitle">{key} 数据图</h3>
              <Chart
                chartType="LineChart"
                data={transformDataForChart(key)}
                options={{
                  title: `${key} 变化趋势`,
                  titleTextStyle: { color: "#fff", fontSize: 18 },
                  hAxis: {
                    title: "时间",
                    textStyle: { color: "#000", fontWeight: "bold" },
                    gridlines: { color: "rgba(255,255,255,0.15)" },
                    baselineColor: "rgba(255,255,255,0.3)"
                  },
                  vAxis: {
                    title: key,
                    textStyle: { color: "#000", fontWeight: "bold" },
                    gridlines: { color: "rgba(255,255,255,0.15)" },
                    baselineColor: "rgba(255,255,255,0.3)"
                  },
                  legend: { position: "bottom", textStyle: { color: "#fff", fontSize: 14 } },
                  colors: ["#00c6ff", "#0072ff", "#ff4e50", "#f9d423"],
                  backgroundColor: "transparent",
                  curveType: "function",
                  chartArea: { width: "85%", height: "70%" },
                  lineWidth: 4,
                  pointSize: 8,
                  animation: {
                    startup: true,
                    duration: 1000,
                    easing: 'out'
                  },
                  tooltip: {
                    isHtml: true,
                    textStyle: { color: '#000', fontWeight: 'bold' }
                  }
                }}
                width="100%"
                height="400px"
                chartLanguage="zh"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SolarPredict;