import {
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Img,
} from "remotion";
import React from "react";

// Types
export interface CompanyScene {
  year: number;
  events: string;
  stats: Record<string, number>;
  countries: Record<string, string>;
  durationInFrames?: number;
}

export interface CompanyVideoProps {
  bgm?: string;
  bgmVolume?: number;
  scenes: CompanyScene[];
  meta: {
    flags: Record<string, string>;
    logos: Record<string, string>;
  };
  width?: number;
  height?: number;
  totalDurationFrames?: number;
  title?: string;
  subtitle?: string;
}

// ── Sector Color Palette ──
const sectorColors: Record<string, string> = {
  tech: "#818cf8",        // Indigo/Purple (IT/AI)
  energy: "#34d399",      // Mint/Green (Energy/Oil)
  finance: "#fbbf24",     // Amber/Gold (Finance)
  retail: "#f97316",      // Orange (Retail/e-commerce)
  auto: "#ef4444",        // Red (Tesla / EV)
  industrials: "#60a5fa", // Blue (GE / General Industrials)
  telecom: "#06b6d4",     // Cyan (Telecom)
  healthcare: "#ec4899",  // Pink (Healthcare)
};

// ── Sector Translation Labels ──
const sectorLabels: Record<string, string> = {
  tech: "IT / AI",
  energy: "エネルギー",
  finance: "金融 / 投資",
  retail: "小売 / EC",
  auto: "自動車 / EV",
  industrials: "製造 / 重工業",
  telecom: "電気通信",
  healthcare: "医療 / 薬品",
};

// Helper function to dynamically map company names to sectors (very robust)
const getCompanySector = (company: string): string => {
  const norm = company.toLowerCase();
  if (norm.includes("microsoft") || norm.includes("apple") || norm.includes("nvidia") || 
      norm.includes("google") || norm.includes("alphabet") || norm.includes("meta") || 
      norm.includes("facebook") || norm.includes("cisco") || norm.includes("broadcom") || 
      norm.includes("intel") || norm.includes("tencent") || norm.includes("tsmc") || 
      norm.includes("samsung") || norm.includes("ibm") || norm.includes("lucent")) {
    return "tech";
  }
  if (norm.includes("exxon") || norm.includes("aramco") || norm.includes("petrochina") || 
      norm.includes("bp") || norm.includes("shell") || norm.includes("petrobras") || 
      norm.includes("gazprom") || norm.includes("sinopec")) {
    return "energy";
  }
  if (norm.includes("berkshire") || norm.includes("jpmorgan") || norm.includes("icbc") || 
      norm.includes("citigroup") || norm.includes("wells fargo") || norm.includes("bank of america") || 
      norm.includes("american international group") || norm.includes("aig") || norm.includes("construction bank") || 
      norm.includes("ccb")) {
    return "finance";
  }
  if (norm.includes("amazon") || norm.includes("walmart") || norm.includes("wal-mart") || 
      norm.includes("alibaba")) {
    return "retail";
  }
  if (norm.includes("tesla") || norm.includes("toyota")) {
    return "auto";
  }
  if (norm.includes("electric") || norm.includes("general electric") || norm.includes("ge") || 
      norm.includes("bhp") || norm.includes("billiton")) {
    return "industrials";
  }
  if (norm.includes("docomo") || norm.includes("nokia") || norm.includes("vodafone") || 
      norm.includes("telegraph") || norm.includes("telekom") || norm.includes("at&t")) {
    return "telecom";
  }
  if (norm.includes("pfizer") || norm.includes("lilly") || norm.includes("johnson") || 
      norm.includes("jnj") || norm.includes("novartis") || norm.includes("roche") || 
      norm.includes("merck") || norm.includes("abbott") || norm.includes("nestle") || 
      norm.includes("nestlé") || norm.includes("procter")) {
    return "healthcare";
  }
  return "tech"; // default fallback
};

// ── Layout constants for 9:16 (1080×1920) ──
const CHART_BAR_START_X = 220; // Slightly shifted to accommodate longer company names
const CHART_WIDTH = 520;       // Condensed horizontally to prevent clashes with Shorts buttons
const BAR_HEIGHT = 44;
const BAR_SPACING = 82;
const BAR_TOP_OFFSET = 40;
const LABEL_WIDTH = 180;
const INTRO_FRAMES = 75; // 2.5 seconds intro animation

