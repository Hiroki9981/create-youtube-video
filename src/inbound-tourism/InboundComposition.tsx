import {
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Img,
} from "remotion";
import React from "react";

// Types
export interface InboundScene {
  year: number;
  events: string;
  stats: Record<string, number>;
  isSummary?: boolean;
  audio?: string;
  durationInFrames?: number;
}

export interface InboundVideoProps {
  bgm?: string;
  bgmVolume?: number;
  scenes: InboundScene[];
  width?: number;
  height?: number;
  totalDurationFrames?: number;
}

// ── Flag Image Code Mapping (ISO 2-letter codes) ──
const flagCodes: Record<string, string> = {
  "韓国": "kr",
  "中国": "cn",
  "台湾": "tw",
  "香港": "hk",
  "米国": "us",
  "アメリカ": "us",
  "タイ": "th",
  "英国": "gb",
  "イギリス": "gb",
  "フランス": "fr",
  "ドイツ": "de",
  "ロシア": "ru",
  "オーストラリア": "au",
  "豪州": "au",
  "シンガポール": "sg",
  "フィリピン": "ph",
  "ベトナム": "vn",
  "マレーシア": "my",
  "インドネシア": "id",
};

// ── Year-based Color Palette for Growth Delta Stacking ──
const yearColors: Record<number, string> = {
  2016: "#38bdf8",   // Sky Blue
  2017: "#34d399",   // Mint Green
  2018: "#fbbf24",   // Golden Yellow
  2019: "#f87171",   // Coral Red
  2020: "#ef4444",   // Red (COVID)
  2021: "#f97316",   // Orange
  2022: "#a855f7",   // Purple
  2023: "#06b6d4",   // Cyan
  2024: "#ec4899",   // Hot Pink (Yen Drop Surge)
  2025: "#10b981",   // Emerald Green
};

// ── Layout constants for 9:16 (1080×1920) Shorts Optimized ──
const CHART_BAR_START_X = 230;
const CHART_WIDTH = 360;    // Reduced to 360px so value labels never overlap with bars or right border
const BAR_HEIGHT = 44;      // Height for 10 countries
const BAR_SPACING = 72;     // Spacing for 10 countries
const BAR_TOP_OFFSET = 18;
const LABEL_WIDTH = 210;    // Area for Flag Image + Country Name

