import "./index.css";
import React from "react";
import { Composition, CalculateMetadataFunction, staticFile } from "remotion";
import { MyComposition } from "./Composition";
import { InboundComponent, InboundVideoProps } from "./InboundComposition";
import { getAudioDurationInSeconds } from "@remotion/media-utils";

// Calculate duration and metadata dynamically for Inbound Tourism video
const calculateInboundMetadata: CalculateMetadataFunction<InboundVideoProps> = async ({ props }) => {
  const fps = 30;
  let totalDurationFrames = 0;
  const resolvedScenes = [];

  for (const scene of props.scenes) {
    let durationInFrames = scene.durationInFrames;
    if (durationInFrames === undefined) {
      if (scene.audio) {
        try {
          const audioUrl = staticFile(scene.audio);
          const durationSeconds = await getAudioDurationInSeconds(audioUrl);
          // Add 15 frames padding after narration finishes for a natural transition
          durationInFrames = Math.ceil(durationSeconds * fps) + 15;
        } catch (e) {
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
    width: props.width || 1080,
    height: props.height || 1920,
    fps,
    durationInFrames: totalDurationFrames,
    props: {
      ...props,
      scenes: resolvedScenes,
      totalDurationFrames
    }
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      
      <Composition
        id="InboundVideo"
        component={InboundComponent as React.FC<Record<string, unknown>>}
        durationInFrames={150} // Default duration, overridden by calculateInboundMetadata
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={calculateInboundMetadata as unknown as CalculateMetadataFunction<Record<string, unknown>>}
        defaultProps={{
          bgm: "data/inbound-tourism/inbound_bgm.wav",
          bgmVolume: 0.1,
          scenes: []
        }}
      />
    </>
  );
};
