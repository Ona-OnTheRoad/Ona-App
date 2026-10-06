export type ChallengeId =
  | "blink"
  | "smile"
  | "turn_left"
  | "turn_right"
  | "nod"
  | "look_up"
  | "look_down";

export type Challenge = {
  id: ChallengeId;
  label: string;
  feedbackOk: string;
};

export type FaceLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => {
    faceLandmarks?: { x: number; y: number; z?: number }[][];
    faceBlendshapes?: {
      categories: { categoryName: string; score: number }[];
    }[];
    facialTransformationMatrixes?: { data: Float32Array | number[] }[];
  };
  close?: () => void;
};

export type LivenessPhase = "boot" | "run" | "success" | "locked" | "fail";

export type LivenessLm = { x: number; y: number; z?: number }[];
