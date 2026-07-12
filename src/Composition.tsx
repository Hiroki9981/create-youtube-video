import {
  Audio,
  CalculateMetadataFunction,
  Composition,
  getInputProps,
  Img,
  interpolate,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import React from "react";
import { getAudioDurationInSeconds } from "@remotion/media-utils";

export interface Scene {
  text: string;
  image?: string;
  audio?: string;
  durationInFrames?: number;
  textStyle?: React.CSSProperties;
}

export interface VideoProps {
  width?: number;
  height?: number;
  fps?: number;
  bgm?: string;
  bgmVolume?: number;
  scenes: Scene[];
  [key: string]: unknown;
}

const defaultProps: VideoProps = {
  width: 1920,
  height: 1080,
  fps: 30,
  bgm: "data/bgm.wav",
  bgmVolume: 0.15,
  scenes: [
    {
      text: "こんにちは！YouTube動画量産ツールのデモへようこそ。",
      image: "data/scene1.png",
      audio: "data/audio1.wav"
    },
    {
      text: "このツールはJSONファイルに記述された情報を読み取り、自動で動画を構成します。",
      image: "data/scene2.png",
      audio: "data/audio2.wav"
    },
    {
      text: "音声ファイルの長さが自動で計算され、それに基づいてシーンの尺が決定されます。",
      image: "data/scene3.png",
      audio: "data/audio3.wav"
    }
  ]
};

export const MyComposition = () => {
  const inputProps = getInputProps() as unknown as VideoProps;
  const mergedProps = { ...defaultProps, ...inputProps };
  
  return (
    <Composition
      id="MyComp"
      component={MyComponent as React.FC<Record<string, unknown>>}
      durationInFrames={150} // Default duration, overridden by calculateMetadata
      fps={30}
      width={1920}
      height={1080}
      calculateMetadata={calculateMetadata as unknown as CalculateMetadataFunction<Record<string, unknown>>}
      defaultProps={mergedProps as Record<string, unknown>}
    />
  );
};

// Scene Renderer Component
const SceneComponent: React.FC<{
  scene: Scene;
  durationInFrames: number;
}> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Ken Burns Effect (Image scaling)
  const imageScale = interpolate(
    frame,
    [0, durationInFrames],
    [1.0, 1.08],
    { extrapolateRight: "clamp" }
  );

  // 2. Cross-fade scene transition (fade-in at start, fade-out at end)
  const transitionDuration = 12; // frames
  const sceneOpacity = interpolate(
    frame,
    [0, transitionDuration, durationInFrames - transitionDuration, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 3. Caption spring entry animation (slide up and fade in)
  const textSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.5 },
  });
  
  const textTranslateY = interpolate(textSpring, [0, 1], [30, 0]);
  const textOpacity = textSpring;

  return (
    <div
      style={{ opacity: sceneOpacity }}
      className="absolute inset-0 w-full h-full flex flex-col justify-end items-center bg-black overflow-hidden"
    >
      {/* Background Image with Ken Burns Effect */}
      {scene.image && (
        <Img
          src={staticFile(scene.image)}
          alt="Scene background"
          style={{ transform: `scale(${imageScale})` }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Dark gradient overlay at the bottom for caption readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Subtitles Overlay Container */}
      <div 
        style={{
          transform: `translateY(${textTranslateY}px)`,
          opacity: textOpacity,
          ...scene.textStyle
        }}
        className="relative z-10 mb-20 max-w-[85%] bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-10 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center"
      >
        <span className="text-white text-4xl font-bold tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans text-center">
          {scene.text}
        </span>
      </div>

      {/* Voiceover Audio */}
      {scene.audio && (
        <Audio src={staticFile(scene.audio)} />
      )}
    </div>
  );
};

// Main Composition Component
export const MyComponent: React.FC<VideoProps> = (props) => {
  const { scenes, bgm, bgmVolume = 0.15 } = props;

  return (
    <div className="w-full h-full bg-black relative">
      {/* Background Music Loop */}
      {bgm && (
        <Audio
          src={staticFile(bgm)}
          volume={bgmVolume}
          loop
        />
      )}

      {/* Sequence of Scenes */}
      <Series>
        {scenes.map((scene, index) => {
          const duration = scene.durationInFrames || 150; // default 5s
          return (
            <Series.Sequence
              key={index}
              durationInFrames={duration}
            >
              <SceneComponent
                scene={scene}
                durationInFrames={duration}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </div>
  );
};

// Calculate duration and metadata dynamically
export const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  const mergedProps = { ...defaultProps, ...props };
  const fps = mergedProps.fps || 30;

  // Resolve durations for each scene
  const resolvedScenes: Scene[] = [];
  let totalDurationFrames = 0;

  for (const scene of mergedProps.scenes) {
    let durationInFrames = scene.durationInFrames;

    if (durationInFrames === undefined) {
      if (scene.audio) {
        try {
          const audioUrl = staticFile(scene.audio);
          const durationSeconds = await getAudioDurationInSeconds(audioUrl);
          durationInFrames = Math.ceil(durationSeconds * fps);
        } catch (e) {
          console.warn(`Failed to resolve audio duration for scene: ${scene.audio}`, e);
          durationInFrames = 5 * fps;
        }
      } else {
        durationInFrames = 5 * fps;
      }
    }

    resolvedScenes.push({
      ...scene,
      durationInFrames
    });
    totalDurationFrames += durationInFrames;
  }

  return {
    width: mergedProps.width || 1920,
    height: mergedProps.height || 1080,
    fps,
    durationInFrames: totalDurationFrames,
    props: {
      ...mergedProps,
      scenes: resolvedScenes,
      totalDurationFrames
    }
  };
};
