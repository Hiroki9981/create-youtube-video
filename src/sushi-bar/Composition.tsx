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
  Video,
} from "remotion";
import React from "react";
import { getAudioDurationInSeconds, getVideoMetadata } from "@remotion/media-utils";

export interface CharacterProps {
  image: string;
  position?: 'left' | 'right' | 'center';
  isTalking?: boolean;
  style?: React.CSSProperties;
}

const cleanStaticPath = (srcPath: string): string => {
  if (srcPath.startsWith('public/')) {
    return srcPath.replace(/^public\//, '');
  }
  return srcPath;
};

export interface Scene {
  text: string;
  image?: string;
  video?: string;
  audio?: string;
  durationInFrames?: number;
  textStyle?: React.CSSProperties;
  character?: CharacterProps;
  speaker?: 'left' | 'right';
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

// Character Renderer Component is removed to focus solely on the background video.

// Scene Renderer Component
const SceneComponent: React.FC<{
  scene: Scene;
  durationInFrames: number;
  isFirstScene: boolean;
}> = ({ scene, durationInFrames, isFirstScene }) => {
  const frame = useCurrentFrame();

  // Cross-fade scene transition (fade-in at start, fade-out at end)
  const transitionDuration = 12; // frames
  const sceneOpacity = interpolate(
    frame,
    [0, transitionDuration, durationInFrames - transitionDuration, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Caption spring entry animation (slide up and fade in)
  const textSpring = spring({
    frame,
    fps: 30,
    config: { damping: 14, mass: 0.5 },
  });
  
  const textTranslateY = interpolate(textSpring, [0, 1], [30, 0]);
  const textOpacity = textSpring;

  return (
    <div
      style={{ 
        opacity: sceneOpacity,
      }}
      className="absolute inset-0 w-full h-full flex flex-col justify-end items-center bg-black overflow-hidden"
    >
      {/* Background Video or Image */}
      {scene.video ? (
        <Video
          src={staticFile(cleanStaticPath(scene.video))}
          className="absolute inset-0 w-full h-full object-cover"
          volume={0}
          loop
        />
      ) : scene.image ? (
        <Img
          src={staticFile(cleanStaticPath(scene.image))}
          alt="Scene background"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}

      {/* Dark gradient overlay at the bottom */}
      <div 
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10" 
      />

      {/* Subtitles Overlay Container (Static in foreground) */}
      <div 
        style={{
          transform: `translateY(${textTranslateY}px)`,
          opacity: textOpacity,
          zIndex: 20,
          ...scene.textStyle
        }}
        className="relative mb-20 max-w-[85%] bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-10 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center"
      >
        <span className="text-white text-4xl font-bold tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans text-center">
          {scene.text}
        </span>
      </div>

      {/* Voiceover Audio */}
      {scene.audio && (
        <Audio 
          src={staticFile(cleanStaticPath(scene.audio))} 
        />
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
          src={staticFile(cleanStaticPath(bgm))}
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
                isFirstScene={index === 0}
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

  for (let idx = 0; idx < mergedProps.scenes.length; idx++) {
    const scene = mergedProps.scenes[idx];
    let durationInFrames = scene.durationInFrames;

    if (durationInFrames === undefined) {
      // Prioritize background video duration if available
      if (scene.video) {
        try {
          const videoUrl = staticFile(cleanStaticPath(scene.video));
          const metadata = await getVideoMetadata(videoUrl);
          durationInFrames = Math.ceil(metadata.durationInSeconds * fps);
        } catch (e) {
          console.warn(`Failed to resolve video duration for scene: ${scene.video}`, e);
        }
      }

      // Fallback to audio duration if video duration failed or not specified
      if (durationInFrames === undefined && scene.audio) {
        try {
          const audioUrl = staticFile(cleanStaticPath(scene.audio));
          const durationSeconds = await getAudioDurationInSeconds(audioUrl);
          durationInFrames = Math.ceil(durationSeconds * fps);
        } catch (e) {
          console.warn(`Failed to resolve audio duration for scene: ${scene.audio}`, e);
          durationInFrames = 5 * fps;
        }
      }

      if (durationInFrames === undefined) {
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
