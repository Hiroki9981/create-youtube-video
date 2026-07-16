import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, Audio, staticFile, interpolate, spring, Img, useVideoConfig } from "remotion";
import langData from "../../public/data/lang-ranking/lang-history-data.json";

// Types
export interface SceneConfig {
  year: number;
  events: string;
  durationInFrames: number;
}

export interface LangVoronoiCompositionProps {
  title?: string;
  subtitle?: string;
  scenes?: SceneConfig[];
}

const hexToRgb = (hex: string) => {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
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
            fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
          }}
        >
          ご視聴ありがとうございました！
        </h2>

        <div
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.4,
            filter: "drop-shadow(0 0 40px rgba(16, 185, 129, 0.4))",
            fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
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
            fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
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

const getLogoFilename = (langName: string): string => {
  const mapping: Record<string, string> = {
    "Python": "python.svg",
    "Java": "java.svg",
    "C": "c.svg",
    "C++": "cpp.svg",
    "C#": "csharp.svg",
    "JavaScript": "javascript.svg",
    "PHP": "php.svg",
    "Go": "go.svg",
    "Rust": "rust.svg",
    "Objective-C": "objectivec.svg"
  };
  return mapping[langName] || "python.svg";
};

export const LangVoronoiComposition: React.FC<LangVoronoiCompositionProps> = ({
  title = "プログラミング言語の覇権争い",
  subtitle = "主要言語の人気シェア推移 (2001 - 2026)",
  scenes = [],
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { fps } = useVideoConfig();

  // Configuration for anchors in 70x70 grid
  const ANCHORS: Record<string, { x: number; y: number }> = {
    C: { x: 12, y: 15 },
    "C++": { x: 12, y: 35 },
    Rust: { x: 12, y: 55 },
    Java: { x: 30, y: 15 },
    "C#": { x: 30, y: 35 },
    PHP: { x: 30, y: 55 },
    Go: { x: 48, y: 15 },
    Python: { x: 58, y: 35 },
    JavaScript: { x: 48, y: 55 },
    "Objective-C": { x: 42, y: 35 }
  };

  const GRID_SIZE = 70; // Resolution of canvas calculation grid
  const MAP_SIZE = 640; // Pixel size of display area

  // 1. Calculate current scene and progress
  let accumulatedFrames = 0;
  let sceneIndex = 0;
  let sceneFrame = 0;

  for (let i = 0; i < scenes.length; i++) {
    if (frame < accumulatedFrames + scenes[i].durationInFrames) {
      sceneIndex = i;
      sceneFrame = frame - accumulatedFrames;
      break;
    }
    accumulatedFrames += scenes[i].durationInFrames;
  }

  // Boundary check
  if (sceneIndex >= scenes.length) {
    sceneIndex = scenes.length - 1;
    sceneFrame = scenes[sceneIndex].durationInFrames - 1;
  }

  const currentScene = scenes[sceneIndex];
  const nextScene = scenes[sceneIndex + 1] || currentScene;
  const progress = sceneFrame / currentScene.durationInFrames;

  // Interpolate language shares for current frame
  const currentYearStats =
    langData.history.find((h: any) => h.year === currentScene.year)?.stats || {};
  const nextYearStats =
    langData.history.find((h: any) => h.year === nextScene.year)?.stats || {};

  const interpolatedStats: Record<string, number> = {};
  const companyList = Object.keys(langData.languages).map((name) => {
    const startVal = (currentYearStats as Record<string, number>)[name] || 0;
    const endVal = (nextYearStats as Record<string, number>)[name] || startVal;
    const val = startVal + (endVal - startVal) * progress;
    interpolatedStats[name] = val;

    // Weight formula: perceptual scaling (power of 0.7) to avoid Java/Python swallowing others
    const weight = Math.pow(val, 0.7) * 0.055;

    return {
      name,
      ipCount: val, // Represents % share
      weight,
      color: (langData.languages as any)[name].color,
      displayName: (langData.languages as any)[name].displayName,
      x: ANCHORS[name].x,
      y: ANCHORS[name].y,
    };
  });

  // Calculate grid and centroids
  const grid = new Int32Array(GRID_SIZE * GRID_SIZE);
  const sumsX = new Float32Array(companyList.length);
  const sumsY = new Float32Array(companyList.length);
  const counts = new Int32Array(companyList.length);

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      let minDistSq = Infinity;
      let closestId = 0;

      for (let i = 0; i < companyList.length; i++) {
        const c = companyList[i];
        if (c.ipCount <= 0.01) continue; // Inactive languages don't show up

        const dx = x - c.x;
        const dy = y - c.y;
        const distSq = dx * dx + dy * dy - c.weight; // Multiplicatively weighted Voronoi

        if (distSq < minDistSq) {
          minDistSq = distSq;
          closestId = i;
        }
      }

      const gridIdx = y * GRID_SIZE + x;
      grid[gridIdx] = closestId;
      sumsX[closestId] += x;
      sumsY[closestId] += y;
      counts[closestId] += 1;
    }
  }

  // Centroids mapping
  const centroids = companyList.map((node, i) => {
    const count = counts[i];
    if (count > 4) {
      return {
        x: (sumsX[i] / count) * (MAP_SIZE / GRID_SIZE),
        y: (sumsY[i] / count) * (MAP_SIZE / GRID_SIZE),
        active: true,
      };
    }
    return {
      x: node.x * (MAP_SIZE / GRID_SIZE),
      y: node.y * (MAP_SIZE / GRID_SIZE),
      active: false,
    };
  });

  // Draw grid to Canvas using useLayoutEffect for Remotion render timing
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(GRID_SIZE, GRID_SIZE);
    const data = imgData.data;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const idx = y * GRID_SIZE + x;
        const cellId = grid[idx];
        const node = companyList[cellId];

        // Edge detection
        let isEdge = false;
        if (x + 1 < GRID_SIZE && grid[idx + 1] !== cellId) isEdge = true;
        if (y + 1 < GRID_SIZE && grid[idx + GRID_SIZE] !== cellId) isEdge = true;

        const pixelIdx = idx * 4;
        if (isEdge) {
          // Glow borders
          data[pixelIdx] = 255;
          data[pixelIdx + 1] = 255;
          data[pixelIdx + 2] = 255;
          data[pixelIdx + 3] = 255;
        } else {
          // Fill cell colors
          const rgb = hexToRgb(node.color);
          data[pixelIdx] = rgb.r;
          data[pixelIdx + 1] = rgb.g;
          data[pixelIdx + 2] = rgb.b;
          data[pixelIdx + 3] = 160; // Slightly transparent
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [frame]);

  // Ranking data for bottom chart
  const sortedCompanies = [...companyList].sort((a, b) => b.ipCount - a.ipCount);
  const maxIpInChart = Math.max(...companyList.map((c) => c.ipCount));

  // Audio track registration
  const bgmFile = staticFile("data/audio/8-bit_Aggressive1.mp3");

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
        {/* Audio Element rendered on frame 0 to register track */}
        <Audio src={bgmFile} volume={0.15} loop />

        {/* Flashy generated background image */}
        <Img
          src={staticFile("data/ip-voronoi/thumbnail_bg.png")}
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
            background: "linear-gradient(135deg, #10b981, #ff9900)",
            padding: "14px 40px",
            borderRadius: 50,
            color: "#ffffff",
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 2,
            marginBottom: 50,
            boxShadow: "0 10px 30px rgba(16, 185, 129, 0.6)",
            textTransform: "uppercase",
            zIndex: 10,
          }}
        >
          TIOBE INDEX HISTORICAL
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.25,
            margin: "0 0 30px 0",
            zIndex: 10,
            textShadow: "0 10px 40px rgba(0,0,0,0.8)",
            whiteSpace: "pre-wrap",
          }}
        >
          プログラミング言語<br />覇権の歴史
        </h1>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: "#cbd5e1",
            fontWeight: 700,
            zIndex: 10,
            textShadow: "0 5px 15px rgba(0,0,0,0.6)",
          }}
        >
          人気シェア推移 (2001 - 2026)
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            width: 200,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #10b981, #ff9900, #10b981, transparent)",
            marginTop: 40,
            borderRadius: 2,
            zIndex: 10,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: "#0d0e12",
        color: "#ffffff",
        fontFamily: "'Outfit', 'Inter', 'Noto Sans JP', sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px 60px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background neon grids */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Cyberpunk background glows */}
      <div
        style={{
          position: "absolute",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)",
          top: "10%",
          left: "-10%",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255, 153, 0, 0.08) 0%, transparent 70%)",
          bottom: "10%",
          right: "-10%",
          zIndex: 0,
        }}
      />

      {/* Audio Element */}
      <Audio src={bgmFile} volume={0.15} loop />

      {/* HEADER SECTION */}
      <div style={{ zIndex: 10, textAlign: "center", position: "relative" }}>
        {/* Glowing top badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 24px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "40px",
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "4px",
            color: "#10b981",
            textTransform: "uppercase",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              marginRight: "16px",
              boxShadow: "0 0 10px #10b981",
            }}
          />
          LANG BATTLEFIELD
        </div>

        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            margin: "0 0 16px 0",
            letterSpacing: "-1px",
            background: "linear-gradient(135deg, #ffffff 40%, #a5b4fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "28px",
            color: "#9ca3af",
            margin: 0,
            fontWeight: 400,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* CENTER VORONOI BATTLEFIELD */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          height: MAP_SIZE + 40,
          zIndex: 5,
        }}
      >
        {/* High-tech rotating radar elements */}
        <div
          className="radar-frame"
          style={{
            position: "absolute",
            width: MAP_SIZE + 40,
            height: MAP_SIZE + 40,
            borderRadius: "50%",
            border: "2px solid rgba(255, 255, 255, 0.05)",
            boxShadow:
              "inset 0 0 60px rgba(255, 255, 255, 0.02), 0 0 80px rgba(0, 0, 0, 0.6)",
            pointerEvents: "none",
          }}
        />

        {/* The Voronoi Canvas wrapper with metaball goo filter */}
        <div
          style={{
            width: MAP_SIZE,
            height: MAP_SIZE,
            borderRadius: "50%",
            overflow: "hidden",
            position: "relative",
            filter: "url(#metaball)",
            border: "4px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 50px rgba(0, 0, 0, 0.8)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={GRID_SIZE}
            height={GRID_SIZE}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </div>

        {/* Centroid-following FLOATING LABELS */}
        {companyList.map((company, i) => {
          const centroid = centroids[i];
          if (!centroid || !centroid.active) return null;

          const logoPath = staticFile(
            `data/lang-ranking/logos/${getLogoFilename(company.name)}`
          );

          return (
            <div
              key={company.name}
              style={{
                position: "absolute",
                left: centroid.x + 20, // Offset map border padding
                top: centroid.y + 20,
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
                zIndex: 20,
                transition: "all 0.03s linear",
              }}
            >
              {/* Floating Shield Container */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(10, 11, 15, 0.85)",
                  backdropFilter: "blur(6px)",
                  border: `2px solid ${company.color}`,
                  borderRadius: "28px",
                  padding: "6px 14px 6px 6px",
                  boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 15px ${company.color}40`,
                }}
              >
                {/* Company Logo wrapper */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                    marginRight: "10px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  }}
                >
                  <img
                    src={logoPath}
                    style={{
                      width: "70%",
                      height: "70%",
                      objectFit: "contain",
                    }}
                    alt=""
                  />
                </div>

                {/* Info Text */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#ffffff",
                      }}
                    >
                      {company.displayName}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#9ca3af",
                      fontWeight: 600,
                    }}
                  >
                    {company.ipCount.toFixed(1)}% Share
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Glowing Current Year Display (Positioned bottom-right of the circle graph, text-only to avoid overlaps) */}
        <div
          style={{
            position: "absolute",
            right: "40px",
            bottom: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: "16px", color: "#9ca3af", letterSpacing: "4px", fontWeight: 800 }}>YEAR</span>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 900,
              fontFamily: "'Outfit', 'Courier New', monospace",
              color: "#34d399",
              textShadow: "0 0 20px rgba(52, 211, 153, 0.6), 0 2px 10px rgba(0,0,0,0.9)",
              lineHeight: 1,
              letterSpacing: "2px",
            }}
          >
            {currentScene.year}
          </span>
        </div>
      </div>

      {/* EVENT DESCRIPTION SUBTITLE */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "24px",
          padding: "24px 32px",
          minHeight: "100px",
          display: "flex",
          alignItems: "center",
          zIndex: 10,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Left red dot bar */}
        <div
          style={{
            width: "6px",
            height: "40px",
            backgroundColor: "#ef4444",
            borderRadius: "3px",
            marginRight: "20px",
            boxShadow: "0 0 10px #ef4444",
          }}
        />

        <p
          style={{
            fontSize: "24px",
            lineHeight: "1.4",
            color: "#e5e7eb",
            fontWeight: 500,
            margin: 0,
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {currentScene.events}
        </p>
      </div>

      {/* BOTTOM SECTION: LEADERBOARD CHART */}
      <div
        style={{
          background: "rgba(255,255,255,0.01)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: "32px",
          padding: "30px 40px",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#9ca3af",
              margin: 0,
              letterSpacing: "2px",
            }}
          >
            TOP 8 LANGUAGES
          </h3>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#10b981" }}>TIOBE INDEX SHARE</span>
        </div>

        {/* The Bar Chart list */}
        <div style={{ position: "relative", height: "320px" }}>
          {companyList.map((company) => {
            const sortedIndex = sortedCompanies.findIndex(
              (c) => c.name === company.name
            );
            if (sortedIndex >= 8) return null; // Show top 8 languages only

            const rowHeight = 40;
            const barWidthMax = 580; // pixels
            const barWidth = (company.ipCount / maxIpInChart) * barWidthMax;

            const logoPath = staticFile(
              `data/lang-ranking/logos/${getLogoFilename(company.name)}`
            );

            return (
              <div
                key={company.name}
                style={{
                  position: "absolute",
                  left: 0,
                  top: sortedIndex * rowHeight,
                  width: "100%",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  transition: "top 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              >
                {/* Rank Badge */}
                <div
                  style={{
                    width: "30px",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: sortedIndex < 3 ? "#10b981" : "#6b7280",
                    textAlign: "center",
                  }}
                >
                  {sortedIndex + 1}
                </div>

                {/* Name */}
                <div
                  style={{
                    width: "160px",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#ffffff",
                    marginLeft: "12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {company.displayName}
                </div>

                {/* Progress Bar Container */}
                <div style={{ flex: 1, position: "relative", height: "18px", marginLeft: "10px" }}>
                  {/* The actual colored bar */}
                  <div
                    style={{
                      width: barWidth,
                      height: "100%",
                      backgroundColor: company.color,
                      borderRadius: "6px",
                      boxShadow: `0 0 10px ${company.color}40`,
                      transition: "width 0.1s ease-out",
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                    }}
                  >
                    {/* Small inner logo */}
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        marginRight: "2px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      <img src={logoPath} style={{ width: "90%", height: "90%" }} alt="" />
                    </div>
                  </div>
                </div>

                {/* Count text */}
                <div
                  style={{
                    width: "90px",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#ffffff",
                    textAlign: "right",
                    fontFamily: "monospace",
                  }}
                >
                  {company.ipCount.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>

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
            marginTop: "20px",
          }}
        >
          <span style={{ color: "#475569", fontSize: 16, fontWeight: 700, fontFamily: "'Inter', 'Noto Sans JP', sans-serif" }}>
            データ出典: TIOBE Index
          </span>
          <span style={{ color: "#475569", fontSize: 16, fontWeight: 700, fontFamily: "'Inter', 'Noto Sans JP', sans-serif" }}>
            VISUALIZED WITH REMOTION
          </span>
        </div>
      </div>

      {/* ═══ OUTRO OVERLAY ═══ */}
      {sceneIndex === scenes.length - 1 && sceneFrame >= currentScene.durationInFrames - 90 && (
        <OutroOverlay frame={sceneFrame - (currentScene.durationInFrames - 90)} fps={fps} />
      )}
    </div>
  );
};