// ── Main Inbound Tourism Composition Component ──
export const InboundComponent: React.FC<InboundVideoProps> = ({
  scenes,
  bgm,
  bgmVolume = 0.15,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: totalDuration } = useVideoConfig();

  const bgmFile = staticFile(bgm || "data/audio/shining_star.mp3");

  // ── Frame 0: Clean, Ultra-Simple Catchy Thumbnail ──
  if (frame === 0) {
    return (
      <div
        style={{
          width: 1080,
          height: 1920,
          background: "#08090c",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit', 'Inter', 'Noto Sans JP', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Audio src={bgmFile} volume={bgmVolume} loop />

        {/* Clean background image with simple dark overlay */}
        <Img
          src={staticFile("data/inbound-tourism/thumbnail_bg.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        {/* Simple Dark overlay for text legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8, 9, 12, 0.85)",
            zIndex: 1,
          }}
        />

        {/* Main Title Only (Clean, Ultra-Simple, Big) */}
        <h1
          style={{
            fontSize: 96,
            fontWeight: 950,
            textAlign: "center",
            lineHeight: 1.35,
            margin: 0,
            zIndex: 10,
            color: "#ffffff",
            textShadow: "0 10px 40px rgba(0,0,0,0.95)",
          }}
        >
          日本に来る外国人<br />
          <span
            style={{
              color: "#fbbf24",
              fontSize: 102,
              fontWeight: 950,
              textShadow: "0 0 20px rgba(251, 191, 36, 0.5)",
            }}
          >
            10年でどう変わった？
          </span>
        </h1>
      </div>
    );
  }

  // Shift video logic by 1 frame to accommodate thumbnail frame at start
  const adjustedFrame = frame - 1;

  // ── 1. Timeline & Scene Calculation ──
  let cumulativeFrames = 0;
  let currentSceneIndex = scenes.length - 1;

  for (let i = 0; i < scenes.length; i++) {
    const dur = scenes[i].durationInFrames || 120;
    if (adjustedFrame < cumulativeFrames + dur) {
      currentSceneIndex = i;
      break;
    }
    cumulativeFrames += dur;
  }

  const currentScene = scenes[currentSceneIndex];
  const isSummary = currentScene.isSummary || false;
  const sceneDuration = currentScene.durationInFrames || 120;
  const localFrame = adjustedFrame - cumulativeFrames;

  const progress = Math.min(localFrame / sceneDuration, 1);

  // ── 2. Clean, Perfectly Balanced Summary Ending Card ──
  if (isSummary) {
    return (
      <div
        style={{
          width: 1080,
          height: 1920,
          backgroundColor: "#050608",
          color: "#ffffff",
          fontFamily: "'Outfit', 'Inter', 'Noto Sans JP', sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "180px 40px 320px 40px", // 320px bottom safe zone for Shorts UI
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          justifyContent: "space-between",
        }}
      >
        {bgm && <Audio src={staticFile(bgm)} volume={bgmVolume} />}

        {/* Cyber Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.008) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.008) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Glow Overlays */}
        <div style={{ position: "absolute", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(56, 189, 248, 0.06) 0%, transparent 70%)", top: "15%", left: "10%", zIndex: 1, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(236, 72, 153, 0.06) 0%, transparent 70%)", bottom: "25%", right: "10%", zIndex: 1, pointerEvents: "none" }} />

        {/* Big Clean Title */}
        <h2
          style={{
            fontSize: "68px",
            fontWeight: 950,
            textAlign: "center",
            margin: "0 0 40px 0",
            zIndex: 10,
            color: "#ffffff",
            letterSpacing: "-1px",
            textShadow: "0 10px 30px rgba(0, 0, 0, 0.9)",
          }}
        >
          10年間でどう変わった？
        </h2>

        {/* Perfectly Balanced Fact Cards Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            width: "800px",
            zIndex: 10,
          }}
        >
          {/* Fact 1 */}
          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1.5px solid rgba(255, 255, 255, 0.08)", borderRadius: "24px", padding: "26px 32px", display: "flex", alignItems: "center", gap: "28px" }}>
            <div style={{ fontSize: "44px", color: "#38bdf8", fontWeight: 950, width: "36px", textAlign: "center" }}>1</div>
            <div>
              <div style={{ fontSize: "20px", color: "#9ca3af", fontWeight: 700, marginBottom: "4px" }}>圧倒的な人数</div>
              <div style={{ fontSize: "30px", color: "#ffffff", fontWeight: 900 }}>10年ずっと <span style={{ color: "#38bdf8" }}>韓国 ＆ 中国</span> がトップ2！</div>
            </div>
          </div>

          {/* Fact 2 */}
          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1.5px solid rgba(255, 255, 255, 0.08)", borderRadius: "24px", padding: "26px 32px", display: "flex", alignItems: "center", gap: "28px" }}>
            <div style={{ fontSize: "44px", color: "#ef4444", fontWeight: 950, width: "36px", textAlign: "center" }}>2</div>
            <div>
              <div style={{ fontSize: "20px", color: "#9ca3af", fontWeight: 700, marginBottom: "4px" }}>ショックな出来事</div>
              <div style={{ fontSize: "30px", color: "#ffffff", fontWeight: 900 }}>2020年のコロナで <span style={{ color: "#ef4444" }}>一度ほぼ全滅…</span></div>
            </div>
          </div>

          {/* Fact 3 */}
          <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1.5px solid rgba(255, 255, 255, 0.08)", borderRadius: "24px", padding: "26px 32px", display: "flex", alignItems: "center", gap: "28px" }}>
            <div style={{ fontSize: "44px", color: "#fbbf24", fontWeight: 950, width: "36px", textAlign: "center" }}>3</div>
            <div>
              <div style={{ fontSize: "20px", color: "#9ca3af", fontWeight: 700, marginBottom: "4px" }}>円安の強烈な影響</div>
              <div style={{ fontSize: "30px", color: "#ffffff", fontWeight: 900 }}>空前の円安で <span style={{ color: "#fbbf24" }}>史上最多の3,500万人越え！</span></div>
            </div>
          </div>
        </div>

        {/* Expanded, High-Visibility CTA Comment Prompt */}
        <div
          style={{
            width: "800px",
            zIndex: 10,
            background: "linear-gradient(180deg, rgba(236, 72, 153, 0.18) 0%, rgba(8, 9, 12, 0.95) 100%)",
            border: "3px dashed #ec4899",
            borderRadius: "28px",
            padding: "32px 28px",
            boxShadow: "0 15px 35px rgba(0, 0, 0, 0.7)",
            boxSizing: "border-box",
            marginTop: "36px",
          }}
        >
          <p style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", margin: "0 0 12px 0", textAlign: "center", lineHeight: "1.4" }}>
            外国人が急増して街や観光地が混んでるの、どう思う？
          </p>
          <p
            style={{
              fontSize: "34px",
              fontWeight: 950,
              color: "#ec4899",
              textShadow: "0 0 15px rgba(236, 72, 153, 0.5)",
              margin: 0,
              textAlign: "center",
            }}
          >
            👇 ぜひコメント欄で教えてね！ 👇
          </p>
        </div>
      </div>
    );
  }

  // ── 3. Normal Chart Scene Interpolation ──
  const prevSceneIdx = Math.max(0, currentSceneIndex - 1);
  const prevScene = scenes[prevSceneIdx];

  // Directly display currentScene.year to perfectly match event text!
  const displayYear = currentScene.year;

  // Gather country data & Calculate animated currentValue from previous year to current year
  const allCountries = Object.keys(scenes[0]?.stats || {});
  const countryData = allCountries.map((country) => {
    const fromVal = currentSceneIndex === 0 ? 0 : (prevScene.stats[country] || 0);
    const toVal = currentScene.stats[country] || 0;

    const currentValue = interpolate(progress, [0, 1], [fromVal, toVal], {
      extrapolateRight: "clamp",
    });

    // Build positive-delta segments for proportional year-by-year color stacking
    const positiveDeltas: { year: number; delta: number }[] = [];

    for (let i = 0; i <= currentSceneIndex; i++) {
      const prev = i === 0 ? 0 : (scenes[i - 1].stats[country] || 0);
      const delta = (scenes[i].stats[country] || 0) - prev;
      if (delta > 0) {
        positiveDeltas.push({ year: scenes[i].year, delta });
      }
    }

    const totalPositive = positiveDeltas.reduce((s, d) => s + d.delta, 0);

    return { country, currentValue, positiveDeltas, totalPositive };
  });

  // Sort ALL countries (Keep original 10 countries!)
  const sorted = [...countryData].sort((a, b) => b.currentValue - a.currentValue);
  const maxValue = Math.max(...sorted.map((d) => d.currentValue), 1);

  // BGM volume fade out
  const outroStartFrame = (totalDuration - 1) - 90;
  const currentVolume = interpolate(
    adjustedFrame,
    [outroStartFrame, (totalDuration - 1) - 15],
    [bgmVolume, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: "#08090c",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "60px 40px 20px 40px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Outfit', 'Inter', 'Noto Sans JP', sans-serif",
      }}
    >
      {bgm && <Audio src={staticFile(bgm)} volume={currentVolume} />}

      {/* Cyber Grid Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Top Spacer for Shorts UI Safe Zone */}
      <div style={{ height: 200 }} />

      {/* ═══ 1. FIXED HEADER BANNER & YEAR BADGE ═══ */}
      <div
        style={{
          width: "800px",
          background: "linear-gradient(180deg, rgba(20, 24, 33, 0.95) 0%, rgba(8, 9, 12, 0.95) 100%)",
          border: "2px solid #38bdf8",
          borderRadius: "24px",
          padding: "18px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 10px 30px rgba(56, 189, 248, 0.2), 0 0 25px rgba(0, 0, 0, 0.8)",
          zIndex: 10,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#38bdf8", boxShadow: "0 0 12px #38bdf8" }} />
          <span style={{ fontSize: "30px", fontWeight: 900, color: "#ffffff", letterSpacing: "1px" }}>
            国別 訪日外国人ランキング
          </span>
        </div>
        {/* Huge Year Badge */}
        <span
          style={{
            fontSize: "64px",
            fontWeight: 900,
            color: "#fbbf24",
            textShadow: "0 0 20px rgba(251, 191, 36, 0.5)",
            fontFamily: "'Outfit', monospace",
          }}
        >
          {displayYear}年
        </span>
      </div>

      {/* ═══ 2. EXPLANATORY EVENT TEXT CONTAINER ═══ */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(20, 24, 33, 0.95) 0%, rgba(8, 9, 12, 0.95) 100%)",
          border: "2px solid #ef4444",
          borderRadius: "24px",
          padding: "18px 36px",
          height: "125px",
          width: "800px",
          margin: "14px auto 0 auto",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          zIndex: 10,
          boxShadow: "0 10px 30px rgba(239, 68, 68, 0.15), 0 0 25px rgba(0, 0, 0, 0.8)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "46px",
            backgroundColor: "#ef4444",
            borderRadius: "4px",
            marginRight: "20px",
            boxShadow: "0 0 12px #ef4444",
            flexShrink: 0,
          }}
        />
        <p
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: "1.4",
            margin: 0,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {currentScene.events}
        </p>
      </div>

      {/* ═══ 3. ALL 10 COUNTRIES RANKING CHART (With Overlap-Free Layout) ═══ */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.00) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "32px",
          padding: "20px 32px",
          width: "800px",
          margin: "14px auto 0 auto",
          zIndex: 10,
          height: "770px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Bars Container for all countries */}
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {sorted.map((item) => {
            const rank = sorted.findIndex((d) => d.country === item.country);
            const barPixelWidth = (item.currentValue / maxValue) * CHART_WIDTH;
            const topPosition = rank * BAR_SPACING + BAR_TOP_OFFSET;
            const flagCode = flagCodes[item.country] || "us";

            // Format numbers to 簡潔な「万人」
            const mainValueInTenThousand = (item.currentValue / 10000).toLocaleString("ja-JP", {
              maximumFractionDigits: 0,
            });

            // Calculate positive-delta segments for proportional year-by-year color breakdown
            const segments =
              item.totalPositive > 0
                ? item.positiveDeltas.map((d) => ({
                    year: d.year,
                    pixelWidth: (d.delta / item.totalPositive) * barPixelWidth,
                    color: yearColors[d.year] || "#38bdf8",
                  }))
                : [];

            return (
              <div
                key={item.country}
                style={{
                  position: "absolute",
                  top: topPosition,
                  left: 0,
                  width: "100%",
                  height: BAR_HEIGHT,
                  transition: "top 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Country Name Label with REAL Flag Image */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    width: LABEL_WIDTH,
                    textAlign: "right",
                    fontWeight: 900,
                    fontSize: 26,
                    color: "#ffffff",
                    paddingRight: 16,
                    letterSpacing: "1px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}
                >
                  <Img
                    src={staticFile(`data/inbound-tourism/flags/${flagCode}.png`)}
                    style={{
                      width: "36px",
                      height: "25px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  <span>{item.country}</span>
                </div>

                {/* Stacked Year-by-Year Color Bar Segment */}
                <div
                  style={{
                    position: "absolute",
                    left: CHART_BAR_START_X,
                    width: Math.max(barPixelWidth, 6),
                    height: "100%",
                    display: "flex",
                    borderRadius: "0 8px 8px 0",
                    overflow: "hidden",
                    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  {segments.length > 0 ? (
                    segments.map((seg, si) => (
                      <div
                        key={`${item.country}-${seg.year}-${si}`}
                        style={{
                          width: Math.max(seg.pixelWidth, 0),
                          height: "100%",
                          backgroundColor: seg.color,
                          borderRight: si < segments.length - 1 ? "1px solid rgba(0,0,0,0.35)" : "none",
                          transition: "width 0.05s linear",
                        }}
                      />
                    ))
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#38bdf8",
                      }}
                    />
                  )}
                </div>

                {/* Value Label in 万人 (Positioned cleanly outside without overlapping bars) */}
                <span
                  style={{
                    position: "absolute",
                    left: CHART_BAR_START_X + Math.max(barPixelWidth, 6) + 16,
                    color: "#ffffff",
                    fontSize: 26,
                    fontWeight: 900,
                    fontFamily: "'Outfit', monospace",
                    whiteSpace: "nowrap",
                    transition: "left 0.05s linear",
                    textShadow: "0 0 10px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  {mainValueInTenThousand} <span style={{ fontSize: "20px", color: "#9ca3af", fontWeight: 700 }}>万人</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ 4. YEAR COLOR LEGEND BAR (Visual guide to see which color corresponds to which year's growth) ═══ */}
      <div
        style={{
          width: "800px",
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "12px 20px",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px 12px",
          justifyItems: "center",
          alignItems: "center",
          zIndex: 10,
          boxSizing: "border-box",
          margin: "10px auto 0 auto",
        }}
      >
        {Object.entries(yearColors)
          .filter(([year]) => Number(year) >= 2016)
          .map(([year, color]) => (
            <div
              key={year}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  backgroundColor: color,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "#e2e8f0",
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                {year}年
              </span>
            </div>
          ))}
      </div>

      {/* ═══ 5. FOOTER: SOURCE CREDITS & NOTICE (Safe-Zone 260px spacing below) ═══ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          zIndex: 10,
          marginBottom: "260px", // Pushed up for Shorts UI overlay safety
          marginTop: "10px",
        }}
      >
        <span
          style={{
            color: "#6b7280",
            fontSize: "18px",
            fontWeight: 800,
            letterSpacing: "0.5px",
          }}
        >
          出典: 日本政府観光局 (JNTO)「訪日外客統計」
        </span>
      </div>
    </div>
  );
};
