// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlowFinalStep } from "@/components/home/help-flow/flow-final-step";
import { helpFlowConfigs } from "@/components/home/help-flow-configs";

vi.mock("@/components/map/address-autocomplete", () => ({
  AddressAutocomplete: () => null,
}));
vi.mock("@/components/jobs/voice-note-recorder", () => ({
  VoiceNoteRecorder: () => null,
}));

const styles = {
  ink: "",
  muted: "",
  field: "",
  rowCard: "",
  actionFlat: "",
  chipIdle: "",
};

function renderFinal(
  trade: string,
  finalStep: string,
  photoCount: number,
  canSend: boolean,
) {
  const photos = Array.from({ length: photoCount }, (_, i) => ({
    id: `p${i}`,
    kind: "photo" as const,
    url: "data:,",
    name: "p.jpg",
    mime: "image/jpeg",
    createdAt: new Date().toISOString(),
    uploadedBy: "u",
  }));
  return render(
    <FlowFinalStep
      config={helpFlowConfigs[trade]}
      isLight
      styles={styles}
      tag="Request"
      tradeId={trade as never}
      distanceKm={null}
      finalStep={finalStep}
      photos={photos}
      setPhotos={vi.fn()}
      photoRef={{ current: null }}
      onPhotos={vi.fn()}
      voiceNote={null}
      setVoiceNote={vi.fn()}
      voiceUserId="u"
      pickedLoc={null}
      setPickedLoc={vi.fn()}
      landmark=""
      setLandmark={vi.fn()}
      urgency={"normal" as never}
      setUrgency={vi.fn()}
      extraState={{}}
      setExtraState={vi.fn()}
      answers={{}}
      setError={vi.fn()}
      busy={false}
      canSend={canSend}
      nextFinal={vi.fn()}
      finalBack={vi.fn()}
      send={vi.fn(async () => {})}
    />,
  );
}

describe("send button explains why it is disabled", () => {
  it("tells the customer a photo is needed, with the count", () => {
    renderFinal("generator", "photos", 0, false);
    expect(
      screen.getByText("Add at least 1 photo to continue (0/1)."),
    ).toBeTruthy();
    expect(
      screen.getByText(/At least 1 photo needed, you can add up to 4/),
    ).toBeTruthy();
  });

  it("asks for the missing answer when photos are fine but sending is blocked", () => {
    renderFinal("plumber", "property", 1, false);
    expect(screen.getByText("Answer the question above to continue.")).toBeTruthy();
  });

  it("shows no hint once sending is allowed", () => {
    renderFinal("generator", "photos", 1, true);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not ask for photos on trades that don't need them", () => {
    renderFinal("mechanic", "photos", 0, true);
    expect(screen.queryByText(/Add at least/)).toBeNull();
  });
});
