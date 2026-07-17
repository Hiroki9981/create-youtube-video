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

    // Weight formula for Multiplicative Voronoi: perceptual scaling (power of 0.6)
    // To prevent division by zero or negative weights
    const weight = val > 0 ? Math.pow(val, 0.6) : 1e-10;

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
        // Multiplicative Voronoi distance: dist^2 / weight
        const d = (dx * dx + dy * dy) / node.weight;
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
    if (counts[i] > 15) {
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
  const bgmFile = staticFile("data/audio/shining_star.mp3");

  if (frame === 0) {
    return (
      <div
        style={{
          width: 1080,
          height: 1920,
          background: "#080810",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit', 'Inter', 'Noto Sans JP', sans-serif",
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
            transform: "scale(1.05)",
          }}
        />

        {/* Cyber Grid Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            backgroundPosition: "center",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Dark Vignette and Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at center, rgba(10,10,20,0.2) 0%, rgba(5,5,10,0.85) 100%)",
            zIndex: 2,
          }}
        />

        {/* Floating Brand Logos without speech bubbles (visual hints only) */}
        {/* === LEFT SIDE ARCH (20% steps, safe space, expanded outwards) === */}
        {/* AWS (Top-Left) */}
        <div
          style={{
            position: "absolute",
            top: "16%",
            left: "6%",
            width: "105px",
            height: "105px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(234, 88, 12, 0.35)",
            border: "3px solid #ea580c",
            transform: "rotate(-10deg)",
            zIndex: 3,
            opacity: 0.95,
          }}
        >
          <img
            src={staticFile("data/ip-voronoi/logos/aws.png")}
            style={{ width: "65%", height: "65%", objectFit: "contain" }}
            alt=""
          />
        </div>

        {/* SoftBank (Upper-Middle-Left) */}
        <div
          style={{
            position: "absolute",
            top: "36%",
            left: "4%",
            width: "95px",
            height: "95px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
            border: "3px solid #ffcc00",
            transform: "rotate(6deg)",
            zIndex: 3,
            opacity: 0.95,
          }}
        >
          <img
            src={staticFile("data/ip-voronoi/logos/softbank.png")}
            style={{ width: "65%", height: "65%", objectFit: "contain" }}
            alt=""
          />
        </div>

        {/* KDDI (Lower-Middle-Left) */}
        <div
          style={{
            position: "absolute",
            top: "56%",
            left: "4%",
            width: "95px",
            height: "95px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(30, 58, 138, 0.25)",
            border: "3px solid #1e3a8a",
            transform: "rotate(-8deg)",
            zIndex: 3,
            opacity: 0.95,
          }}
        >
          <img
            src={staticFile("data/ip-voronoi/logos/kddi.png")}
            style={{ width: "65%", height: "65%", objectFit: "contain" }}
            alt=""
          />
        </div>

        {/* NTT (Bottom-Left) */}
        <div
          style={{
            position: "absolute",
            top: "76%",
            left: "6%",
            width: "105px",
            height: "105px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(37, 99, 235, 0.35)",
            border: "3px solid #2563eb",
            transform: "rotate(8deg)",
            zIndex: 3,
            opacity: 0.95,
          }}
        >
          <img
            src={staticFile("data/ip-voronoi/logos/ntt.png")}
            style={{ width: "65%", height: "65%", objectFit: "contain" }}
            alt=""
          />
        </div>

        {/* === RIGHT SIDE ARCH (20% steps, safe space, expanded outwards) === */}
        {/* Microsoft (Top-Right) */}
        <div
          style={{
            position: "absolute",
            top: "16%",
            right: "8%",
            width: "105px",
            height: "105px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(168, 85, 247, 0.35)",
            border: "3px solid #a855f7",
            transform: "rotate(10deg)",
            zIndex: 3,
            opacity: 0.95,
          }}
        >
          <img
            src={staticFile("data/ip-voronoi/logos/microsoft.png")}
            style={{ width: "65%", height: "65%", objectFit: "contain" }}
            alt=""
          />
        </div>

        {/* Alibaba (Upper-Middle-Right) */}
        <div
          style={{
            position: "absolute",
            top: "36%",
            right: "10%",
            width: "95px",
            height: "95px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(249, 115, 22, 0.25)",
            border: "3px solid #f97316",
            transform: "rotate(-5deg)",
            zIndex: 3,
            opacity: 0.95,
          }}
        >
          <img
            src={staticFile("data/ip-voronoi/logos/alibaba.png")}
            style={{ width: "65%", height: "65%", objectFit: "contain" }}
            alt=""
          />
        </div>

        {/* Tencent (Lower-Middle-Right) */}
        <div
          style={{
            position: "absolute",
            top: "56%",
            right: "10%",
            width: "95px",
            height: "95px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(0, 82, 217, 0.25)",
            border: "3px solid #0052d9",
            transform: "rotate(8deg)",
            zIndex: 3,
            opacity: 0.95,
          }}
        >
          <img
            src={staticFile("data/ip-voronoi/logos/tencent.png")}
            style={{ width: "65%", height: "65%", objectFit: "contain" }}
            alt=""
          />
        </div>

        {/* Google (Bottom-Right) */}
        <div
          style={{
            position: "absolute",
            top: "76%",
            right: "8%",
            width: "105px",
            height: "105px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(14, 165, 233, 0.35)",
            border: "3px solid #0ea5e9",
            transform: "rotate(-10deg)",
            zIndex: 3,
            opacity: 0.95,
          }}
        >
          <img
            src={staticFile("data/ip-voronoi/logos/google.png")}
            style={{ width: "65%", height: "65%", objectFit: "contain" }}
            alt=""
          />
        </div>

        {/* Hype/Attention Badge */}
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
            textTransform: "uppercase",
            boxShadow: "0 10px 25px rgba(255, 0, 95, 0.6), 0 0 15px rgba(0, 240, 255, 0.3)",
          }}
        >
          【IPv4枯渇危機】
        </div>

        {/* Main Title with powerful text shadow / stroke / gradient */}
        <h1
          style={{
            fontSize: 96,
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.2,
            margin: "0 0 30px 0",
            zIndex: 10,
            letterSpacing: "-2px",
            whiteSpace: "pre-wrap",
            fontFamily: "'Outfit', 'Noto Sans JP', sans-serif",
            background: "linear-gradient(to bottom, #ffffff 10%, #38bdf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 15px 25px rgba(0, 0, 0, 0.95)) drop-shadow(0 4px 6px #000000) drop-shadow(0 0 20px rgba(0, 240, 255, 0.25))",
          }}
        >
          IPアドレス<br />
          <span
            style={{
              background: "linear-gradient(to bottom, #ffe600 0%, #ff2a00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            領土戦争
          </span>
        </h1>
        {/* Subtitle with high-contrast text styling */}
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
          IPv4アドレス保有数バトル (2018 - 2026)
        </div>

        {/* Hype Card 1: ●●がIPアドレスを買い占め！？ */}
        <div
          style={{
            background: "#080810",
            border: "4px solid #ffe600",
            padding: "16px 36px",
            borderRadius: "16px",
            color: "#ffffff",
            fontSize: "36px",
            fontWeight: 900,
            zIndex: 10,
            boxShadow: "0 15px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 230, 0, 0.25)",
            whiteSpace: "nowrap",
            textAlign: "center",
            width: "640px",
            margin: "60px auto 0 auto",
            transform: "rotate(-1deg)",
            boxSizing: "border-box",
          }}
        >
          <span style={{ color: "#ff0055" }}>●●企業</span>がIPを買い占め中…！？
        </div>

        {/* Hype Card 2: 日本の現状は・・・？ */}
        <div
          style={{
            background: "linear-gradient(135deg, #ff0055 0%, #b91c1c 100%)",
            border: "4px solid #ffffff",
            padding: "16px 36px",
            borderRadius: "16px",
            color: "#ffffff",
            fontSize: "36px",
            fontWeight: 900,
            zIndex: 10,
            boxShadow: "0 15px 30px rgba(255, 0, 85, 0.5), 0 0 15px rgba(255, 255, 255, 0.1)",
            whiteSpace: "nowrap",
            textAlign: "center",
            width: "640px",
            margin: "24px auto 0 auto",
            transform: "rotate(1deg)",
            boxSizing: "border-box",
          }}
        >
          日本企業の現状は・・・
        </div>

        {/* Watch till End Alert text */}
        <div
          style={{
            color: "#ffe600",
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: 2,
            width: "640px",
            margin: "50px auto 0 auto",
            zIndex: 10,
            textShadow: "0 4px 10px #000000",
            whiteSpace: "nowrap",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          ※ラスト衝撃の結末を見逃すな！
        </div>

        {/* Bottom accent line with glowing gradient */}
        <div
          style={{
            width: 300,
            height: 3,
            background:
              "linear-gradient(90deg, transparent, #facc15, #f97316, #facc15, transparent)",
            boxShadow: "0 0 15px rgba(250, 204, 21, 0.6)",
            marginTop: 40,
            borderRadius: 3,
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
            `data/ip-voronoi/flags/flag_${company.country.toLowerCase()}.png`
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
          height: "340px",
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

        {/* The Bar Chart list (Height adjusted to fit Top 5 items) */}
        <div style={{ position: "relative", height: "200px" }}>
          {companyList.map((company) => {
            const sortedIndex = sortedCompanies.findIndex(
              (c) => c.name === company.name
            );

            const isTop5 = sortedIndex < 5;
            if (!isTop5) {
              return null;
            }

            const displayIndex = sortedIndex;

            const rowHeight = 40;
            const barWidthMax = 580; // pixels
            const barWidth = (company.ipCount / maxIpInChart) * barWidthMax;

            const flagPath = staticFile(
              `data/ip-voronoi/flags/flag_${company.country.toLowerCase()}.png`
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
                  top: displayIndex * rowHeight,
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
