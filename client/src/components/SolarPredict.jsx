import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
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
  const [viewMode, setViewMode] = useState("compact");
  const [animationDelay, setAnimationDelay] = useState(0);
  const containerRef = useRef(null);

  // 图表颜色配置
  const chartColors = {
    primary: "#00a2ff",
    secondary: "#2ed573",
    accent: "#ff6b6b",
    highlight: "#26d0ce",
    gradient1: "#00a2ff",
    gradient2: "#0078ff"
  };

  // 获取太阳能数据
  const fetchSolarData = async () => {
    setLoading(true);
    setData(null);
    setError(null);
    setAnimationDelay(0);

    try {
      const response = await fetch("https://solarpay-8e3p.onrender.com/run_model/", {
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
        // 添加动画延迟效果
        setTimeout(() => {
          setData(responseData.data);
          setViewMode("compact");
          triggerCardAnimations();
        }, 500);
      } else {
        setError("API 返回错误: " + responseData.message);
      }
    } catch (err) {
      setError("数据获取失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 触发卡片动画
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

  // 为图表转换数据格式
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

  // 获取数据统计信息
  const getDataStats = (dataKey) => {
    if (!data || !data[dataKey]) return { min: 0, max: 0, avg: 0, trend: 0 };

    const values = Object.values(data[dataKey]).filter(v => v != null);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const trend = values.length > 1 ? ((values[values.length - 1] - values[0]) / values[0] * 100) : 0;

    return { min, max, avg, trend };
  };

  // 自定义Tooltip组件
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
          <p style={{ margin: '0 0 8px 0', color: '#00a2ff' }}>{`时间: ${label}`}</p>
          <p style={{ margin: '0', color: '#2ed573' }}>
            {`数值: ${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // 打开模态框
  const openChartModal = (chartKey) => {
    setActiveChart(chartKey);
    setModalOpen(true);
    document.body.style.overflow = "hidden";

    // 添加模态框打开动画
    setTimeout(() => {
      const modal = document.querySelector('.pred-modal-content');
      if (modal) {
        modal.style.animation = 'pred-modalSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }
    }, 10);
  };

  // 关闭模态框
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

  // 渲染增强版图表卡片
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
              {/* 卡片头部信息 */}
              <div className="pred-card-header">
                <h3 className="pred-chart-subtitle">{key}</h3>
                <div className="pred-stats-badges">
                  <span className="pred-stat-badge pred-trend"
                        style={{ color: stats.trend >= 0 ? '#2ed573' : '#ff6b6b' }}>
                    {stats.trend >= 0 ? '↗' : '↘'} {Math.abs(stats.trend).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* 数据统计栏 */}
              <div className="pred-stats-row">
                <div className="pred-stat-item">
                  <span className="pred-stat-label">最小值</span>
                  <span className="pred-stat-value" style={{ color: '#26d0ce' }}>
                    {stats.min.toFixed(2)}
                  </span>
                </div>
                <div className="pred-stat-item">
                  <span className="pred-stat-label">平均值</span>
                  <span className="pred-stat-value" style={{ color: '#00a2ff' }}>
                    {stats.avg.toFixed(2)}
                  </span>
                </div>
                <div className="pred-stat-item">
                  <span className="pred-stat-label">最大值</span>
                  <span className="pred-stat-value" style={{ color: '#ff6b6b' }}>
                    {stats.max.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 增强版图表预览 */}
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

              {/* 交互按钮 */}
              <button className="pred-view-chart-btn">
                <span>🔍 查看详情</span>
                <div className="pred-btn-glow"></div>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染增强版列表视图
  const renderEnhancedChartList = () => {
    if (!data) return null;

    return (
      <div className="pred-chart-list-container">
        {Object.keys(data).map((key, index) => {
          const chartData = transformDataForChart(key);

          return (
            <div key={key} className="pred-chart-box" style={{ animationDelay: `${index * 0.2}s` }}>
              <h3 className="pred-chart-subtitle">{key} 数据趋势</h3>
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

  // 渲染增强版模态框图表
  const renderEnhancedModalChart = () => {
    if (!activeChart || !data) return null;

    const chartData = transformDataForChart(activeChart);
    const stats = getDataStats(activeChart);

    return (
      <div className="pred-modal-chart-container">
        <div className="pred-modal-header">
          <h2 className="pred-modal-chart-title">{activeChart} 详细分析</h2>
          <div className="pred-modal-stats">
            <div className="pred-modal-stat">
              <span className="pred-modal-stat-label">数据点</span>
              <span className="pred-modal-stat-value">{chartData.length}</span>
            </div>
            <div className="pred-modal-stat">
              <span className="pred-modal-stat-label">变化趋势</span>
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
      {/* 动态粒子背景效果 */}
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

      <h1 className="pred-test-title">
        ⚡ 太阳能数据可视化 ⚡
        <div className="pred-title-glow"></div>
      </h1>

      <div className="pred-input-container">
        <div className="pred-coordinate-inputs">
          <label>
            🌍 纬度坐标:
            <input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="pred-coordinate-input"
              step="0.0001"
              placeholder="输入纬度坐标"
            />
          </label>
          <label>
            🗺️ 经度坐标:
            <input
              type="number"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="pred-coordinate-input"
              step="0.0001"
              placeholder="输入经度坐标"
            />
          </label>
        </div>

        <div className="pred-time-controls">
          <label>
            📅 开始日期:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pred-time-input"
            />
          </label>
          <label>
            📅 结束日期:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pred-time-input"
            />
          </label>
          <label>
            ⏱️ 时间间隔:
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="pred-time-interval-select"
            >
              <option value="second">⚡ 秒级精度</option>
              <option value="minute">⏰ 分钟级别</option>
              <option value="hour">🕐 小时维度</option>
              <option value="day">📊 日级统计</option>
            </select>
          </label>
          <label>
            📊 时间范围 (小时):
            <div className="pred-range-container">
              <input
                type="range"
                min="1"
                max="48"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="pred-time-range-slider"
              />
              <span>🔥 {timeRange} 小时</span>
            </div>
          </label>
        </div>

        <button className="pred-fetch-button" onClick={fetchSolarData} disabled={loading}>
          {loading ? (
            <>
              <div className="pred-loading-spinner"></div>
              🔄 数据获取中...
            </>
          ) : (
            <>
              🚀 获取太阳能数据
              <div className="pred-btn-particles"></div>
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="pred-loading-text">
          <div className="pred-spinner"></div>
          <span>⚡ 正在分析太阳能数据...</span>
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
              🎯 卡片视图
            </button>
            <button
              className={`pred-view-mode-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              📊 列表视图
            </button>
          </div>

          {viewMode === "compact" ? renderEnhancedChartCards() : renderEnhancedChartList()}
        </div>
      )}

      {/* 增强版模态框 */}
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

      {/* 添加动态样式 */}
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

        @keyframes pred-modalSlideIn {
          0% {
            transform: scale(0.7) translateY(50px);
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
            transform: scale(0.7) translateY(50px);
            opacity: 0;
          }
        }

        .pred-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .pred-stats-badges {
          display: flex;
          gap: 8px;
        }

        .pred-stat-badge {
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        .pred-stats-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 10px;
        }

        .pred-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .pred-stat-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pred-stat-value {
          font-size: 0.9rem;
          font-weight: 700;
          font-family: 'Orbitron', monospace;
        }

        .pred-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .pred-modal-stats {
          display: flex;
          gap: 20px;
        }

        .pred-modal-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .pred-modal-stat-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pred-modal-stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #00a2ff;
          font-family: 'Orbitron', monospace;
        }

        .pred-loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: pred-spin 1s linear infinite;
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
};

export default SolarPredict;