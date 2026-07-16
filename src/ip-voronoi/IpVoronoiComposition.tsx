import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, Audio, staticFile, interpolate, spring, Img, useVideoConfig } from "remotion";
import ipData from "../../public/data/ip-voronoi/ip-history-data.json";

// Types
export interface SceneConfig {
  year: number;
  events: string;
  durationInFrames: number;
}

export interface IpVoronoiCompositionProps {
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
            background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.4,
            filter: "drop-shadow(0 0 40px rgba(52, 211, 153, 0.4))",
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

export const IpVoronoiComposition: React.FC<IpVoronoiCompositionProps> = ({
  title = "IPアドレス領土戦争",
  subtitle = "IPv4アドレス保有数の推移 (2018 - 2026)",
  scenes = [],
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { fps } = useVideoConfig();


  // Configuration for anchors in 70x70 grid
  // Placed logically: Telcos (JP) on Left, Cloud (US) on Right, Tech (CN) in Center
  const ANCHORS: Record<string, { x: number; y: number }> = {
    KDDI: { x: 12, y: 15 },
    NTT: { x: 12, y: 35 },
    SoftBank: { x: 12, y: 55 },
    Alibaba: { x: 27, y: 15 },
    ChinaUnicom: { x: 27, y: 35 },
    Tencent: { x: 27, y: 55 },
    Lumen: { x: 42, y: 35 },
    Google: { x: 58, y: 15 },
    AWS: { x: 58, y: 35 },
    Microsoft: { x: 58, y: 55 },
  };

  const GRID_SIZE = 70; // Resolution of canvas calculation grid

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

  // Interpolate IP counts for current frame
  const currentYearStats =
    ipData.history.find((h: any) => h.year === currentScene.year)?.stats || {};
  const nextYearStats =
    ipData.history.find((h: any) => h.year === nextScene.year)?.stats || {};

  const interpolatedStats: Record<string, number> = {};
  const companyList = Object.keys(ipData.companies).map((name) => {
    const startVal = (currentYearStats as Record<string, number>)[name] || 0;
    const endVal = (nextYearStats as Record<string, number>)[name] || startVal;
    const val = startVal + (endVal - startVal) * progress;
    interpolatedStats[name] = val;

    // Weight formula: perceptual scaling (power of 0.7) to avoid giant AWS swallowing others
    // Scaled to match the squared distances on a 70x70 grid
    const weight = Math.pow(val, 0.7) * 0.0055;

    return {
      name,
      ipCount: val,
      weight,
      color: (ipData.companies as any)[name].color,
      displayName: (ipData.companies as any)[name].displayName,
      country: (ipData.companies as any)[name].country,
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
      let minD = Infinity;
      let minId = 0;
      for (let i = 0; i < companyList.length; i++) {
        const node = companyList[i];
        const dx = x - node.x;
        const dy = y - node.y;
        const d = dx * dx + dy * dy - node.weight;
        if (d < minD) {
          minD = d;
          minId = i;
        }
      }
      grid[y * GRID_SIZE + x] = minId;
      sumsX[minId] += x;
      sumsY[minId] += y;
      counts[minId]++;
    }
  }

  // Container dimensions (render size of Voronoi map)
  const MAP_SIZE = 840;

  // Calculate centroids
  const centroids = companyList.map((node, i) => {
    if (counts[i] > 100) {
      return {
        x: (sumsX[i] / counts[i]) * (MAP_SIZE / GRID_SIZE),
        y: (sumsY[i] / counts[i]) * (MAP_SIZE / GRID_SIZE),
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
  const bgmFile = staticFile("data/company-ranking/companies_bgm.wav");

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
          IP BATTLEFIELD
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
          IPアドレス領土戦争
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
          IPv4アドレス保有数の推移 (2018 - 2026)
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
            "radial-gradient(circle, rgba(66, 133, 244, 0.1) 0%, transparent 70%)",
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

      {/* SVG Metaball filter definition */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="metaball">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

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
            color: "#4285f4",
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
              backgroundColor: "#ff3366",
              marginRight: "16px",
              boxShadow: "0 0 10px #ff3366",
            }}
          />
          IPv4 BATTLEFIELD
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

        {/* Digital compass points */}
        <div
          style={{
            position: "absolute",
            top: 2,
            fontSize: "18px",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.3)",
          }}
        >
          N 0.0.0.0
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 2,
            fontSize: "18px",
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.3)",
          }}
        >
          S 255.255.255.255
        </div>

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

          // Load flag and logo dynamically
          const flagPath = staticFile(
            `data/ip-voronoi/flags/${company.country.toLowerCase()}.png`
          );
          const logoPath = staticFile(
            `data/ip-voronoi/logos/${company.name.toLowerCase()}.png`
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
                      width: "80%",
                      height: "80%",
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
                    <img
                      src={flagPath}
                      style={{
                        width: "18px",
                        height: "12px",
                        borderRadius: "2px",
                        objectFit: "cover",
                      }}
                      alt=""
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#9ca3af",
                      fontWeight: 600,
                    }}
                  >
                    {(company.ipCount / 1_000_000).toFixed(1)}M IPs
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Glowing Current Year Display (Positioned bottom-right of the circle graph) */}
        <div
          style={{
            position: "absolute",
            right: "120px",
            bottom: "60px",
            background: "rgba(10, 11, 15, 0.9)",
            border: "2px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "inset 0 0 20px rgba(255, 255, 255, 0.02), 0 10px 40px rgba(0,0,0,0.8)",
            borderRadius: "24px",
            padding: "16px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            zIndex: 30,
          }}
        >
          <span style={{ fontSize: "14px", color: "#9ca3af", letterSpacing: "4px", fontWeight: 700 }}>YEAR</span>
          <span
            style={{
              fontSize: "64px",
              fontWeight: 900,
              fontFamily: "'Courier New', monospace",
              color: "#34d399",
              textShadow: "0 0 15px rgba(52, 211, 153, 0.5)",
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
            position: "absolute",
            left: 0,
            top: 0,
            width: "6px",
            height: "100%",
            backgroundColor: "#4285f4",
          }}
        />
        <p
          style={{
            fontSize: "26px",
            lineHeight: "38px",
            margin: 0,
            fontWeight: 500,
            color: "#e5e7eb",
          }}
        >
          {currentScene.events}
        </p>
      </div>

