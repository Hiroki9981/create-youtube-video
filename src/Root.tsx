import "./index.css";
import React from "react";
import { Composition, CalculateMetadataFunction, staticFile } from "remotion";
import { MyComposition } from "./sushi-bar/Composition";
import { InboundComponent } from "./inbound-tourism/InboundComposition";
import { CompanyComponent } from "./company-ranking/CompanyComposition";
import { IpVoronoiComposition } from "./ip-voronoi/IpVoronoiComposition";
import { getAudioDurationInSeconds } from "@remotion/media-utils";

// Calculate duration and metadata dynamically for Inbound Tourism video
const calculateInboundMetadata: CalculateMetadataFunction<any> = async ({ props }) => {
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
    durationInFrames: totalDurationFrames + 1,
    props: {
      ...props,
      scenes: resolvedScenes,
      totalDurationFrames: totalDurationFrames + 1
    }
  };
};

// Calculate duration and metadata dynamically for Company ranking video
const calculateCompanyMetadata: CalculateMetadataFunction<any> = async ({ props }) => {
  const fps = 30;
  let totalDurationFrames = 0;
  const resolvedScenes = [];

  for (const scene of props.scenes) {
    let durationInFrames = scene.durationInFrames;
    if (durationInFrames === undefined) {
      durationInFrames = 6 * fps; // Default 6 seconds per year
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
    durationInFrames: totalDurationFrames + 1, // +1 for the Frame 0 thumbnail!
    props: {
      ...props,
      scenes: resolvedScenes,
      totalDurationFrames: totalDurationFrames + 1
    }
  };
};

// Calculate duration and metadata dynamically for IpVoronoi video
const calculateIpVoronoiMetadata: CalculateMetadataFunction<any> = async ({ props }) => {
  const fps = 30;
  let totalDurationFrames = 0;
  const resolvedScenes = [];

  for (const scene of props.scenes || []) {
    let durationInFrames = scene.durationInFrames;
    if (durationInFrames === undefined) {
      durationInFrames = 6 * fps; // Default 6 seconds per year
    }
    resolvedScenes.push({
      ...scene,
      durationInFrames
    });
    totalDurationFrames += durationInFrames;
  }

  return {
    width: 1080,
    height: 1920,
    fps,
    durationInFrames: totalDurationFrames,
    props: {
      ...props,
      scenes: resolvedScenes,
    }
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      
      <Composition
        id="InboundVideo"
        component={InboundComponent as React.FC<any>}
        durationInFrames={150} // Default duration, overridden by calculateInboundMetadata
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={calculateInboundMetadata as unknown as CalculateMetadataFunction<any>}
        defaultProps={{
          bgm: "data/inbound-tourism/inbound_bgm.wav",
          bgmVolume: 0.1,
          scenes: []
        }}
      />

      <Composition
        id="CompanyVideo"
        component={CompanyComponent as React.FC<any>}
        durationInFrames={150} // Default duration, overridden by calculateCompanyMetadata
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={calculateCompanyMetadata as unknown as CalculateMetadataFunction<any>}
        defaultProps={{
          bgm: "data/company-ranking/companies_bgm.wav",
          bgmVolume: 0.2,
          scenes: [],
          meta: {
            flags: {},
            logos: {}
          }
        }}
      />

      <Composition
        id="IpVoronoi"
        component={IpVoronoiComposition as React.FC<any>}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={calculateIpVoronoiMetadata as unknown as CalculateMetadataFunction<any>}
        defaultProps={{
          title: "IPアドレス領土戦争",
          subtitle: "IPv4アドレス保有数の推移 (2018 - 2026)",
          scenes: []
        }}
      />
    </>
  );
};
