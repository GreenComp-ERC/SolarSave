import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { FiSun } from "react-icons/fi";
import "../style/Test.css";

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDefaultDateRange = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return {
    startDate: formatLocalDate(yesterday),
    endDate: formatLocalDate(today),
  };
};

const SolarPredict = () => {
  const defaultDateRange = getDefaultDateRange();
  const [lat, setLat] = useState(31.2992);
  const [lng, setLng] = useState(120.7467);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interval, setInterval] = useState("hour");
  const [timeRange, setTimeRange] = useState(24);
  const [startDate, setStartDate] = useState(defaultDateRange.startDate);
  const [endDate, setEndDate] = useState(defaultDateRange.endDate);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeChart, setActiveChart] = useState(null);
  const [viewMode, setViewMode] = useState("compact");
  const [animationDelay, setAnimationDelay] = useState(0);
  const containerRef = useRef(null);

  // Chart color palette
  const chartColors = {
    primary: "#00a2ff",
    secondary: "#2ed573",
    accent: "#ff6b6b",
    highlight: "#26d0ce",
    gradient1: "#00a2ff",
    gradient2: "#0078ff"
  };

  // Fetch solar data
  const fetchSolarData = async () => {
    setLoading(true);
    setData(null);
    setError(null);
    setAnimationDelay(0);

    try {
      const response = await fetch("http://127.0.0.1:8000/run_model/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: parseFloat(lat),
          lon: parseFloat(lng),
          start_date: startDate,
          end_date: endDate,
          freq: interval === "second" ? "1s" : interval === "minute" ? "1min" : interval === "hour" ? "60min" : "1D",
        })
      });

      const responseData = await response.json();

      if (responseData.status === "success") {
        // Add animation delay
        setTimeout(() => {
          setData(responseData.data);
          setViewMode("compact");
          triggerCardAnimations();
        }, 500);
      } else {
        setError("API returned an error: " + responseData.message);
      }
    } catch (err) {
      setError("Failed to fetch data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger card animation
  const triggerCardAnimations = () => {
    const cards = document.querySelectorAll('.pred-chart-preview-card');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(50px) scale(0.9)';
      setTimeout(() => {
        card.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
      }, index * 150);
    });
  };

  useEffect(() => {
    fetchSolarData();
  }, []);

  // Transform data for charts
  const transformDataForChart = (dataKey) => {
    if (!data || !data[dataKey]) return [];

    const timestamps = Object.keys(data[dataKey]);
    return timestamps.map((timestamp, index) => ({
      time: new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      value: data[dataKey][timestamp] || 0,
      fullTime: new Date(timestamp).toLocaleString('zh-CN'),
      index
    }));
  };

  // Get data statistics
  const getDataStats = (dataKey) => {
    if (!data || !data[dataKey]) return { min: 0, max: 0, avg: 0, trend: 0 };

    const values = Object.values(data[dataKey]).filter(v => v != null);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const trend = values.length > 1 ? ((values[values.length - 1] - values[0]) / values[0] * 100) : 0;

    return { min, max, avg, trend };
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="pred-custom-tooltip" style={{
          background: 'rgba(15, 14, 19, 0.95)',
          border: '2px solid rgba(0, 162, 255, 0.5)',
          borderRadius: '12px',
          padding: '12px 16px',
          backdropFilter: 'blur(20px)',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <p style={{ margin: '0 0 8px 0', color: '#00a2ff' }}>{`Time: ${label}`}</p>
          <p style={{ margin: '0', color: '#2ed573' }}>
            {`Value: ${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Open modal
  const openChartModal = (chartKey) => {
    setActiveChart(chartKey);
    setModalOpen(true);
    document.body.style.overflow = "hidden";

    // Add modal open animation
    setTimeout(() => {
      const modal = document.querySelector('.pred-modal-content');
      if (modal) {
        modal.style.animation = 'pred-modalSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }
    }, 10);
  };

  // Close modal
  const closeModal = () => {
    const modal = document.querySelector('.pred-modal-content');
    if (modal) {
      modal.style.animation = 'pred-modalSlideOut 0.3s ease-in-out';
      setTimeout(() => {
        setModalOpen(false);
        setActiveChart(null);
        document.body.style.overflow = "auto";
      }, 300);
    } else {
      setModalOpen(false);
      setActiveChart(null);
      document.body.style.overflow = "auto";
    }
  };

  // Render enhanced chart cards
  const renderEnhancedChartCards = () => {
    if (!data) return null;

    return (
      <div className="pred-chart-cards-container">
        {Object.keys(data).map((key, index) => {
          const chartData = transformDataForChart(key);
          const stats = getDataStats(key);

          return (
            <div
              key={key}
              className="pred-chart-preview-card"
              style={{
                animationDelay: `${index * 0.1}s`,
                '--card-index': index
              }}
              onClick={() => openChartModal(key)}
            >
              {/* Card header */}
              <div className="pred-card-header">
                <h3 className="pred-chart-subtitle">{key}</h3>
                <div className="pred-stats-badges">
                  <span className="pred-stat-badge pred-trend"
                        style={{ color: stats.trend >= 0 ? '#2ed573' : '#ff6b6b' }}>
                    {stats.trend >= 0 ? '↗' : '↘'} {Math.abs(stats.trend).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div className="pred-stats-row">
                <div className="pred-stat-item">
                  <span className="pred-stat-label">Min</span>
                  <span className="pred-stat-value" style={{ color: '#26d0ce' }}>
                    {stats.min.toFixed(2)}
                  </span>
                </div>
                <div className="pred-stat-item">
                  <span className="pred-stat-label">Avg</span>
                  <span className="pred-stat-value" style={{ color: '#00a2ff' }}>
                    {stats.avg.toFixed(2)}
                  </span>
                </div>
                <div className="pred-stat-item">
                  <span className="pred-stat-label">Max</span>
                  <span className="pred-stat-value" style={{ color: '#ff6b6b' }}>
                    {stats.max.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Enhanced preview */}
              <div className="pred-chart-preview">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={chartColors.primary}
                      strokeWidth={2}
                      fill={`url(#gradient-${index})`}
                      dot={false}
                      activeDot={{ r: 4, fill: chartColors.primary, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Action button */}
              <button className="pred-view-chart-btn">
                <span>🔍 View details</span>
                <div className="pred-btn-glow"></div>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Render enhanced list view
  const renderEnhancedChartList = () => {
    if (!data) return null;

    return (
      <div className="pred-chart-list-container">
        {Object.keys(data).map((key, index) => {
          const chartData = transformDataForChart(key);

          return (
            <div key={key} className="pred-chart-box" style={{ animationDelay: `${index * 0.2}s` }}>
              <h3 className="pred-chart-subtitle">{key} Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id={`listGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={chartColors.primary}/>
                      <stop offset="50%" stopColor={chartColors.secondary}/>
                      <stop offset="100%" stopColor={chartColors.highlight}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#ffffff', fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#ffffff', fontSize: 12 }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={`url(#listGradient-${index})`}
                    strokeWidth={3}
                    dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: chartColors.secondary, stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    );
  };

  // Render enhanced modal chart
  const renderEnhancedModalChart = () => {
    if (!activeChart || !data) return null;

    const chartData = transformDataForChart(activeChart);
    const stats = getDataStats(activeChart);

    return (
      <div className="pred-modal-chart-container">
        <div className="pred-modal-header">
          <h2 className="pred-modal-chart-title">{activeChart} Detailed Analysis</h2>
          <div className="pred-modal-stats">
            <div className="pred-modal-stat">
              <span className="pred-modal-stat-label">Data points</span>
              <span className="pred-modal-stat-value">{chartData.length}</span>
            </div>
            <div className="pred-modal-stat">
              <span className="pred-modal-stat-label">Trend</span>
              <span className="pred-modal-stat-value" style={{ color: stats.trend >= 0 ? '#2ed573' : '#ff6b6b' }}>
                {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={500}>
  <AreaChart data={chartData}>
    <defs>
      <linearGradient id="modalGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.05}/>
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
    <XAxis
      dataKey="time"
      axisLine={false}
      tickLine={false}
      tick={{ fill: '#ffffff', fontSize: 12 }}
      interval="preserveStartEnd"
    />
    <YAxis
      axisLine={false}
      tickLine={false}
      tick={{ fill: '#ffffff', fontSize: 12 }}
      domain={['dataMin - 10', 'dataMax + 10']}
    />
    <Tooltip
      content={<CustomTooltip />}
      cursor={{ stroke: chartColors.primary, strokeWidth: 1, strokeDasharray: '5 5' }}
    />
    <Area
      type="monotone"
      dataKey="value"
      stroke={chartColors.primary}
      strokeWidth={3}
      fill="url(#modalGradient)"
      dot={{ fill: chartColors.primary, strokeWidth: 2, r: 3 }}
      activeDot={{
        r: 8,
        fill: chartColors.secondary,
        stroke: '#ffffff',
        strokeWidth: 3,
        filter: 'drop-shadow(0 0 6px rgba(46, 213, 115, 0.6))'
      }}
    />
  </AreaChart>
</ResponsiveContainer>

      </div>
    );
  };

  return (
    <div className="pred-test-container" ref={containerRef}>
      {/* Dynamic particle background */}
      <div className="pred-particles-container">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="pred-particle"
            style={{
              '--delay': `${Math.random() * 5}s`,
              '--duration': `${15 + Math.random() * 10}s`,
              '--size': `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="pred-header">
        <div className="pred-main-title">
          <FiSun className="pred-title-icon" />
          <h1>Solar Data Visualization</h1>
        </div>
      </div>

      <div className="pred-content">

      <div className="pred-input-container">
        <div className="pred-coordinate-inputs">
          <label>
            🌍 Latitude:
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="pred-coordinate-input"
              step="0.0001"
              placeholder="Enter latitude"
            />
          </label>
          <label>
            🗺️ Longitude:
            <input
              type="number"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="pred-coordinate-input"
              step="0.0001"
              placeholder="Enter longitude"
            />
          </label>
        </div>

        <div className="pred-time-controls">
          <label>
            📅 Start date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pred-time-input"
            />
          </label>
          <label>
            📅 End date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pred-time-input"
            />
          </label>
          <label>
            ⏱️ Interval:
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="pred-time-interval-select"
            >
              <option value="second">⚡ Second-level</option>
              <option value="minute">⏰ Minute-level</option>
              <option value="hour">🕐 Hourly</option>
              <option value="day">📊 Daily</option>
            </select>
          </label>
          <label>
            📊 Time range (hours):
            <div className="pred-range-container">
              <input
                type="range"
                min="1"
                max="48"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="pred-time-range-slider"
              />
              <span>🔥 {timeRange} hours</span>
            </div>
          </label>
        </div>

        <button className="pred-fetch-button" onClick={fetchSolarData} disabled={loading}>
          {loading ? (
            <>
              <div className="pred-loading-spinner"></div>
              🔄 Fetching data...
            </>
          ) : (
            <>
              🚀 Fetch solar data
              <div className="pred-btn-particles"></div>
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="pred-loading-text">
          <div className="pred-spinner"></div>
          <span>⚡ Analyzing solar data...</span>
        </div>
      )}

      {error && (
        <div className="pred-error-text">
          ❌ {error}
        </div>
      )}

      {data && (
        <div className="pred-results-container">
          <div className="pred-view-controls">
            <button
              className={`pred-view-mode-btn ${viewMode === "compact" ? "active" : ""}`}
              onClick={() => setViewMode("compact")}
            >
              🎯 Card view
            </button>
            <button
              className={`pred-view-mode-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              📊 List view
            </button>
          </div>

          {viewMode === "compact" ? renderEnhancedChartCards() : renderEnhancedChartList()}
        </div>
      )}
      </div>

      {/* Enhanced modal */}
      {modalOpen && (
        <div className="pred-chart-modal">
          <div className="pred-modal-overlay" onClick={closeModal}></div>
          <div className="pred-modal-content">
            <button className="pred-modal-close-btn" onClick={closeModal}>
              ✕
            </button>
            {renderEnhancedModalChart()}
          </div>
        </div>
      )}

      {/* Dynamic styles */}
      <style jsx>{`
        .pred-particles-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .pred-particle {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background: radial-gradient(circle, rgba(0, 162, 255, 0.8) 0%, transparent 70%);
          border-radius: 50%;
          animation: pred-float var(--duration) linear infinite;
          animation-delay: var(--delay);
        }

        @keyframes pred-float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes pred-modalFadeIn {
          0% {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          100% {
            opacity: 1;
            backdrop-filter: blur(15px);
          }
        }

        @keyframes pred-modalSlideIn {
          0% {
            transform: scale(0.9) translateY(30px);
            opacity: 0;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes pred-modalSlideOut {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(0.9) translateY(30px);
            opacity: 0;
          }
        }

        .pred-chart-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: pred-modalFadeIn 0.3s ease-out forwards;
        }

        .pred-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 10, 15, 0.7);
        }

        .pred-modal-content {
          position: relative;
          background: rgba(20, 20, 30, 0.85);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(0, 162, 255, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 162, 255, 0.15);
          border-radius: 24px;
          padding: 30px;
          width: 90%;
          max-width: 1000px;
          max-height: 90vh;
          overflow-y: auto;
          overflow-x: hidden;
          z-index: 10000;
        }

        .pred-modal-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .pred-modal-close-btn:hover {
          background: rgba(255, 107, 107, 0.2);
          border-color: #ff6b6b;
          color: #ff6b6b;
          transform: rotate(90deg);
        }

        .pred-chart-cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 30px;
        }

        .pred-chart-preview-card {
          background: rgba(15, 15, 25, 0.6);
          border: 1px solid rgba(0, 162, 255, 0.15);
          border-radius: 20px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .pred-chart-preview-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0, 162, 255, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .pred-chart-preview-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(0, 162, 255, 0.6);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 162, 255, 0.2);
        }

        .pred-chart-preview-card:hover::before {
          opacity: 1;
        }

        .pred-view-chart-btn {
          width: 100%;
          padding: 12px;
          margin-top: 15px;
          background: rgba(0, 162, 255, 0.1);
          border: 1px solid rgba(0, 162, 255, 0.3);
          border-radius: 12px;
          color: #00a2ff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }

        .pred-chart-preview-card:hover .pred-view-chart-btn {
          background: #00a2ff;
          color: #fff;
          box-shadow: 0 0 15px rgba(0, 162, 255, 0.4);
        }

        .pred-view-mode-btn {
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.3);
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .pred-view-mode-btn.active {
          background: rgba(0, 162, 255, 0.2);
          border-color: #00a2ff;
          color: #00a2ff;
          box-shadow: 0 0 15px rgba(0, 162, 255, 0.2);
        }

        .pred-view-controls {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .pred-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          position: relative;
          z-index: 1;
        }

        .pred-chart-subtitle {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: #fff;
          font-family: 'Orbitron', monospace;
          text-transform: capitalize;
          background: linear-gradient(90deg, #fff, #a0d8ef);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .pred-stats-badges {
          display: flex;
          gap: 8px;
        }

        .pred-stat-badge {
          background: rgba(0, 0, 0, 0.4);
          padding: 6px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .pred-stats-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 12px 15px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          z-index: 1;
        }

        .pred-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .pred-stat-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .pred-stat-value {
          font-size: 1.05rem;
          font-weight: 700;
          font-family: 'Orbitron', monospace;
          text-shadow: 0 0 10px currentColor;
        }

        .pred-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pred-modal-chart-title {
          font-family: 'Orbitron', monospace;
          font-size: 1.8rem;
          margin: 0;
          background: linear-gradient(135deg, #00a2ff, #2ed573);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-transform: capitalize;
        }

        .pred-modal-stats {
          display: flex;
          gap: 20px;
        }

        .pred-modal-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          background: rgba(0, 0, 0, 0.3);
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .pred-modal-stat-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pred-modal-stat-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #fff;
          font-family: 'Orbitron', monospace;
        }

        .pred-loading-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top: 3px solid #ffffff;
          border-radius: 50%;
          animation: pred-spin 1s linear infinite;
          margin-right: 10px;
        }

        @keyframes pred-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SolarPredict;