      {/* STATS CHART & RANKING */}
      <div
        style={{
          background: "rgba(10, 11, 15, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "24px",
          padding: "32px",
          height: "440px",
          boxSizing: "border-box",
          zIndex: 10,
          position: "relative",
        }}
      >
        <h3
          style={{
            fontSize: "24px",
            fontWeight: 800,
            margin: "0 0 24px 0",
            letterSpacing: "1px",
            color: "#9ca3af",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>IPアドレス保有数ランキング</span>
          <span style={{ color: "#34d399", fontSize: "20px" }}>単位: 100万IP</span>
        </h3>

        {/* The Bar Chart list */}
        <div style={{ position: "relative", height: "320px" }}>
          {companyList.map((company) => {
            const sortedIndex = sortedCompanies.findIndex(
              (c) => c.name === company.name
            );
            const rowHeight = 40;
            const barWidthMax = 580; // pixels
            const barWidth = (company.ipCount / maxIpInChart) * barWidthMax;

            const flagPath = staticFile(
              `data/ip-voronoi/flags/${company.country.toLowerCase()}.png`
            );
            const logoPath = staticFile(
              `data/ip-voronoi/logos/${company.name.toLowerCase()}.png`
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
                    color: sortedIndex < 3 ? "#34d399" : "#6b7280",
                    textAlign: "center",
                  }}
                >
                  {sortedIndex + 1}
                </div>

                {/* Flag */}
                <img
                  src={flagPath}
                  style={{
                    width: "28px",
                    height: "18px",
                    borderRadius: "2px",
                    marginLeft: "10px",
                    objectFit: "cover",
                  }}
                  alt=""
                />

                {/* Name */}
                <div
                  style={{
                    width: "140px",
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
                  {(company.ipCount / 1_000_000).toFixed(1)}M
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
            データ出典: RIPEstat / 各社公開IP範囲
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
