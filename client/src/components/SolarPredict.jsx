import React, { useState } from "react";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [activeChart, setActiveChart] = useState(null);
  const [viewMode, setViewMode] = useState("compact"); // compact, list, modal

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
        setViewMode("compact"); // 默认显示压缩视图
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

  // 打开模态框并显示指定图表
  const openChartModal = (chartKey) => {
    setActiveChart(chartKey);
    setModalOpen(true);
    document.body.style.overflow = "hidden"; // 防止背景滚动
  };

  // 关闭模态框
  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto"; // 恢复背景滚动
  };

  // 切换视图模式
  const toggleViewMode = () => {
    if (viewMode === "compact") {
      setViewMode("list");
    } else if (viewMode === "list") {
      setViewMode("compact");
    }
  };

  // 渲染图表预览卡片
  const renderChartCards = () => {
    if (!data) return null;

    return (
      <div className="chart-cards-container">
        {Object.keys(data).map((key) => (
          <div key={key} className="chart-preview-card blue-glassmorphism" onClick={() => openChartModal(key)}>
            <h3 className="chart-subtitle">{key}</h3>
            <div className="chart-preview">
              <Chart
                chartType="LineChart"
                data={transformDataForChart(key)}
                options={{
                  legend: "none",
                  backgroundColor: "transparent",
                  colors: ["#34A853"],
                  hAxis: { textPosition: "none" },
                  vAxis: { textPosition: "none" },
                  chartArea: { width: "90%", height: "80%" },
                  enableInteractivity: false
                }}
                width="100%"
                height="120px"
              />
            </div>
            <button className="view-chart-btn">查看详情</button>
          </div>
        ))}
      </div>
    );
  };

  // 渲染图表列表视图
  const renderChartList = () => {
    if (!data) return null;

    return (
      <div className="chart-list-container">
        {Object.keys(data).map((key) => (
          <div key={key} className="chart-box blue-glassmorphism">
            <h3 className="chart-subtitle">{key} 数据图</h3>
            <Chart
              chartType="LineChart"
              data={transformDataForChart(key)}
              options={{
                title: `${key} 变化趋势`,
                titleTextStyle: { color: "#fff" },
                hAxis: {
                  title: "时间",
                  textStyle: { color: "#fff" },
                  gridlines: { color: "rgba(255,255,255,0.1)" }
                },
                vAxis: {
                  title: key,
                  textStyle: { color: "#fff" },
                  gridlines: { color: "rgba(255,255,255,0.1)" }
                },
                legend: { position: "bottom", textStyle: { color: "#fff" } },
                colors: ["#34A853", "#FBBC05", "#EA4335", "#4285F4"],
                backgroundColor: "transparent",
                curveType: "function",
                chartArea: { width: "85%", height: "70%" }
              }}
              width="100%"
              height="400px"
            />
          </div>
        ))}
      </div>
    );
  };

  // 渲染模态框图表
  const renderModalChart = () => {
    if (!activeChart || !data) return null;

    return (
      <div className="modal-chart-container">
        <h2 className="modal-chart-title">{activeChart} 详细数据</h2>
        <Chart
          chartType="LineChart"
          data={transformDataForChart(activeChart)}
          options={{
            title: `${activeChart} 变化趋势`,
            titleTextStyle: { color: "#fff" },
            hAxis: {
              title: "时间",
              textStyle: { color: "#fff" },
              gridlines: { color: "rgba(255,255,255,0.1)" }
            },
            vAxis: {
              title: activeChart,
              textStyle: { color: "#fff" },
              gridlines: { color: "rgba(255,255,255,0.1)" }
            },
            legend: { position: "bottom", textStyle: { color: "#fff" } },
            colors: ["#34A853", "#FBBC05", "#EA4335", "#4285F4"],
            backgroundColor: "transparent",
            curveType: "function",
            chartArea: { width: "85%", height: "70%" },
            explorer: {
              actions: ['dragToZoom', 'rightClickToReset'],
              axis: 'horizontal',
              keepInBounds: true,
              maxZoomIn: 0.01
            }
          }}
          width="100%"
          height="600px"
        />
      </div>
    );
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

      {data && (
        <div className="results-container">
          <div className="view-controls">
            <button
              className={`view-mode-btn ${viewMode === "compact" ? "active" : ""}`}
              onClick={() => setViewMode("compact")}
            >
              卡片视图
            </button>
            <button
              className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              列表视图
            </button>
          </div>

          {viewMode === "compact" ? renderChartCards() : renderChartList()}
        </div>
      )}

      {/* 模态图表对话框 */}
      {modalOpen && (
        <div className="chart-modal">
          <div className="modal-overlay" onClick={closeModal}></div>
          <div className="modal-content white-glassmorphism">
            <button className="modal-close-btn" onClick={closeModal}>×</button>
            {renderModalChart()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SolarPredict;