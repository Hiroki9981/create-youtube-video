import {
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import React from "react";

// Types
export interface InboundScene {
  year: number;
  events: string;
  stats: Record<string, number>;
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

// ── Year-based color palette (high contrast on dark bg) ──
const yearColors: Record<number, string> = {
  2015: "#ffffff",   // White (base)
  2016: "#dfe6e9",   // Light Gray
  2017: "#00b894",   // Teal Green
  2018: "#0984e3",   // Royal Blue
  2019: "#fdcb6e",   // Gold/Yellow
  2020: "#ff4757",   // Coral Red (COVID drop)
  2021: "#ffa502",   // Orange
  2022: "#6c5ce7",   // Purple
  2023: "#00cec9",   // Bright Cyan
  2024: "#e84393",   // Hot Pink
  2025: "#55efc4",   // Pastel Mint Green
};

// ── Layout constants for 9:16 (1080×1920) ──
const CHART_BAR_START_X = 210;
const CHART_WIDTH = 640;
const BAR_HEIGHT = 60;
const BAR_SPACING = 145;
const BAR_TOP_OFFSET = 30;
const LABEL_WIDTH = 170;
const INTRO_FRAMES = 75; // 2.5 seconds intro animation

// ── Intro Title Animation Component ──
const IntroOverlay: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  // Overall opacity envelope: fade in → hold → fade out
  const envelope = interpolate(
    frame,
    [0, 12, 55, 75],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Horizontal accent line: expands from center
  const lineWidth = interpolate(frame, [5, 30], [0, 500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Main title: spring scale-in
  const titleSpring = spring({
    frame: Math.max(frame - 8, 0),
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 80 },
  });
  const titleScale = interpolate(titleSpring, [0, 1], [1.2, 1]);
  const titleOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle year range: slides up
  const subOpacity = interpolate(frame, [28, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [28, 42], [25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        opacity: envelope,
        pointerEvents: "none",
      }}
    >
      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Top accent line */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(96,165,250,0.8), #f7dc6f, rgba(96,165,250,0.8), transparent)",
          marginBottom: 40,
          borderRadius: 2,
        }}
      />

      {/* Main title */}
      <div
        style={{
          fontSize: 52,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "4px",
          textShadow:
            "0 0 40px rgba(96,165,250,0.5), 0 0 80px rgba(96,165,250,0.2)",
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
        }}
      >
        訪日観光客数推移
      </div>

      {/* Year range subtitle */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: "#60a5fa",
          letterSpacing: "6px",
          marginTop: 20,
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          textShadow: "0 0 20px rgba(96,165,250,0.4)",
          fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
        }}
      >
        ( 2016 ~ 2025 )
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(96,165,250,0.8), #f7dc6f, rgba(96,165,250,0.8), transparent)",
          marginTop: 40,
          borderRadius: 2,
        }}
      />
    </div>
  );
};

