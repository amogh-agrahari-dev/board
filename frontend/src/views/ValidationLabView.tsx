import React, { useEffect, useState } from "react";
import { fetchValidation } from "../api/client";
import { Market } from "../types";
import { line, curveLinear } from "d3-shape";
import { scaleLinear } from "d3-scale";

interface ValidationLabViewProps {
  initialMarket: Market;
}

export const ValidationLabView: React.FC<ValidationLabViewProps> = ({ initialMarket }) => {
  const [market, setMarket] = useState<Market>(initialMarket === "BOTH" ? "US" : initialMarket);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchValidation(market)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [market]);

  if (loading || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="inverted" style={{ padding: "40px", border: "2px solid var(--ink)", display: "inline-block" }}>
          <div className="headline" style={{ fontSize: "24px", color: "var(--signal)" }}>
            COMPUTING CROSS-MARKET WALK-FORWARD BENCHMARKS...
          </div>
        </div>
      </div>
    );
  }

  const backtest = data.backtest;
  const beatsBenchmark = backtest?.beats_benchmark;

  // Build SVG backtest comparison chart
  const chartWidth = 840;
  const chartHeight = 260;
  const padding = { top: 20, right: 80, bottom: 30, left: 20 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const timeline = backtest?.timeline || [];
  const stratVals = timeline.map((d: any) => d.strategy);
  const benchVals = timeline.map((d: any) => d.benchmark);
  const minY = Math.min(0.85, ...stratVals, ...benchVals);
  const maxY = Math.max(1.20, ...stratVals, ...benchVals);

  const xScale = scaleLinear().domain([0, Math.max(1, timeline.length - 1)]).range([padding.left, padding.left + plotWidth]);
  const yScale = scaleLinear().domain([minY, maxY]).range([padding.top + plotHeight, padding.top]);

  const stratLine = line<any>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d.strategy))
    .curve(curveLinear);

  const benchLine = line<any>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d.benchmark))
    .curve(curveLinear);

  const yTicks = yScale.ticks(5);

  return (
    <div style={{ padding: "28px", maxWidth: "1280px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid var(--ink)", paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <span className="mono" style={{ fontSize: "12px", color: "var(--mute)" }}>
            STAGE 4 & 5 EMPIRICAL HONESTY PAGE
          </span>
          <h2 style={{ fontSize: "48px", margin: "4px 0 0 0" }}>VALIDATION LAB</h2>
        </div>

        {/* Market Toggle */}
        <div style={{ display: "flex", border: "2px solid var(--ink)" }}>
          {(["US", "IN"] as Market[]).map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className={market === m ? "btn-inverted" : ""}
              style={{
                border: "none",
                borderRight: m === "US" ? "1px solid var(--ink)" : "none",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 800
              }}
            >
              {m === "IN" ? "INDIA (NSE)" : "US (S&P 100)"}
            </button>
          ))}
        </div>
      </div>

      {/* Red Honesty Alert Banner if benchmark is not beaten */}
      {!beatsBenchmark && (
        <div className="inverted-signal" style={{ border: "2px solid var(--ink)", padding: "16px 20px", marginBottom: "24px" }}>
          <div className="headline" style={{ fontSize: "20px", color: "var(--paper)" }}>
            HONESTY ADVISORY: MODEL RANKING DID NOT OUTPERFORM EQUAL-WEIGHT BENCHMARK
          </div>
          <p style={{ fontSize: "15px", color: "var(--paper)", margin: "4px 0 0 0" }}>
            After factoring in {backtest.transaction_cost_bps} bps friction and periodic 21-day rebalancing, the top-ranked basket did not achieve superior risk-adjusted Sharpe over an unmanaged equal-weight portfolio.
          </p>
        </div>
      )}

      {/* Backtest Section */}
      <div style={{ border: "2px solid var(--ink)", padding: "20px", backgroundColor: "var(--paper)", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "22px", margin: 0 }}>
              OUT-OF-SAMPLE BACKTEST: TOP-3 PICKS VS EQUAL-WEIGHT BENCHMARK
            </h3>
            <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
              ZERO LOOKAHEAD | {backtest.rebalance_days}D REBALANCING | {backtest.transaction_cost_bps} BPS TRANSACTION COSTS
            </span>
          </div>

          <div style={{ display: "flex", gap: "14px" }}>
            <div className="mono" style={{ fontSize: "12px" }}>
              STRATEGY CAGR: <strong>{(backtest.strategy_cagr * 100).toFixed(1)}%</strong> (Sharpe: <strong>{backtest.strategy_sharpe}</strong>, MaxDD: <strong>{(backtest.strategy_max_dd * 100).toFixed(1)}%</strong>)
            </div>
            <div className="mono" style={{ fontSize: "12px", color: "var(--mute)" }}>
              BENCHMARK CAGR: <strong>{(backtest.benchmark_cagr * 100).toFixed(1)}%</strong> (Sharpe: <strong>{backtest.benchmark_sharpe}</strong>, MaxDD: <strong>{(backtest.benchmark_max_dd * 100).toFixed(1)}%</strong>)
            </div>
          </div>
        </div>

        {/* SVG Equity Curve Chart */}
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: "100%", height: "auto", display: "block" }}>
            {yTicks.map((tick: number) => (
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
                >
                  {tick.toFixed(2)}x
                </text>
              </g>
            ))}

            {/* Benchmark line (muted gray dotted) */}
            <path
              d={benchLine(timeline) || undefined}
              fill="none"
              stroke="var(--mute)"
              strokeWidth="1.8"
              strokeDasharray="4,4"
            />

            {/* Strategy line (solid bold ink/signal) */}
            <path
              d={stratLine(timeline) || undefined}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2.4"
            />

            {/* Labels at line ends */}
            {timeline.length > 0 && (
              <>
                <text
                  x={padding.left + plotWidth + 8}
                  y={yScale(timeline[timeline.length - 1].strategy) + 4}
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  fontWeight="800"
                  fill="var(--ink)"
                >
                  TOP PICKS
                </text>
                <text
                  x={padding.left + plotWidth + 8}
                  y={yScale(timeline[timeline.length - 1].benchmark) + 4}
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  fill="var(--mute)"
                >
                  BENCHMARK
                </text>
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Side-by-Side Cross Market Comparison Ledger */}
      <div style={{ border: "2px solid var(--ink)", padding: "20px", backgroundColor: "var(--paper)", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--ink)", paddingBottom: "10px", marginBottom: "14px" }}>
          <div>
            <h3 style={{ fontSize: "22px", margin: 0 }}>
              CROSS-MARKET VALIDATION LEDGER (INDIA VS US SIDE-BY-SIDE)
            </h3>
            <span className="mono" style={{ fontSize: "11px", color: "var(--mute)" }}>
              PREVENTS FLATTERING AGGREGATION | REPORTS ASSET-LEVEL DISCLOSURES
            </span>
          </div>
        </div>

        <table className="ledger">
          <thead>
            <tr>
              <th>MARKET</th>
              <th>ASSET TICKER</th>
              <th className="text-right">DIR ACCURACY</th>
              <th className="text-right">OUT-OF-SAMPLE MAE</th>
              <th>BEATS NAIVE BASELINE?</th>
              <th>TOP ABLATION EXCLUSION</th>
            </tr>
          </thead>
          <tbody>
            {data.cross_market_comparison.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="mono" style={{ fontWeight: 700 }}>{item.market}</td>
                <td className="mono" style={{ fontSize: "14px", fontWeight: 800 }}>{item.asset}</td>
                <td className="text-right mono" style={{ fontWeight: 700, color: item.dir_acc >= 0.53 ? "var(--gain)" : "var(--signal)" }}>
                  {(item.dir_acc * 100).toFixed(1)}%
                </td>
                <td className="text-right mono">{item.mae.toFixed(4)}</td>
                <td>
                  <span className={`tag ${item.beats_naive ? "tag-gain" : "tag-signal"}`} style={{ fontSize: "10px" }}>
                    {item.beats_naive ? "YES (EDGE VERIFIED)" : "NO (FAIL)"}
                  </span>
                </td>
                <td className="mono" style={{ fontSize: "11px", color: item.top_ablation_dropped.includes("NO") ? "var(--signal)" : "var(--mute)" }}>
                  {item.top_ablation_dropped}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Honest Failure Explanations */}
      <div style={{ border: "2px solid var(--ink)", padding: "20px", backgroundColor: "#E2DDD0" }}>
        <h4 style={{ fontSize: "18px", fontFamily: "var(--font-headline)", marginBottom: "8px" }}>
          LIMITATIONS & SURVEY RESEARCH GAPS IN PRACTICE
        </h4>
        <p style={{ fontSize: "16px", lineHeight: "1.5", margin: 0 }}>
          As shown in Section 10 of the literature survey, financial market data exhibits severe non-stationarity.
          Models often experience performance degradation during sudden macro volatility shocks (such as 2022 interest rate shifts).
          BOARD enforces strict out-of-sample gating: if an asset's walk-forward test does not beat the naive persistence baseline,
          the system will transparently output <strong>NO RELIABLE EDGE</strong> rather than issue an unsubstantiated forecast.
        </p>
      </div>
    </div>
  );
};
