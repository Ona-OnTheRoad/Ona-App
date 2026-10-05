import type { JobRecord } from "@/lib/jobs/types";

export type PanelLevel = "middle" | "full" | "collapsed";

export type CloseBannerState = {
  title: string;
  body: string;
  avatarUrl?: string | null;
};

export type LightboxPhoto = { id: string; url: string; name?: string | null };

export type LightboxState = {
  photos: LightboxPhoto[];
  index: number;
};

export type NotifyClosedOpts = {
  job?: JobRecord | null;
  status?: string | null;
  movedOn?: boolean;
};

export type NotifyRequestClosed = (
  jobId: string,
  opts: NotifyClosedOpts,
) => void;

export type RemoveJobOpts = { defer?: boolean; goDashboard?: boolean };

export type RemoveJob = (jobId: string, opts?: RemoveJobOpts) => void;
