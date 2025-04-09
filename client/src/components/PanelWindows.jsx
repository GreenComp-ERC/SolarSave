import React, { useState, useEffect } from "react";
import axios from "axios";
import Chart from "react-google-charts";
import Draggable from "react-draggable";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import "../style/PanelWindows.css";

const PanelWindows = ({ panel, closeWindow }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const response = await axios.post("https://solarpay-8e3p.onrender.com/run_model/", {
          lat: panel.lat,
          lon: panel.lng,
          start_date: "2022-06-21",
          end_date: "2022-06-22",
        });

        if (response.data.status === "success") {
          setData(response.data.data);
        } else {
          setError("API返回错误: " + response.data.message);
        }
      } catch (err) {
        setError("获取数据失败: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [panel.lat, panel.lng]);

  const transformDataForRecharts = (dataKey) => {
    if (!data || !data[dataKey]) return [];

    const chartData = [];
    const timestamps = Object.keys(data[dataKey]);

    if (typeof data[dataKey][timestamps[0]] === "object") {
      timestamps.forEach((timestamp) => {
        const item = {
          time: new Date(timestamp).toLocaleTimeString()
        };

        const subKeys = Object.keys(data[dataKey][timestamp]);
        subKeys.forEach((subKey) => {
          item[subKey] = data[dataKey][timestamp][subKey];
        });

        chartData.push(item);
      });
    } else {
      timestamps.forEach((timestamp) => {
        chartData.push({
          time: new Date(timestamp).toLocaleTimeString(),
          value: data[dataKey][timestamp]
        });
      });
    }

    return chartData;
  };

  const getLineColors = (index) => {
    const colors = ['#2196F3', '#FF5722', '#4CAF50', '#9C27B0', '#FFEB3B', '#E91E63'];
    return colors[index % colors.length];
  };

  const renderRechartsGraph = (dataKey) => {
    const chartData = transformDataForRecharts(dataKey);
    if (chartData.length === 0) return null;

    // Determine if we have multiple series or just one
    const firstItem = chartData[0];
    const keys = Object.keys(firstItem).filter(key => key !== 'time');

    return (
      <div className="chart-container">
        <h4>{dataKey}</h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="time" tick={{ fill: '#fff' }} />
            <YAxis tick={{ fill: '#fff' }} />
            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
            <Legend />
            {keys.length > 1 ? (
              keys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={getLineColors(index)}
                  activeDot={{ r: 8 }}
                  dot={{ r: 4 }}
                  strokeWidth={2}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2196F3"
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Calculate efficiency
  const efficiency = panel.acPower > 0 && panel.dcPower > 0
    ? ((panel.acPower / panel.dcPower) * 100).toFixed(1)
    : 'N/A';

  return (
    <Draggable cancel=".no-drag">
      <div className={`panel-window ${expanded ? 'expanded' : ''}`}>
        <div className="panel-header">
          <div className="window-controls">
            <span className="control red" onClick={closeWindow}></span>
            <span className="control yellow" onClick={() => {
              setActiveTab('charts');
              setExpanded((prev) => prev);
            }}></span>

            <span className="control green" onClick={() => setExpanded(!expanded)}></span>
          </div>
          <h3>太阳能面板信息</h3>
        </div>

        <div className="panel-tabs">
          <button
            className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('summary');
              setExpanded((prev) => !prev);
            }
            }
          >
            概览
          </button>
          <button
            className={`tab ${activeTab === 'charts' ? 'active' : ''}`}
            onClick={() => {
            setActiveTab('charts');
            setExpanded((prev) => !prev);
          }
            }
          >
            图表
          </button>
        </div>

        <div className="panel-content">
          {activeTab === 'summary' && (
            <div className="summary-content">
              <div className="panel-stats">
                <div className="stat-card">
                  <div className="stat-icon location-icon"></div>
                  <div className="stat-info">
                    <h4>位置</h4>
                    <p>纬度: {panel.lat.toFixed(4)}</p>
                    <p>经度: {panel.lng.toFixed(4)}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon power-icon"></div>
                  <div className="stat-info">
                    <h4>功率</h4>
                    <p>直流: <span className="highlight">{panel.dcPower} W</span></p>
                    <p>交流: <span className="highlight">{panel.acPower} W</span></p>
                    <p>效率: <span className="highlight">{efficiency}%</span></p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon temp-icon"></div>
                  <div className="stat-info">
                    <h4>温度</h4>
                    <p><span className="highlight">{panel.batteryTemp}°C</span></p>
                    <p className={panel.batteryTemp > 40 ? 'warning' : ''}>
                      {panel.batteryTemp > 40 ? '温度偏高' : '正常范围'}
                    </p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className={`stat-icon ${panel.occupied ? 'occupied-icon' : 'vacant-icon'}`}></div>
                  <div className="stat-info">
                    <h4>状态</h4>
                    <p className={panel.occupied ? 'occupied' : 'vacant'}>
                      {panel.occupied ? '已占用' : '空闲'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="charts-content">
              {loading && <div className="loading-spinner">加载数据中...</div>}
              {error && <div className="error-message">{error}</div>}

              {data && Object.keys(data).length === 0 && (
                <div className="no-data">无可用数据</div>
              )}

              {data && Object.keys(data).map((key) => (
                <div key={key} className="chart-wrapper">
                  {renderRechartsGraph(key)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default PanelWindows;