import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Audio,
  interpolate,
  spring,
} from "remotion";

export interface TaxWageScene {
  year: number;
  wage: number; // 額面年収
  incomeTax: number; // 所得税・住民税
  pension: number; // 厚生年金・年金保険料
  socialInsurance: number; // 健康・雇用保険料・子ども子育て支援金
  consumptionTax: number; // 消費税負担額（推計）
  takeHome: number; // 物価を考慮した実質手取り額
  burdenRate: number; // 国民負担率
  cpi: number; // 消費者物価指数 (2015年基準=100.0)
  events: string;
  isSummary?: boolean;
  durationInFrames: number;
}

export interface TaxWageProps {
  bgm: string;
  bgmVolume: number;
  title: string;
  subtitle: string;
  scenes: TaxWageScene[];
}

export const TaxWageComposition: React.FC<TaxWageProps> = ({
  bgm,
  bgmVolume,
  title,
  subtitle,
  scenes,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgmFile = staticFile(bgm);

  // 1. Scene timeline calculation
  let totalDuration = 0;
  const sceneTimeline = scenes.map((scene): TaxWageScene & { start: number; end: number } => {
    const start = totalDuration;
    const end = start + scene.durationInFrames;
    totalDuration = end;
    return {
      ...scene,
      start,
      end,
    };
  });

  // Calculate current scene
  let currentSceneIndex = 0;
  for (let i = 0; i < sceneTimeline.length; i++) {
    if (frame >= sceneTimeline[i].start && frame < sceneTimeline[i].end) {
      currentSceneIndex = i;
      break;
    }
    if (i === sceneTimeline.length - 1) {
      currentSceneIndex = i; // Fallback
    }
  }

  const currentScene = sceneTimeline[currentSceneIndex];
  const nextScene = sceneTimeline[Math.min(currentSceneIndex + 1, scenes.length - 1)];

  // Relative frame inside current scene
  const relativeFrame = frame - currentScene.start;
  const transitionFrames = 25; // Smooth transitions between years

  // Numerical interpolation between scenes for digital counter
  const progress = relativeFrame >= currentScene.durationInFrames - transitionFrames
    ? spring({
        frame: relativeFrame - (currentScene.durationInFrames - transitionFrames),
        fps,
        config: { damping: 15, stiffness: 80 },
      })
    : 0;

  // If the next scene is the summary ending card, lock values to the current scene's values to prevent zero-drop animations at the end of 2026.
  const nextYear = nextScene.isSummary ? currentScene.year : nextScene.year;
  const nextWage = nextScene.isSummary ? currentScene.wage : nextScene.wage;
  const nextIncomeTax = nextScene.isSummary ? currentScene.incomeTax : nextScene.incomeTax;
  const nextPension = nextScene.isSummary ? currentScene.pension : nextScene.pension;
  const nextSocialInsurance = nextScene.isSummary ? currentScene.socialInsurance : nextScene.socialInsurance;
  const nextConsumptionTax = nextScene.isSummary ? currentScene.consumptionTax : nextScene.consumptionTax;
  const nextTakeHome = nextScene.isSummary ? currentScene.takeHome : nextScene.takeHome;

  const currentYear = interpolate(progress, [0, 1], [currentScene.year, nextYear]);
  const currentWage = interpolate(progress, [0, 1], [currentScene.wage, nextWage]);
  const currentIncomeTax = interpolate(progress, [0, 1], [currentScene.incomeTax, nextIncomeTax]);
  const currentPension = interpolate(progress, [0, 1], [currentScene.pension, nextPension]);
  const currentSocialInsurance = interpolate(progress, [0, 1], [currentScene.socialInsurance, nextSocialInsurance]);
  const currentConsumptionTax = interpolate(progress, [0, 1], [currentScene.consumptionTax, nextConsumptionTax]);
  const currentTakeHome = interpolate(progress, [0, 1], [currentScene.takeHome, nextTakeHome]);

  // Format money helper
  const formatYen = (val: number) => {
    return `${(val / 10000).toFixed(0)}万円`;
  };

  // 2. SVG Graph Dimensions & Scale calculations (YouTube Shorts Optimized - Fits 800px card)
  const svgWidth = 736;
  const svgHeight = 520;
  
  const leftMargin = 90;
  const rightMargin = 95;
  const graphWidth = svgWidth - leftMargin - rightMargin;
  
  const getX = (idx: number) => {
    return leftMargin + (idx * (graphWidth / 11));
  };

  // Combined Single-Axis scale mapping to 0 - 5,000,000 Yen (Annual Wage boundary)
  const graphBaseY = 430;
  const graphMaxHeight = 350;
  
  const maxVal = 5000000; // 500万円 scale limit
  const getY = (val: number) => {
    return graphBaseY - (val / maxVal) * graphMaxHeight;
  };

  // Thumbnail mode (Frame 0)
  if (frame === 0) {
    return (
      <div
        style={{
          width: 1080,
          height: 1920,
          background: "#050608",
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
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, #17153a 0%, #030012 100%)", zIndex: 0 }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(0, 240, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, transparent 20%, rgba(0, 0, 0, 0.95) 100%)", zIndex: 2 }} />

        {/* Floating Brand Badges (Deleted as per request) */}

        <div
          style={{
            background: "linear-gradient(135deg, #ff005f 0%, #7000ff 100%)",
            border: "3px solid #00f0ff",
            padding: "12px 36px",
            borderRadius: "10px",
            color: "#ffffff",
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: 4,
            marginBottom: 24,
            zIndex: 10,
            boxShadow: "0 10px 25px rgba(255, 0, 95, 0.6)",
          }}
        >
          【衝撃の事実】
        </div>

        <h1
          style={{
            fontSize: 84,
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.3,
            margin: "0 0 30px 0",
            zIndex: 10,
            letterSpacing: "-2px",
            background: "linear-gradient(to bottom, #ffffff 10%, #38bdf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.95)) drop-shadow(0 4px 6px #000000) drop-shadow(0 0 20px rgba(0, 240, 255, 0.25))",
          }}
        >
          年収は44万円も<br />
          <span
            style={{
              background: "linear-gradient(to bottom, #ffe600 0%, #ff2a00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            増えたのに…！？
          </span>
        </h1>

        <div
          style={{
            fontSize: 34,
            color: "#e2e8f0",
            fontWeight: 800,
            zIndex: 10,
            letterSpacing: 1,
            background: "rgba(15, 23, 42, 0.65)",
            padding: "8px 24px",
            borderRadius: "6px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(4px)",
            textShadow: "0 3px 10px rgba(0,0,0,0.8)",
          }}
        >
          2015 - 2026年 手取り額の真実
        </div>

        <div
          style={{
            background: "#080810",
            border: "4px solid #ffe600",
            padding: "20px 36px",
            borderRadius: "16px",
            color: "#ffffff",
            fontSize: "34px",
            fontWeight: 900,
            zIndex: 10,
            boxShadow: "0 15px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 230, 0, 0.25)",
            whiteSpace: "nowrap",
            textAlign: "center",
            width: "640px",
            margin: "90px auto 0 auto",
            transform: "rotate(-1deg)",
            boxSizing: "border-box",
          }}
        >
          なんでこんなに生活が苦しいのか…
        </div>

        {/* Bottom hook card removed to focus solely on the question loop and protect Shorts bottom overlay */}

        <div
          style={{
            width: 300,
            height: 3,
            background: "linear-gradient(90deg, transparent, #facc15, #f97316, #facc15, transparent)",
            boxShadow: "0 0 15px rgba(250, 204, 21, 0.6)",
            marginTop: 50,
            borderRadius: 3,
            zIndex: 10,
          }}
        />
      </div>
    );
  }

  // Calculate points for line path (only draw visible years)
  const linePoints: { x: number; y: number }[] = [];
  for (let i = 0; i <= currentSceneIndex; i++) {
    const sc = scenes[i];
    const x = getX(i);
    let y = getY(sc.takeHome);
    if (i === currentSceneIndex && progress > 0 && currentSceneIndex < scenes.length - 1) {
      y = getY(currentTakeHome);
    }
    linePoints.push({ x, y });
  }

  // Create SVG path string
  let linePathD = "";
  if (linePoints.length > 0) {
    linePathD = `M ${linePoints[0].x} ${linePoints[0].y}`;
    for (let i = 1; i < linePoints.length; i++) {
      linePathD += ` L ${linePoints[i].x} ${linePoints[i].y}`;
    }
  }

  const totalDeductions = currentIncomeTax + currentPension + currentSocialInsurance + currentConsumptionTax;

  const isSummary = currentScene.isSummary || false;

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
          padding: "100px 40px 300px 40px", // Large bottom padding (300px) for Shorts safe-zone
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          justifyContent: "space-between",
        }}
      >
        <Audio src={bgmFile} volume={bgmVolume} loop />
        
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
        <div style={{ position: "absolute", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(239, 68, 68, 0.04) 0%, transparent 70%)", top: "20%", left: "10%", zIndex: 1, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)", bottom: "30%", right: "10%", zIndex: 1, pointerEvents: "none" }} />

        {/* Top Header Badge */}
        <div
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
            border: "2px solid #ffffff",
            padding: "14px 44px",
            borderRadius: "16px",
            color: "#ffffff",
            fontSize: "32px",
            fontWeight: 900,
            boxShadow: "0 10px 25px rgba(217, 119, 6, 0.4)",
            zIndex: 10,
            letterSpacing: "2px",
          }}
        >
          【事実のまとめ】
        </div>

        <h2
          style={{
            fontSize: "60px",
            fontWeight: 900,
            textAlign: "center",
            margin: "30px 0 20px 0",
            zIndex: 10,
            background: "linear-gradient(to right, #ffffff, #9ca3af)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          額面年収は増えたが…？
        </h2>

        {/* Fact Cards Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            width: "800px",
            zIndex: 10,
          }}
        >
          {/* Fact 1 */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "20px", padding: "20px 28px", display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ fontSize: "40px", color: "#38bdf8", fontWeight: 900, width: "30px", textAlign: "center" }}>1</div>
            <div>
              <div style={{ fontSize: "18px", color: "#9ca3af", fontWeight: 700, marginBottom: "2px" }}>額面の年収</div>
              <div style={{ fontSize: "28px", color: "#ffffff", fontWeight: 900 }}>11年で <span style={{ color: "#38bdf8" }}>＋44万円</span> の増加</div>
            </div>
          </div>

          {/* Fact 2 */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "20px", padding: "20px 28px", display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ fontSize: "40px", color: "#f87171", fontWeight: 900, width: "30px", textAlign: "center" }}>2</div>
            <div>
              <div style={{ fontSize: "18px", color: "#9ca3af", fontWeight: 700, marginBottom: "2px" }}>差し引かれるお金 (税金・保険料・消費税)</div>
              <div style={{ fontSize: "28px", color: "#ffffff", fontWeight: 900 }}>合計で <span style={{ color: "#f87171" }}>＋20万円</span> の激増</div>
            </div>
          </div>

          {/* Fact 3 */}
          <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "20px", padding: "20px 28px", display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ fontSize: "40px", color: "#fbbf24", fontWeight: 900, width: "30px", textAlign: "center" }}>3</div>
            <div>
              <div style={{ fontSize: "18px", color: "#9ca3af", fontWeight: 700, marginBottom: "2px" }}>消費者物価指数 (インフレ)</div>
              <div style={{ fontSize: "28px", color: "#ffffff", fontWeight: 900 }}>11年で <span style={{ color: "#fbbf24" }}>14.5%</span> の急激な上昇</div>
            </div>
          </div>

          {/* Big Conclusion Card */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(0, 255, 136, 0.15) 0%, rgba(0, 150, 80, 0.05) 100%)",
              border: "3px solid #00ff88",
              borderRadius: "24px",
              padding: "28px",
              marginTop: "10px",
              boxShadow: "0 10px 30px rgba(0, 255, 136, 0.25)",
            }}
          >
            <div style={{ fontSize: "22px", color: "#00ff88", fontWeight: 800, textAlign: "center", marginBottom: "8px", letterSpacing: "2px" }}>【 結論 】</div>
            <div style={{ fontSize: "36px", color: "#ffffff", fontWeight: 900, textAlign: "center", lineHeight: "1.45" }}>
              物価上昇を考慮した「購買力」は<br />
              10年間で <span style={{ color: "#00ff88", fontSize: "44px", textShadow: "0 0 15px rgba(0, 255, 136, 0.6)" }}>19万円も減少</span> している！
            </div>
          </div>
        </div>

        {/* CTA Comment Prompt */}
        <div
          style={{
            width: "800px",
            zIndex: 10,
            background: "linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, rgba(8, 9, 12, 0.95) 100%)",
            border: "3px dashed #ef4444",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 15px 30px rgba(0, 0, 0, 0.6)",
            boxSizing: "border-box",
            marginTop: "30px",
          }}
        >
          <p style={{ fontSize: "26px", fontWeight: 900, color: "#ffffff", margin: "0 0 12px 0", textAlign: "center", lineHeight: "1.4" }}>
            この厳しい現実についてどう思いますか？
          </p>
          <p
            style={{
              fontSize: "30px",
              fontWeight: 900,
              color: "#ef4444",
              textShadow: "0 0 10px rgba(239, 68, 68, 0.3)",
              margin: 0,
              textAlign: "center",
            }}
          >
            👇 ぜひコメント欄で教えてください！ 👇
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: "#08090c", // Darker premium background
        color: "#ffffff",
        fontFamily: "'Outfit', 'Inter', 'Noto Sans JP', sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between", // Maximize vertical spacing usage
        padding: "60px 40px 40px 40px", // Tight margins
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Audio src={bgmFile} volume={bgmVolume} loop />

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

      {/* Glow overlays */}
      <div style={{ position: "absolute", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)", top: "5%", left: "10%", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle, rgba(239, 68, 68, 0.04) 0%, transparent 70%)", bottom: "15%", right: "10%", zIndex: 1, pointerEvents: "none" }} />

      {/* 1. TOP SECTION: TAKE-HOME SIMULATOR METERS */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "32px",
          padding: "24px 32px",
          width: "800px", // Centered safe area
          margin: "0 auto",
          zIndex: 10,
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#00f0ff", boxShadow: "0 0 10px #00f0ff" }} />
            <span style={{ fontSize: "24px", fontWeight: 800, color: "#9ca3af", letterSpacing: "1px" }}>
              手取りシミュレーター (平均年収帯)
            </span>
          </div>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#00f0ff",
              textShadow: "0 0 20px rgba(0, 240, 255, 0.5)",
              fontFamily: "'Outfit', monospace",
            }}
          >
            {Math.round(currentYear)}年
          </span>
        </div>

        <div style={{ height: "1.5px", background: "rgba(255, 255, 255, 0.1)" }} />

        {/* Metrics Box */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ background: "rgba(0, 0, 0, 0.25)", borderRadius: "20px", padding: "16px 20px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
            <div style={{ fontSize: "22px", color: "#9ca3af", fontWeight: 700, marginBottom: "4px" }}>額面の年収</div>
            <div style={{ fontSize: "48px", fontWeight: 900, color: "#ffffff", fontFamily: "'Outfit', monospace" }}>
              {formatYen(currentWage)}
            </div>
          </div>
          <div style={{ background: "rgba(0, 0, 0, 0.25)", borderRadius: "20px", padding: "16px 20px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
            <div style={{ fontSize: "22px", color: "#9ca3af", fontWeight: 700, marginBottom: "4px" }}>税金・保険料の合計</div>
            <div style={{ fontSize: "48px", fontWeight: 900, color: "#ef4444", fontFamily: "'Outfit', monospace" }}>
              {formatYen(totalDeductions)}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(0, 255, 136, 0.12) 0%, rgba(0, 150, 80, 0.06) 100%)",
            border: "2.5px solid rgba(0, 255, 136, 0.35)",
            borderRadius: "20px",
            padding: "20px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#00ff88" }}>購買力 (物価考慮)</span>
          <span style={{ fontSize: "64px", fontWeight: 900, color: "#00ff88", textShadow: "0 0 20px rgba(0, 255, 136, 0.4)", fontFamily: "'Outfit', monospace" }}>
            {formatYen(currentTakeHome)}
          </span>
        </div>
      </div>

      {/* 2. CENTRAL SECTION: EXPLANATORY TEXT CONTAINER */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(20, 24, 33, 0.95) 0%, rgba(8, 9, 12, 0.95) 100%)",
          border: "2px solid #ef4444",
          borderRadius: "24px",
          padding: "24px 36px",
          height: "140px",
          width: "800px", // Fit YouTube Shorts safe area (center-aligned)
          margin: "0 auto",
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
            height: "50px",
            backgroundColor: "#ef4444",
            borderRadius: "4px",
            marginRight: "24px",
            boxShadow: "0 0 12px #ef4444",
          }}
        />
        <p
          style={{
            fontSize: "28px",
            lineHeight: "1.5",
            color: "#ffffff",
            fontWeight: 800,
            margin: 0,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {currentScene.events}
        </p>
      </div>

      {/* 3. BOTTOM SECTION: COMPOSITE GRAPH (Historical line + annual 4-stacked bars combined) */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.00) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "32px",
          padding: "24px 32px", // Optimal internal padding
          width: "800px", // Centered to match exact simulator & banner widths
          margin: "0 auto",
          zIndex: 10,
          height: "820px", // Reduced height to support Shorts bottom overlay safe-area (260px spacing below)
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#d1d5db", textAlign: "center" }}>
            負担額と購買力の推移
          </span>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "20px", height: "4px", background: "#00ff88", borderRadius: "2px" }} />
              <span style={{ fontSize: "16px", color: "#9ca3af", fontWeight: 700 }}>購買力</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", background: "#27272a", borderRadius: "2px" }} />
              <span style={{ fontSize: "16px", color: "#9ca3af", fontWeight: 700 }}>手取り</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", background: "#0ea5e9", borderRadius: "2px" }} />
              <span style={{ fontSize: "16px", color: "#9ca3af", fontWeight: 700 }}>保険</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", background: "#8b5cf6", borderRadius: "2px" }} />
              <span style={{ fontSize: "16px", color: "#9ca3af", fontWeight: 700 }}>年金</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "2px" }} />
              <span style={{ fontSize: "16px", color: "#9ca3af", fontWeight: 700 }}>税金</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", background: "#fbbf24", borderRadius: "2px" }} />
              <span style={{ fontSize: "16px", color: "#9ca3af", fontWeight: 700 }}>消費税</span>
            </div>
          </div>
        </div>

        {/* SVG Wrapper with tight aspect ratio padding */}
        <div style={{ width: "100%", height: "760px", position: "relative" }}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ overflow: "visible" }}
          >
            {/* Axis Header Labels (Left: 年収 / Right: 購買力) */}
            <text
              x={leftMargin}
              y={30}
              fill="#9ca3af"
              fontSize="20"
              fontWeight="800"
              textAnchor="middle"
              fontFamily="'Noto Sans JP', sans-serif"
            >
              (単位：万円)
            </text>

            {/* Grid Line rules for Single Y-Axis (0 to 500万円) */}
            {[0, 1000000, 2000000, 3000000, 4000000, 5000000].map((v) => {
              const y = getY(v);
              return (
                <g key={v}>
                  <line
                    x1={leftMargin}
                    y1={y}
                    x2={svgWidth - rightMargin}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1.5"
                  />
                  {/* Left scale number labels (White/Gray) */}
                  <text
                    x={leftMargin - 15}
                    y={y + 5}
                    fill="#9ca3af"
                    fontSize="20"
                    fontWeight="800"
                    textAnchor="end"
                  >
                    {v === 0 ? "0" : `${v / 10000}`}
                  </text>
                </g>
              );
            })}

            {/* Render Annual Stacked Bars (5-tier stack: takeHome -> socialInsurance -> pension -> incomeTax -> consumptionTax) */}
            {scenes.map((sc, idx) => {
              if (idx > currentSceneIndex) return null;

              const x = getX(idx);
              const barWidth = 20; // Thin bars for clean aspect ratio

              const deductions = sc.socialInsurance + sc.pension + sc.incomeTax + sc.consumptionTax;
              const nominalTakeHome = sc.wage - deductions;

              let scaleSpring = 1;
              if (idx === currentSceneIndex && relativeFrame < transitionFrames) {
                scaleSpring = spring({
                  frame: relativeFrame,
                  fps,
                  config: { damping: 12, stiffness: 120 },
                });
              }

              // Compute stacked segments (nominal base values multiplied by growth animation factor)
              const takeHomeVal = nominalTakeHome * scaleSpring;
              const insuranceVal = sc.socialInsurance * scaleSpring;
              const pensionVal = sc.pension * scaleSpring;
              const taxVal = sc.incomeTax * scaleSpring;
              const consumptionVal = sc.consumptionTax * scaleSpring;

              // Helper to convert value to height in pixels
              const getValHeight = (val: number) => (val / maxVal) * graphMaxHeight;

              const takeHomeH = getValHeight(takeHomeVal);
              const insuranceH = getValHeight(insuranceVal);
              const pensionH = getValHeight(pensionVal);
              const taxH = getValHeight(taxVal);
              const consumptionH = getValHeight(consumptionVal);

              return (
                <g key={sc.year}>
                  {/* Tier 1: Nominal Take Home (Dark zinc gray) */}
                  <rect
                    x={x - barWidth / 2}
                    y={graphBaseY - takeHomeH}
                    width={barWidth}
                    height={takeHomeH}
                    fill="url(#takeHomeGrad)"
                    rx={2}
                  />
                  {/* Tier 2: Social Insurance (Clear Blue) */}
                  <rect
                    x={x - barWidth / 2}
                    y={graphBaseY - takeHomeH - insuranceH}
                    width={barWidth}
                    height={insuranceH}
                    fill="url(#insuranceGrad)"
                    rx={2}
                  />
                  {/* Tier 3: Pension (Vibrant Violet) */}
                  <rect
                    x={x - barWidth / 2}
                    y={graphBaseY - takeHomeH - insuranceH - pensionH}
                    width={barWidth}
                    height={pensionH}
                    fill="url(#pensionGrad)"
                    rx={2}
                  />
                  {/* Tier 4: Direct Taxes (Bright Red) */}
                  <rect
                    x={x - barWidth / 2}
                    y={graphBaseY - takeHomeH - insuranceH - pensionH - taxH}
                    width={barWidth}
                    height={taxH}
                    fill="url(#taxGrad)"
                    rx={2}
                  />
                  {/* Tier 5: Consumption Tax (Vivid Gold Yellow) */}
                  <rect
                    x={x - barWidth / 2}
                    y={graphBaseY - takeHomeH - insuranceH - pensionH - taxH - consumptionH}
                    width={barWidth}
                    height={consumptionH}
                    fill="url(#consumptionGrad)"
                    rx={2}
                  />

                  {/* Year label (Truncated format like '15) */}
                  <text
                    x={x}
                    y={graphBaseY + 30}
                    fill={idx === currentSceneIndex ? "#00f0ff" : "#9ca3af"}
                    fontSize="20"
                    fontWeight={idx === currentSceneIndex ? "900" : "700"}
                    textAnchor="middle"
                  >
                    {`'${String(sc.year).slice(2)}`}
                  </text>
                  {/* Wage label (額面の年収を併記) */}
                  <text
                    x={x}
                    y={graphBaseY + 54}
                    fill="#9ca3af"
                    fontSize="14"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {`${(sc.wage / 10000).toFixed(0)}万`}
                  </text>
                </g>
              );
            })}

            {/* Render Take-Home line graph path */}
            {linePathD && (
              <path
                d={linePathD}
                fill="none"
                stroke="#00ff88"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glowFilter)"
              />
            )}

            {/* Glowing line points */}
            {linePoints.map((pt, idx) => {
              const isCurrent = idx === currentSceneIndex;
              return (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={isCurrent ? 10 : 7}
                  fill="#ffffff"
                  stroke="#00ff88"
                  strokeWidth="4.5"
                  style={{ filter: "drop-shadow(0 0 6px #00ff88)" }}
                />
              );
            })}

            {/* Defs block */}
            <defs>
              <linearGradient id="takeHomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#27272a" />
                <stop offset="100%" stopColor="#18181b" />
              </linearGradient>
              <linearGradient id="insuranceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="pensionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="consumptionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>
      </div>

      {/* 4. FOOTER: SOURCE CREDITS & NOTICE */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          zIndex: 10,
          marginBottom: "260px", // Pushed up to fully clear YouTube Shorts title/music overlay block (300px safe-zone)
        }}
      >
        <span
          style={{
            color: "#4b5563",
            fontSize: "16px",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: "1.4",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          ※「購買力」は、2015年を基準として<br />物価上昇（消費者物価指数）と消費税の影響を考慮した実質価値に正規化して算出しています。
        </span>
        <span
          style={{
            color: "#6b7280",
            fontSize: "20px",
            fontWeight: 800,
            letterSpacing: "0.5px",
          }}
        >
          出典: 財務省「国民負担率の推移」、国税庁「民間給与実態統計調査」、総務省「消費者物価指数」
        </span>
      </div>
    </div>
  );
};
