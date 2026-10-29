import React, { useState } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { line, area, curveLinear } from "d3-shape";
import { PricePoint, MonteCarloData } from "../types";
import { getCurrencySymbol } from "../utils/format";

interface SvgPriceFanChartProps {
  priceHistory: PricePoint[];
  monteCarlo: MonteCarloData;
  ticker: string;
  market?: string;
  currency?: string;
}

export const SvgPriceFanChart: React.FC<SvgPriceFanChartProps> = ({
  priceHistory,
  monteCarlo,
  ticker,
  market,
  currency
}) => {
  const currSymbol = getCurrencySymbol({ ticker, market, currency });
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [indicatorView, setIndicatorView] = useState<"RSI" | "MACD" | "NONE">("RSI");

  // Chart dimensions with dedicated left margin for Y-axis price ticks and dedicated right margin for Monte Carlo callout badges
  const width = 860;
  const height = 360;
  const padding = { top: 28, right: 120, bottom: 32, left: 70 };
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
  const fanEndX = fanX(monteCarlo.horizon_days);

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

  // Anti-collision spacing for Monte Carlo fan labels on right edge
  const rawP95 = monteCarlo.range_90[1];
  const rawMed = monteCarlo.median_price;
  const rawP05 = monteCarlo.range_90[0];

  let yP95 = yScale(rawP95);
  let yMed = yScale(rawMed);
  let yP05 = yScale(rawP05);

  const MIN_LABEL_GAP = 22; // Minimum vertical gap in pixels between label centers
  if (yMed - yP95 < MIN_LABEL_GAP) {
    yP95 = yMed - MIN_LABEL_GAP;
  }
  if (yP05 - yMed < MIN_LABEL_GAP) {
    yP05 = yMed + MIN_LABEL_GAP;
  }
  // Clamp within SVG plot area
  if (yP95 < padding.top + 10) yP95 = padding.top + 10;
  if (yP05 > padding.top + plotHeight - 10) yP05 = padding.top + plotHeight - 10;

  // Key date tick indices for bottom X-axis
  const dateTickIndices = [
    0,
    Math.floor(histEndIdx * 0.35),
    Math.floor(histEndIdx * 0.70),
    histEndIdx
  ];

  return (
    <div style={{ border: "2px solid var(--ink)", backgroundColor: "var(--paper)", padding: "18px" }}>
      {/* Chart Header & Indicator Toggles */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px", marginBottom: "12px", borderBottom: "1px solid var(--ink)", paddingBottom: "10px" }}>
        <div>
          <span className="mono" style={{ fontSize: "14px", fontWeight: 800 }}>
            {ticker} — PRICE ACTION & {monteCarlo.horizon_days}D MONTE CARLO FORECAST FAN
          </span>
          <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
            CURRENT: {currSymbol}{monteCarlo.current_price.toFixed(2)} | 5,000 BOOTSTRAP PATHS | STEPPED HATCHED UNCERTAINTY BANDS
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

          {/* Left Y-Axis Baseline */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="var(--ink)"
            strokeWidth="1.5"
          />

          {/* Bottom X-Axis Baseline */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="var(--ink)"
            strokeWidth="1.5"
          />

          {/* Hairline Horizontal Grid & LEFT Y-Axis Price Labels */}
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
                opacity="0.25"
              />
              {/* Tick marker */}
              <line
                x1={padding.left - 4}
                y1={yScale(tick)}
                x2={padding.left}
                y2={yScale(tick)}
                stroke="var(--ink)"
                strokeWidth="1.5"
              />
              {/* Left Y-axis text: completely isolated from the right-hand forecast fan */}
              <text
                x={padding.left - 8}
                y={yScale(tick) + 4}
                fontFamily="var(--font-mono)"
                fontSize="11"
                fontWeight="600"
                fill="var(--ink)"
                textAnchor="end"
              >
                {currSymbol}{tick.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Bottom X-Axis Historical Date Labels */}
          {dateTickIndices.map((idx) => {
            const pt = priceHistory[idx];
            if (!pt) return null;
            return (
              <g key={idx}>
                <line
                  x1={xScale(idx)}
                  y1={padding.top + plotHeight}
                  x2={xScale(idx)}
                  y2={padding.top + plotHeight + 4}
                  stroke="var(--ink)"
                  strokeWidth="1"
                />
                <text
                  x={xScale(idx)}
                  y={padding.top + plotHeight + 16}
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fill="var(--mute)"
                  textAnchor="middle"
                >
                  {pt.date?.slice(2) || ""}
                </text>
              </g>
            );
          })}

          {/* Bottom Horizon End Tick */}
          <g>
            <line
              x1={fanEndX}
              y1={padding.top + plotHeight}
              x2={fanEndX}
              y2={padding.top + plotHeight + 4}
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            <text
              x={fanEndX}
              y={padding.top + plotHeight + 16}
              fontFamily="var(--font-mono)"
              fontSize="10"
              fontWeight="800"
              fill="var(--ink)"
              textAnchor="middle"
            >
              +{monteCarlo.horizon_days}D
            </text>
          </g>

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

          {/* Today current price anchor dot */}
          <circle
            cx={fanX(0)}
            cy={yScale(monteCarlo.current_price)}
            r="4"
            fill="var(--ink)"
            stroke="var(--paper)"
            strokeWidth="1.5"
          />

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

          {/* Leader Lines Connecting Fan Edge to Callout Badges */}
          <line
            x1={fanEndX}
            y1={yScale(rawP95)}
            x2={fanEndX + 8}
            y2={yP95}
            stroke="var(--gain)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <line
            x1={fanEndX}
            y1={yScale(rawMed)}
            x2={fanEndX + 8}
            y2={yMed}
            stroke="var(--ink)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <line
            x1={fanEndX}
            y1={yScale(rawP05)}
            x2={fanEndX + 8}
            y2={yP05}
            stroke="var(--signal)"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* P95 Callout Badge */}
          <g transform={`translate(${fanEndX + 8}, ${yP95 - 9})`}>
            <rect
              x="0"
              y="0"
              width="104"
              height="18"
              fill="var(--paper)"
              stroke="var(--gain)"
              strokeWidth="1.5"
            />
            <text
              x="6"
              y="13"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fontWeight="800"
              fill="var(--gain)"
            >
              P95: {currSymbol}{rawP95.toFixed(1)}
            </text>
          </g>

          {/* Median Callout Badge */}
          <g transform={`translate(${fanEndX + 8}, ${yMed - 9})`}>
            <rect
              x="0"
              y="0"
              width="104"
              height="18"
              fill="var(--paper)"
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            <text
              x="6"
              y="13"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fontWeight="800"
              fill="var(--ink)"
            >
              MED: {currSymbol}{rawMed.toFixed(1)}
            </text>
          </g>

          {/* P05 Callout Badge */}
          <g transform={`translate(${fanEndX + 8}, ${yP05 - 9})`}>
            <rect
              x="0"
              y="0"
              width="104"
              height="18"
              fill="var(--paper)"
              stroke="var(--signal)"
              strokeWidth="1.5"
            />
            <text
              x="6"
              y="13"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fontWeight="800"
              fill="var(--signal)"
            >
              P05: {currSymbol}{rawP05.toFixed(1)}
            </text>
          </g>
        </svg>
      </div>

      {/* Direct Forecast Explanation Strip */}
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--ink)", paddingTop: "10px", marginTop: "10px", flexWrap: "wrap", gap: "10px" }}>
        <div className="mono" style={{ fontSize: "12px" }}>
          <span style={{ color: "var(--signal)", fontWeight: 800 }}>P(LOSS): {(monteCarlo.prob_loss * 100).toFixed(1)}%</span>
          {" | "}
          <span style={{ color: "var(--gain)", fontWeight: 800 }}>P(GAIN): {(monteCarlo.prob_gain * 100).toFixed(1)}%</span>
          {" | "}
          <span>90% RANGE: {currSymbol}{monteCarlo.range_90[0]} — {currSymbol}{monteCarlo.range_90[1]}</span>
        </div>
        <div className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
          STEPS: DENSE HATCH = 60% CONFIDENCE | WIDE HATCH = 90% CONFIDENCE
        </div>
      </div>
    </div>
  );
};
