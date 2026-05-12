const DATASET_LIMIT = 120;

const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
};

const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index];
      return row;
    }, {});
  });
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const computeVerificationRisk = (record) => {
  const exceedsPhysics = record.pMaxW > 0 && record.pReportedW > record.pMaxW * 1.05;
  const nightInjection = record.pMaxW === 0 && record.pReportedW > 0;

  if (exceedsPhysics || nightInjection || record.machineStatus === "rejected") {
    return "high";
  }

  const nearBoundary = record.pMaxW > 0 && record.pReportedW > record.pMaxW * 0.92;
  return nearBoundary ? "medium" : "low";
};

const mapGenerationRow = (row, index) => {
  const base = {
    id: `${row.node_id}-${row.hour}-${index}`,
    nodeId: row.node_id,
    city: row.city,
    timestamp: row.timestamp,
    hour: toNumber(row.hour),
    lat: toNumber(row.latitude),
    lng: toNumber(row.longitude),
    irradiance: toNumber(row.irradiance_Wm2),
    airTemp: toNumber(row.air_temp_C),
    pMaxW: toNumber(row.P_max_W),
    pReportedW: toNumber(row.P_reported_W),
    fdiaDetected: String(row.fdia_detected).toLowerCase() === "true",
    machineStatus: row.verification_status || "pending",
    plannerDecision: "pending",
  };

  return {
    ...base,
    residualW: base.pReportedW - base.pMaxW,
    riskLevel: computeVerificationRisk(base),
  };
};

export const buildRegistrationEvidence = (recordOrPanel = {}) => {
  const forecastPower = Number(recordOrPanel.acPower ?? recordOrPanel.pReportedW ?? 0);
  const physicsMax = Number(recordOrPanel.pMaxW ?? recordOrPanel.dcPower ?? forecastPower);
  const reported = Number(recordOrPanel.pReportedW ?? recordOrPanel.acPower ?? forecastPower);
  const residual = reported - physicsMax;
  const status = recordOrPanel.machineStatus || (residual > 0 ? "needs-review" : "verified");

  return {
    recordId: recordOrPanel.id || recordOrPanel.nodeId || "manual-map-selection",
    city: recordOrPanel.city || "Map selection",
    timestamp: recordOrPanel.timestamp || new Date().toISOString(),
    forecastPower,
    physicsMax,
    reported,
    residual,
    riskLevel: recordOrPanel.riskLevel || computeVerificationRisk({
      pMaxW: Math.max(0, physicsMax),
      pReportedW: Math.max(0, reported),
      machineStatus: status,
    }),
    machineStatus: status,
  };
};

export const loadUrbanVerificationData = async () => {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const [generationResponse, liquidityResponse] = await Promise.all([
    fetch(`${baseUrl}datasets/spatiotemporal_generation.csv`),
    fetch(`${baseUrl}datasets/market_liquidity.csv`),
  ]);

  if (!generationResponse.ok || !liquidityResponse.ok) {
    throw new Error("Unable to load UrbComp verification datasets");
  }

  const [generationText, liquidityText] = await Promise.all([
    generationResponse.text(),
    liquidityResponse.text(),
  ]);

  const generationRows = parseCsv(generationText);
  const liquidityRows = parseCsv(liquidityText).map((row) => ({
    timestamp: row.timestamp,
    hour: toNumber(row.hour),
    totalVerifiedMW: toNumber(row.total_verified_MW),
    solarChainLiquidityMW: toNumber(row.solarchain_liquidity_MW),
    baselineLiquidityMW: toNumber(row.baseline_liquidity_MW),
    solarChainSlippagePct: toNumber(row.slippage_solarchain_pct),
    baselineSlippagePct: toNumber(row.slippage_baseline_pct),
  }));

  const highRisk = generationRows
    .map(mapGenerationRow)
    .filter((record) => record.riskLevel === "high")
    .slice(0, 24);

  const verified = generationRows
    .map(mapGenerationRow)
    .filter((record) => record.machineStatus === "verified" && record.pMaxW > 0)
    .slice(0, DATASET_LIMIT - highRisk.length);

  return {
    verificationRecords: [...highRisk, ...verified],
    liquidityRecords: liquidityRows,
  };
};
