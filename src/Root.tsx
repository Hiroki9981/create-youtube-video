import "./index.css";
import React from "react";
import { Composition, CalculateMetadataFunction, staticFile } from "remotion";
import { MyComposition } from "./sushi-bar/Composition";
import { InboundComponent } from "./inbound-tourism/InboundComposition";
import { CompanyComponent } from "./company-ranking/CompanyComposition";
import { IpVoronoiComposition } from "./ip-voronoi/IpVoronoiComposition";
import { LangVoronoiComposition } from "./lang-ranking/LangVoronoiComposition";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import ipVoronoiConfig from "../public/data/ip-voronoi/video-config-ip-voronoi.json";
import langConfig from "../public/data/lang-ranking/video-config-lang-ranking.json";
import inboundConfig from "../public/data/inbound-tourism/video-config-inbound-tourism.json";
import { TaxWageComposition } from "./tax-wage/TaxWageComposition";
import taxWageConfig from "../public/data/tax-wage/video-config-tax-wage.json";

// Calculate duration and metadata dynamically for Inbound Tourism video
const calculateInboundMetadata: CalculateMetadataFunction<any> = async ({ props }) => {
  const fps = 30;
  let totalDurationFrames = 0;
  const resolvedScenes = [];

  for (const scene of props.scenes || []) {
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

// Calculate duration and metadata dynamically for LangVoronoi video
const calculateLangVoronoiMetadata: CalculateMetadataFunction<any> = async ({ props }) => {
  const fps = 30;
  let totalDurationFrames = 0;
  const resolvedScenes = [];

  for (const scene of props.scenes || []) {
    let durationInFrames = scene.durationInFrames;
    if (durationInFrames === undefined) {
      durationInFrames = 6 * fps;
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

// Calculate duration and metadata dynamically for TaxWage video
const calculateTaxWageMetadata: CalculateMetadataFunction<any> = async ({ props }) => {
  const fps = 30;
  let totalDurationFrames = 0;
  const resolvedScenes = [];

  for (const scene of props.scenes || []) {
    let durationInFrames = scene.durationInFrames;
    if (durationInFrames === undefined) {
      durationInFrames = 6 * fps;
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
    durationInFrames: totalDurationFrames + 1, // +1 for frame 0 thumbnail
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
        defaultProps={inboundConfig as any}
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
          bgm: "data/audio/shining_star.mp3",
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
        defaultProps={ipVoronoiConfig as any}
      />

      <Composition
        id="LangVoronoi"
        component={LangVoronoiComposition as React.FC<any>}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={calculateLangVoronoiMetadata as unknown as CalculateMetadataFunction<any>}
        defaultProps={langConfig as any}
      />

      <Composition
        id="TaxWage"
        component={TaxWageComposition as React.FC<any>}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={calculateTaxWageMetadata as unknown as CalculateMetadataFunction<any>}
        defaultProps={taxWageConfig as any}
      />
    </>
  );
};