// ── Outro Animation Component ──
const OutroOverlay: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const bgOpacity = interpolate(frame, [0, 20], [0, 0.95], { extrapolateRight: "clamp" });
  const textOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  const springScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const iconSpring = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: `rgba(10, 10, 15, ${bgOpacity})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity: textOpacity,
          transform: `scale(${interpolate(springScale, [0, 1], [0.8, 1])})`,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: "#ffffff",
            marginBottom: 60,
            textShadow: "0 0 30px rgba(255,255,255,0.3)",
          }}
        >
          ご視聴ありがとうございました！
        </h2>

        <div
          style={{
            background: "linear-gradient(135deg, #fd79a8 0%, #a29bfe 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.4,
            filter: "drop-shadow(0 0 40px rgba(253, 121, 168, 0.4))",
          }}
        >
          チャンネル登録 &<br />高評価
        </div>

        <div
          style={{
            fontSize: 40,
            color: "#e2e8f0",
            marginTop: 20,
            fontWeight: 800,
            letterSpacing: "2px",
          }}
        >
          よろしくお願いします！
        </div>

        {/* Animated Icons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 50, marginTop: 60 }}>
          <div style={{ fontSize: 80, transform: `scale(${iconSpring})` }}>👍</div>
          <div style={{ fontSize: 80, transform: `scale(${iconSpring})` }}>▶️</div>
          <div style={{ fontSize: 80, transform: `scale(${iconSpring})` }}>🔔</div>
        </div>
      </div>
    </div>
  );
};

// ── Main Inbound Tourism Composition Component ──
export const InboundComponent: React.FC<InboundVideoProps> = ({
  scenes,
  bgm,
  bgmVolume = 0.15,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: totalDuration } = useVideoConfig();

  // ── 1. Determine current scene index and local frame ──
  let cumulativeFrames = 0;
  let currentSceneIndex = scenes.length - 1;

  for (let i = 0; i < scenes.length; i++) {
    const dur = scenes[i].durationInFrames || 180;
    if (frame < cumulativeFrames + dur) {
      currentSceneIndex = i;
      break;
    }
    cumulativeFrames += dur;
  }

  const currentScene = scenes[currentSceneIndex];
  const eventText = currentScene.events;
  const nextSceneIdx = Math.min(currentSceneIndex + 1, scenes.length - 1);
  const nextScene = scenes[nextSceneIdx];
  const sceneDuration = currentScene.durationInFrames || 180;
  const localFrame = frame - cumulativeFrames;

  // ── 2. Intro handling ──
  // The intro plays during the first INTRO_FRAMES of scene 0.
  // Chart progress within scene 0 is offset by INTRO_FRAMES.
  const isInIntro = currentSceneIndex === 0 && localFrame < INTRO_FRAMES;

  const chartLocalFrame =
    currentSceneIndex === 0
      ? Math.max(0, localFrame - INTRO_FRAMES)
      : localFrame;
  const chartSceneDuration =
    currentSceneIndex === 0
      ? Math.max(1, sceneDuration - INTRO_FRAMES)
      : sceneDuration;
  const progress = Math.min(chartLocalFrame / chartSceneDuration, 1);

  // Display year (interpolated for watermark)
  const displayYear = interpolate(progress, [0, 1], [currentScene.year, nextScene.year]);

  // Chart opacity (fade in after intro)
  const chartOpacity =
    currentSceneIndex === 0
      ? interpolate(localFrame, [INTRO_FRAMES - 10, INTRO_FRAMES + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  // Fade out BGM in the last 90 frames (3 seconds) to prevent harsh cutting/cracking
  const outroStartFrame = totalDuration - 90;
  const currentVolume = interpolate(
    frame,
    [outroStartFrame, totalDuration - 15],
    [bgmVolume, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // ── 3. Gather all countries ──
  const allCountries = Object.keys(scenes[1]?.stats || scenes[0]?.stats || {});

  // ── 4. For each country, compute currentValue and stacked segments ──
  const countryData = allCountries.map((country) => {
    const fromVal = currentScene.stats[country] || 0;
    const toVal = nextScene.stats[country] || 0;
    const currentValue = interpolate(progress, [0, 1], [fromVal, toVal], {
      extrapolateRight: "clamp",
    });

    // Build positive-delta segments for proportional stacking
    const positiveDeltas: { year: number; delta: number }[] = [];

    for (let i = 1; i <= currentSceneIndex; i++) {
      const delta =
        (scenes[i].stats[country] || 0) - (scenes[i - 1].stats[country] || 0);
      if (delta > 0) {
        positiveDeltas.push({ year: scenes[i].year, delta });
      }
    }

    if (currentSceneIndex < scenes.length - 1) {
      const prevVal = scenes[currentSceneIndex].stats[country] || 0;
      const transitionDelta = currentValue - prevVal;
      if (transitionDelta > 0) {
        positiveDeltas.push({
          year: scenes[currentSceneIndex + 1].year,
          delta: transitionDelta,
        });
      }
    }

    const totalPositive = positiveDeltas.reduce((s, d) => s + d.delta, 0);
    return { country, currentValue, positiveDeltas, totalPositive };
  });

  // ── 5. Sort by current value for ranking ──
  const sorted = [...countryData].sort((a, b) => b.currentValue - a.currentValue);
  const maxValue = Math.max(...countryData.map((d) => d.currentValue), 1);

  // ── Render ──
  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background BGM (fades out at the end, loop removed to prevent glitches) */}
      {bgm && <Audio src={staticFile(bgm)} volume={currentVolume} />}

      {/* Background ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 15%, rgba(30, 42, 70, 0.3) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />



      {/* ═══ INTRO OVERLAY ═══ */}
      {currentSceneIndex === 0 && (
        <IntroOverlay frame={localFrame} fps={fps} />
      )}

      {/* ═══ CHART CONTENT (fades in after intro) ═══ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          opacity: chartOpacity,
        }}
      >
        {/* ═══ EVENT TEXT HEADER ═══ */}
        <div style={{ padding: "30px 40px 0 40px", zIndex: 10, height: 160 }}>
          {eventText && (
            <div
              style={{
                padding: "20px 30px",
                background: "rgba(16, 18, 32, 0.7)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                color: "#e2e8f0",
                fontSize: 26,
                fontWeight: 800,
                lineHeight: 1.5,
                height: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              {eventText}
            </div>
          )}
        </div>

        {/* ── CHART AREA ── */}
        <div
          style={{
            flex: 1,
            padding: "20px 30px 20px 30px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Semi-transparent chart backdrop */}
          <div
            style={{
              position: "absolute",
              inset: "30px 20px",
              background: "rgba(16, 18, 32, 0.5)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: 20,
            }}
          />

          {/* Event text moved to header */}

          {/* Max value vertical dashed line */}
          <div
            style={{
              position: "absolute",
              left: CHART_BAR_START_X - 10 + 20 + CHART_WIDTH,
              top: BAR_TOP_OFFSET + 30,
              bottom: 50,
              width: 0,
              borderRight: "2px dashed rgba(255,100,100,0.35)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />


          {/* ── BARS ── */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              zIndex: 5,
            }}
          >
            {countryData.map((item) => {
              const rank = sorted.findIndex(
                (d) => d.country === item.country
              );
              const barPixelWidth =
                (item.currentValue / maxValue) * CHART_WIDTH;
              const topPosition = rank * BAR_SPACING + BAR_TOP_OFFSET;

              const segments =
                item.totalPositive > 0
                  ? item.positiveDeltas.map((d) => ({
                      year: d.year,
                      pixelWidth:
                        (d.delta / item.totalPositive) * barPixelWidth,
                      color: yearColors[d.year] || "#ffffff",
                    }))
                  : [];

              return (
                <div
                  key={item.country}
                  style={{
                    position: "absolute",
                    top: topPosition,
                    left: 10,
                    width: "calc(100% - 20px)",
                    height: BAR_HEIGHT,
                    transition:
                      "top 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {/* Country name label */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      width: LABEL_WIDTH,
                      textAlign: "right",
                      fontWeight: 900,
                      fontSize: 26,
                      color: "#e2e8f0",
                      paddingRight: 20,
                      letterSpacing: "1px",
                    }}
                  >
                    {item.country}
                  </div>

                  {/* Stacked bar segments */}
                  <div
                    style={{
                      position: "absolute",
                      left: CHART_BAR_START_X - 10,
                      height: "100%",
                      display: "flex",
                      borderRadius: "0 8px 8px 0",
                      overflow: "hidden",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {segments.map((seg, si) => (
                      <div
                        key={`${item.country}-${seg.year}-${si}`}
                        style={{
                          width: Math.max(seg.pixelWidth, 0),
                          height: "100%",
                          backgroundColor: seg.color,
                          borderRight:
                            si < segments.length - 1
                              ? "1px solid rgba(0,0,0,0.4)"
                              : "none",
                          transition: "width 0.05s linear",
                        }}
                      />
                    ))}
                  </div>

                  {/* Value label */}
                  <span
                    style={{
                      position: "absolute",
                      left:
                        CHART_BAR_START_X -
                        10 +
                        Math.max(barPixelWidth, 6) +
                        20,
                      color: "#ffffff",
                      fontSize: 24,
                      fontWeight: 900,
                      fontFamily: "monospace",
                      whiteSpace: "nowrap",
                      transition: "left 0.05s linear",
                    }}
                  >
                    {Math.round(item.currentValue).toLocaleString()} 人
                  </span>
                </div>
              );
            })}
          </div>

          {/* Watermark year moved to root */}
        </div>

        {/* ═══ YEAR LEGEND (5 per row grid) ═══ */}
        <div style={{ padding: "0 36px 14px 36px", zIndex: 10 }}>
          <div
            style={{
              background: "rgba(16, 18, 32, 0.7)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: "18px 24px",
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "14px 12px",
              justifyItems: "center",
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
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      backgroundColor: color,
                      border: "1px solid rgba(255,255,255,0.15)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: "#cbd5e1",
                      fontSize: 22,
                      fontWeight: 800,
                    }}
                  >
                    {year}年
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* ═══ FOOTER & YEAR ═══ */}
        <div
          style={{
            padding: "0 40px 30px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ color: "#475569", fontSize: 16, fontWeight: 700 }}>
              データ出典: 日本政府観光局 (JNTO)
            </span>
            <span style={{ color: "#475569", fontSize: 16, fontWeight: 700 }}>
              VISUALIZED WITH REMOTION
            </span>
          </div>

          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.15)",
              lineHeight: 0.8,
              letterSpacing: "-2px",
            }}
          >
            {Math.floor(displayYear)}
          </div>
        </div>
      </div>

      {/* ═══ OUTRO OVERLAY ═══ */}
      {currentSceneIndex === scenes.length - 1 && localFrame >= sceneDuration - 90 && (
        <OutroOverlay frame={localFrame - (sceneDuration - 90)} fps={fps} />
      )}
    </div>
  );
};
