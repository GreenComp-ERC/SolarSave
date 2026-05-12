import React, { useEffect, useMemo, useState } from "react";
import { FiActivity, FiGitBranch } from "react-icons/fi";
import { loadUrbanVerificationData } from "../utils/urbanVerification";

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const MarketImpact = () => {
  const [liquidityRecords, setLiquidityRecords] = useState([]);

  useEffect(() => {
    let isMounted = true;
    loadUrbanVerificationData()
      .then(({ liquidityRecords: records }) => {
        if (isMounted) setLiquidityRecords(records);
      })
      .catch((error) => console.error("Failed to load market impact data:", error));

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const latest = liquidityRecords[liquidityRecords.length - 1];
    return {
      latest,
      avgVerifiedMW: average(liquidityRecords.map((record) => record.totalVerifiedMW)),
      avgSolarLiquidityMW: average(liquidityRecords.map((record) => record.solarChainLiquidityMW)),
      avgBaselineLiquidityMW: average(liquidityRecords.map((record) => record.baselineLiquidityMW)),
      avgSolarSlippage: average(liquidityRecords.map((record) => record.solarChainSlippagePct)),
      avgBaselineSlippage: average(liquidityRecords.map((record) => record.baselineSlippagePct)),
    };
  }, [liquidityRecords]);

  const peakLiquidity = Math.max(
    0.001,
    ...liquidityRecords.map((record) => record.solarChainLiquidityMW),
    ...liquidityRecords.map((record) => record.baselineLiquidityMW)
  );

  return (
    <section className="market-impact">
      <div className="market-impact-header">
        <div className="trans-main-title">
          <FiGitBranch className="trans-title-icon" />
          <h1>Human-Verified Market Impact</h1>
        </div>
        <p>
          Planner-approved generation becomes verified liquidity; rejected FDIA stays out of the exchange.
        </p>
      </div>

      <div className="impact-summary-grid">
        <div className="impact-card">
          <span>Avg verified supply</span>
          <strong>{summary.avgVerifiedMW.toFixed(4)} MW</strong>
        </div>
        <div className="impact-card">
          <span>SolarChain liquidity</span>
          <strong>{summary.avgSolarLiquidityMW.toFixed(4)} MW</strong>
        </div>
        <div className="impact-card">
          <span>Baseline liquidity</span>
          <strong>{summary.avgBaselineLiquidityMW.toFixed(4)} MW</strong>
        </div>
        <div className="impact-card">
          <span>Slippage reduction</span>
          <strong>{Math.max(0, summary.avgBaselineSlippage - summary.avgSolarSlippage).toFixed(2)} pts</strong>
        </div>
      </div>

      <div className="impact-chart-card">
        <div className="impact-chart-title">
          <FiActivity />
          <span>Liquidity depth after verification</span>
        </div>
        <div className="impact-bars">
          {liquidityRecords.slice(6, 19).map((record) => (
            <div className="impact-hour" key={record.timestamp}>
              <span className="impact-hour-label">{String(record.hour).padStart(2, "0")}</span>
              <div className="impact-bar-track">
                <span
                  className="impact-bar solarchain"
                  style={{ width: `${(record.solarChainLiquidityMW / peakLiquidity) * 100}%` }}
                ></span>
                <span
                  className="impact-bar baseline"
                  style={{ width: `${(record.baselineLiquidityMW / peakLiquidity) * 100}%` }}
                ></span>
              </div>
              <span className="impact-slip">
                {record.solarChainSlippagePct.toFixed(1)}% / {record.baselineSlippagePct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
        <div className="impact-legend">
          <span><i className="legend-solarchain"></i> SolarChain 1:3 split</span>
          <span><i className="legend-baseline"></i> No-split baseline</span>
        </div>
      </div>
    </section>
  );
};

export default MarketImpact;
