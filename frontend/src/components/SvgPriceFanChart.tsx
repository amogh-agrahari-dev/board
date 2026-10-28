import React, { useState } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { line, area, curveLinear } from "d3-shape";
import { PricePoint, MonteCarloData } from "../types";

interface SvgPriceFanChartProps {
  priceHistory: PricePoint[];
  monteCarlo: MonteCarloData;
  ticker: string;
}

export const SvgPriceFanChart: React.FC<SvgPriceFanChartProps> = ({
  priceHistory,
  monteCarlo,
  ticker
}) => {
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [indicatorView, setIndicatorView] = useState<"RSI" | "MACD" | "NONE">("RSI");

  const width = 840;
  const height = 360;
  const padding = { top: 20, right: 70, bottom: 30, left: 20 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  if (!priceHistory || priceHistory.length === 0) {
    return <div className="mono" style={{ padding: "30px", textAlign: "center" }}>NO PRICE HISTORY DATA</div>;
  }

  // Combine historical and simulated bounds for y-scale
  const histPrices = priceHistory.map((d) => d.close);
  const fanP95 = monteCarlo.fan_timeline.map((f) => f.p95);
  const fanP05 = monteCarlo.fan_timeline.map((f) => f.p05);
  
  const minY = Math.min(...histPrices, ...fanP05) * 0.96;
  const maxY = Math.max(...histPrices, ...fanP95) * 1.04;
  
  const totalDays = priceHistory.length + monteCarlo.horizon_days;
  const xScale = scaleLinear().domain([0, totalDays]).range([padding.left, padding.left + plotWidth]);
  const yScale = scaleLinear().domain([minY, maxY]).range([padding.top + plotHeight, padding.top]);

  // Main price line generator
  const priceLine = line<PricePoint>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d.close))
    .curve(curveLinear);

  const sma20Line = line<PricePoint>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d.sma_20))
    .curve(curveLinear);

  const sma50Line = line<PricePoint>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d.sma_50))
    .curve(curveLinear);

  // Monte Carlo forecast fan generator
  const histEndIdx = priceHistory.length - 1;
  const fanX = (stepDay: number) => xScale(histEndIdx + stepDay);

  // 90% uncertainty band (p05 to p95)
  const area90 = area<any>()
    .x((d) => fanX(d.day))
    .y0((d) => yScale(d.p05))
    .y1((d) => yScale(d.p95))
    .curve(curveLinear);

  // 60% uncertainty band (p20 to p80)
  const area60 = area<any>()
    .x((d) => fanX(d.day))
    .y0((d) => yScale(d.p20))
    .y1((d) => yScale(d.p80))
    .curve(curveLinear);

  const medianLine = line<any>()
    .x((d) => fanX(d.day))
    .y((d) => yScale(d.p50))
    .curve(curveLinear);

  // Y-axis ticks
  const yTicks = yScale.ticks(6);

  return (
    <div style={{ border: "2px solid var(--ink)", backgroundColor: "var(--paper)", padding: "18px" }}>
      {/* Chart Header & Indicator Toggles */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px", marginBottom: "12px", borderBottom: "1px solid var(--ink)", paddingBottom: "10px" }}>
        <div>
          <span className="mono" style={{ fontSize: "14px", fontWeight: 800 }}>
            {ticker} — PRICE ACTION & {monteCarlo.horizon_days}D MONTE CARLO FORECAST FAN
          </span>
          <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
            CURRENT: ${monteCarlo.current_price.toFixed(2)} | 5,000 BOOTSTRAP PATHS | STEPPED HATCHED UNCERTAINTY BANDS
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setShowSma20(!showSma20)}
            className={showSma20 ? "btn-inverted" : ""}
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            SMA 20
          </button>
          <button
            onClick={() => setShowSma50(!showSma50)}
            className={showSma50 ? "btn-inverted" : ""}
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            SMA 50
          </button>
          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={showBollinger ? "btn-inverted" : ""}
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            BOLLINGER
          </button>
          <button
            onClick={() => setIndicatorView(indicatorView === "RSI" ? "MACD" : indicatorView === "MACD" ? "NONE" : "RSI")}
            className="btn-inverted"
            style={{ padding: "4px 8px", fontSize: "11px" }}
          >
            SUB: {indicatorView}
          </button>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          aria-label="Price action and Monte Carlo forecast fan chart"
        >
          <defs>
            {/* Stepped hatched pattern for 90% confidence band (wide spacing) */}
            <pattern
              id="hatch-wide"
              width="10"
              height="10"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="10" stroke="#111110" strokeWidth="1.2" opacity="0.45" />
            </pattern>

            {/* Stepped hatched pattern for 60% confidence band (dense spacing) */}
            <pattern
              id="hatch-dense"
              width="5"
              height="5"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="5" stroke="#111110" strokeWidth="1.5" opacity="0.65" />
            </pattern>
          </defs>

          {/* Hairline Grid */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={yScale(tick)}
                x2={padding.left + plotWidth}
                y2={yScale(tick)}
                stroke="var(--ink)"
                strokeWidth="1"
                strokeDasharray="2,4"
                opacity="0.3"
              />
              <text
                x={padding.left + plotWidth + 8}
                y={yScale(tick) + 4}
                fontFamily="var(--font-mono)"
                fontSize="11"
                fill="var(--ink)"
                textAnchor="start"
              >
                ${tick.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Forecast boundary split line */}
          <line
            x1={fanX(0)}
            y1={padding.top}
            x2={fanX(0)}
            y2={padding.top + plotHeight}
            stroke="var(--ink)"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          <text
            x={fanX(0) + 6}
            y={padding.top + 14}
            fontFamily="var(--font-mono)"
            fontSize="10"
            fontWeight="700"
            fill="var(--ink)"
          >
            TODAY → {monteCarlo.horizon_days}D FORECAST
          </text>

          {/* Bollinger Bands Shading */}
          {showBollinger && (
            <path
              d={
                area<PricePoint>()
                  .x((_, i) => xScale(i))
                  .y0((d) => yScale(d.bollinger_lower))
                  .y1((d) => yScale(d.bollinger_upper))
                  .curve(curveLinear)(priceHistory) || undefined
              }
              fill="rgba(17, 17, 16, 0.08)"
            />
          )}

          {/* Monte Carlo 90% Hatched Band */}
          <path
            d={area90(monteCarlo.fan_timeline) || undefined}
            fill="url(#hatch-wide)"
            stroke="var(--ink)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />

          {/* Monte Carlo 60% Hatched Band */}
          <path
            d={area60(monteCarlo.fan_timeline) || undefined}
            fill="url(#hatch-dense)"
            stroke="var(--ink)"
            strokeWidth="1"
          />

          {/* Monte Carlo Median Line */}
          <path
            d={medianLine(monteCarlo.fan_timeline) || undefined}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2"
          />

          {/* Historical Price Line */}
          <path
            d={priceLine(priceHistory) || undefined}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.8"
          />

          {/* SMA 20 Line */}
          {showSma20 && (
            <path
              d={sma20Line(priceHistory) || undefined}
              fill="none"
              stroke="var(--mute)"
              strokeWidth="1.4"
            />
          )}

          {/* SMA 50 Line */}
          {showSma50 && (
            <path
              d={sma50Line(priceHistory) || undefined}
              fill="none"
              stroke="var(--signal)"
              strokeWidth="1.4"
            />
          )}

          {/* Direct Labels on Forecast Fan */}
          <text
            x={fanX(monteCarlo.horizon_days) + 8}
            y={yScale(monteCarlo.range_90[1]) + 4}
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--gain)"
            fontWeight="700"
          >
            P95: ${monteCarlo.range_90[1].toFixed(1)}
          </text>

          <text
            x={fanX(monteCarlo.horizon_days) + 8}
            y={yScale(monteCarlo.median_price) + 4}
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--ink)"
            fontWeight="800"
          >
            MED: ${monteCarlo.median_price.toFixed(1)}
          </text>

          <text
            x={fanX(monteCarlo.horizon_days) + 8}
            y={yScale(monteCarlo.range_90[0]) + 4}
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--signal)"
            fontWeight="700"
          >
            P05: ${monteCarlo.range_90[0].toFixed(1)}
          </text>
        </svg>
      </div>

      {/* Direct Forecast Explanation Strip */}
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--ink)", paddingTop: "10px", marginTop: "10px", flexWrap: "wrap", gap: "10px" }}>
        <div className="mono" style={{ fontSize: "12px" }}>
          <span style={{ color: "var(--signal)", fontWeight: 800 }}>P(LOSS): {(monteCarlo.prob_loss * 100).toFixed(1)}%</span>
          {" | "}
          <span style={{ color: "var(--gain)", fontWeight: 800 }}>P(GAIN): {(monteCarlo.prob_gain * 100).toFixed(1)}%</span>
          {" | "}
          <span>90% RANGE: ${monteCarlo.range_90[0]} — ${monteCarlo.range_90[1]}</span>
        </div>
        <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
          STEPS: DENSE HATCH = 60% CONFIDENCE | WIDE HATCH = 90% CONFIDENCE
        </div>
      </div>
    </div>
  );
};