// ── Intro Title Animation Component ──
const IntroOverlay: React.FC<{ frame: number; fps: number; title: string; subtitle: string }> = ({ frame, fps, title, subtitle }) => {
  // Overall opacity envelope: fade in → hold → fade out
  const envelope = interpolate(
    frame,
    [0, 12, 55, 75],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Horizontal accent line: expands from center
  const lineWidth = interpolate(frame, [5, 30], [0, 550], {
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
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(129,140,248,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Top accent line */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(129,140,248,0.8), #fbbf24, rgba(129,140,248,0.8), transparent)",
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
          textAlign: "center",
          textShadow:
            "0 0 40px rgba(129,140,248,0.5), 0 0 80px rgba(129,140,248,0.2)",
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
          lineHeight: 1.4,
        }}
      >
        {title.split("\n").map((line, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </div>

      {/* Year range subtitle */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: "#fbbf24",
          marginTop: 20,
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "2px",
        }}
      >
        {subtitle}
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(129,140,248,0.8), #fbbf24, rgba(129,140,248,0.8), transparent)",
          marginTop: 40,
          borderRadius: 2,
        }}
      />
    </div>
  );
};

// ── Outro CTA Animation Component ──
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
            background: "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.4,
            filter: "drop-shadow(0 0 40px rgba(108, 92, 231, 0.4))",
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

// ── Main Company Ranking Composition Component ──
export const CompanyComponent: React.FC<CompanyVideoProps> = ({
  scenes,
  bgm,
  bgmVolume = 0.20,
  meta,
  title = "世界の大企業\n時価総額ランキング推移",
  subtitle = "2000 - 2026",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: totalDuration } = useVideoConfig();

  // ── 3. Gather all unique companies across ALL scenes in the dataset ──
  const allCompanies = React.useMemo(() => {
    const set = new Set<string>();
    scenes.forEach((scene) => {
      if (scene.stats) {
        Object.keys(scene.stats).forEach((k) => set.add(k));
      }
    });
    return Array.from(set);
  }, [scenes]);

  // Frame 0 shows the custom flashy thumbnail (for mobile YouTube Shorts thumbnail selection)
  if (frame === 0) {
    return (
      <div
        style={{
          width: 1080,
          height: 1920,
          background: "#0a0a0f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Flashy generated background image */}
        <Img
          src={staticFile("data/company-ranking/companies_thumbnail_bg.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        {/* Dark overlay to ensure text contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(10,10,15,0.4) 0%, rgba(10,10,15,0.75) 100%)",
            zIndex: 1,
          }}
        />

        {/* Thumbnail Badge */}
        <div
          style={{
            background: "linear-gradient(135deg, #818cf8, #34d399)",
            padding: "14px 40px",
            borderRadius: 50,
            color: "#ffffff",
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 2,
            marginBottom: 50,
            boxShadow: "0 10px 30px rgba(129, 140, 248, 0.6)",
            textTransform: "uppercase",
            zIndex: 10,
          }}
        >
          {title.includes("Part 1") ? "GLOBAL COMPANIES | PART 1" : title.includes("Part 2") ? "GLOBAL COMPANIES | PART 2" : "GLOBAL COMPANIES"}
        </div>

        {/* Thumbnail Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "95%",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 145,
              fontWeight: 950,
              color: "#fbbf24",
              textShadow: "0 10px 40px rgba(251, 191, 36, 0.8), 0 0 100px rgba(251, 191, 36, 0.5)",
              transform: "rotate(-3deg)",
              marginBottom: 20,
              letterSpacing: 4,
            }}
          >
            激変！
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.3,
              textShadow: "0 10px 40px rgba(0, 0, 0, 0.95)",
              letterSpacing: 2,
            }}
          >
            世界企業ランキング
            <br />
            <span
              style={{
                background: "linear-gradient(to right, #818cf8, #a7f3d0, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: 84,
                fontWeight: 950,
                filter: "drop-shadow(0 4px 15px rgba(129, 140, 248, 0.5))",
              }}
            >
              {title.includes("Part 1") || title.includes("前半") ? "Part 1: 前半の軌跡" : "Part 2: 後半の軌跡"}
            </span>
          </div>
        </div>

        {/* Subtitle / CTA */}
        <div
          style={{
            marginTop: 90,
            fontSize: 40,
            color: "#ffffff",
            fontWeight: 800,
            letterSpacing: 4,
            borderBottom: "4px solid #818cf8",
            paddingBottom: 12,
            zIndex: 10,
            textShadow: "0 4px 15px rgba(0, 0, 0, 0.8)",
          }}
        >
          時価総額 {subtitle}
        </div>
      </div>
    );
  }

  // Shift video logic by 1 frame to accommodate the thumbnail frame at the start
  const adjustedFrame = frame - 1;

  // ── 1. Determine current scene index and local frame ──
  let cumulativeFrames = 0;
  let currentSceneIndex = scenes.length - 1;

  for (let i = 0; i < scenes.length; i++) {
    const dur = scenes[i].durationInFrames || 180;
    if (adjustedFrame < cumulativeFrames + dur) {
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
  const localFrame = adjustedFrame - cumulativeFrames;

  // ── 2. Intro handling ──
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

  // Fade out BGM in the last 90 frames (3 seconds) to prevent harsh cutting
  const outroStartFrame = (totalDuration - 1) - 90;
  const currentVolume = interpolate(
    adjustedFrame,
    [outroStartFrame, (totalDuration - 1) - 15],
    [bgmVolume, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );



  // ── 4. Compute current interpolated values ──
  const companyData = allCompanies.map((company) => {
    const fromVal = currentScene.stats[company] || 0;
    const toVal = nextScene.stats[company] || 0;
    const currentValue = interpolate(progress, [0, 1], [fromVal, toVal], {
      extrapolateRight: "clamp",
    });

    const sector = getCompanySector(company);
    const color = sectorColors[sector] || "#ffffff";
    const country =
      currentScene.countries?.[company] ||
      nextScene.countries?.[company] ||
      "United States";

    return { company, currentValue, color, country };
  });

  // ── 5. Sort by current value for ranking ──
  const sorted = [...companyData].sort((a, b) => b.currentValue - a.currentValue);
  const maxValue = Math.max(...companyData.map((d) => d.currentValue), 1);

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
      {/* Background BGM */}
      {bgm && <Audio src={staticFile(bgm)} volume={currentVolume} />}

      {/* Background ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 15%, rgba(49, 46, 129, 0.25) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* ═══ INTRO OVERLAY ═══ */}
      {currentSceneIndex === 0 && (
        <IntroOverlay frame={localFrame} fps={fps} title={title} subtitle={subtitle} />
      )}

      {/* ═══ CHART CONTENT (fades in after intro) ═══ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: chartOpacity,
          width: "100%",
        }}
      >
        {/* Top Spacer for Shorts UI Safe Zone */}
        <div style={{ height: 260 }} />

        {/* ═══ EVENT TEXT HEADER ═══ */}
        <div style={{ padding: "0 40px", zIndex: 10, height: 140, width: "100%", boxSizing: "border-box" }}>
          {eventText && (
            <div
              style={{
                padding: "20px 30px",
                background: "rgba(16, 18, 32, 0.75)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                color: "#e2e8f0",
                fontSize: 25,
                fontWeight: 800,
                lineHeight: 1.5,
                height: "100%",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
              }}
            >
              {eventText}
            </div>
          )}
        </div>

        {/* Gap between header and chart */}
        <div style={{ height: 30 }} />

        {/* ── CHART AREA (condensed vertically to fit safely in the center) ── */}
        <div
          style={{
            height: 850,
            width: "100%",
            padding: "0 40px",
            boxSizing: "border-box",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Semi-transparent chart backdrop */}
          <div
            style={{
              position: "absolute",
              inset: "0 40px",
              background: "rgba(16, 18, 32, 0.55)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: 20,
            }}
          />

          {/* Watermark year in the background of the chart (faint & safe) */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              right: 80,
              fontSize: 170,
              fontWeight: 900,
              fontFamily: "monospace",
              color: "rgba(255, 255, 255, 0.05)",
              lineHeight: 0.8,
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            {Math.floor(displayYear)}
          </div>

          {/* Max value vertical dashed line */}
          <div
            style={{
              position: "absolute",
              left: CHART_BAR_START_X + CHART_WIDTH,
              top: BAR_TOP_OFFSET,
              height: BAR_SPACING * 9 + BAR_HEIGHT,
              width: 0,
              borderRight: "2px dashed rgba(129,140,248,0.25)",
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
            {companyData
              .filter((item) => item.currentValue > 0) // Hide companies that are not yet active
              .map((item) => {
                const rank = sorted.findIndex(
                  (d) => d.company === item.company
                );
                // Limit maximum display count to top 10 for better spacing
                if (rank >= 10) return null;

                const barPixelWidth =
                  (item.currentValue / maxValue) * CHART_WIDTH;
                const topPosition = rank * BAR_SPACING + BAR_TOP_OFFSET;

                return (
                  <div
                    key={item.company}
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
                    {/* Company name label */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        width: LABEL_WIDTH,
                        textAlign: "right",
                        fontWeight: 900,
                        fontSize: 24,
                        color: "#e2e8f0",
                        paddingRight: 20,
                        letterSpacing: "1px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.company}
                    </div>

                    {/* Solid bar with glowing border matching the sector color */}
                    <div
                      style={{
                        position: "absolute",
                        left: CHART_BAR_START_X - 10,
                        width: Math.max(barPixelWidth, 6),
                        height: "100%",
                        backgroundColor: item.color,
                        borderRadius: "0 8px 8px 0",
                        boxShadow: `0 0 15px ${item.color}33, 0 2px 8px rgba(0,0,0,0.4)`,
                        transition: "width 0.05s linear",
                      }}
                    />

                    {/* Bar tip assets: Company Logo & Country Flag */}
                    <div
                      style={{
                        position: "absolute",
                        left: CHART_BAR_START_X - 10 + Math.max(barPixelWidth, 6) + 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        height: "100%",
                        transition: "left 0.05s linear",
                        zIndex: 10,
                      }}
                    >
                      {/* Company Logo */}
                      <Img
                        src={staticFile(meta?.logos?.[item.company] || "data/company-ranking/logos/logo_fallback.png")}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          backgroundColor: "#ffffff",
                          border: "2px solid rgba(255,255,255,0.8)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                          objectFit: "contain",
                        }}
                      />
                      {/* Country Flag */}
                      <Img
                        src={staticFile(meta?.flags?.[item.country] || "data/company-ranking/flags/flag_united_states.png")}
                        style={{
                          width: 32,
                          height: 22,
                          borderRadius: 4,
                          border: "1px solid rgba(255,255,255,0.6)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                          objectFit: "cover",
                        }}
                      />
                      {/* Value label ($B Billion USD) */}
                      <span
                        style={{
                          color: "#ffffff",
                          fontSize: 24,
                          fontWeight: 900,
                          fontFamily: "monospace",
                          whiteSpace: "nowrap",
                          marginLeft: 6,
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                        }}
                      >
                        ${Math.round(item.currentValue).toLocaleString()} B
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Gap between chart and legend */}
        <div style={{ height: 30 }} />

        {/* ═══ SECTOR LEGEND (8 sectors grid) ═══ */}
        <div style={{ padding: "0 40px", zIndex: 10, width: "100%", boxSizing: "border-box" }}>
          <div
            style={{
              background: "rgba(16, 18, 32, 0.75)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: "18px 24px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "14px 12px",
              justifyItems: "center",
            }}
          >
            {Object.entries(sectorColors).map(([sector, color]) => (
              <div
                key={sector}
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
                  {sectorLabels[sector]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gap between legend and footer */}
        <div style={{ height: 20 }} />

        {/* ═══ FOOTER ═══ */}
        <div
          style={{
            padding: "0 40px",
            width: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            zIndex: 10,
          }}
        >
          <span style={{ color: "#475569", fontSize: 16, fontWeight: 700 }}>
            データ出典: https://en.wikipedia.org
          </span>
          <span style={{ color: "#475569", fontSize: 16, fontWeight: 700 }}>
            VISUALIZED WITH REMOTION
          </span>
        </div>
      </div>

      {/* ═══ OUTRO OVERLAY ═══ */}
      {currentSceneIndex === scenes.length - 1 && localFrame >= sceneDuration - 90 && (
        <OutroOverlay frame={localFrame - (sceneDuration - 90)} fps={fps} />
      )}
    </div>
  );
};
