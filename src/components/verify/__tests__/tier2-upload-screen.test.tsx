// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tier2UploadScreen } from "../tier2-upload-screen";
import type { CountryIdDoc } from "@/lib/country-id-rules";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

vi.mock("@/lib/store", () => ({
  useApp: () => ({
    theme: "light",
  }),
}));

const mockDocs: CountryIdDoc[] = [
  {
    kind: "national_id",
    label: "NIN",
    requiredForVerify: true,
    minLen: 11,
    maxLen: 11,
    charset: "digits",
    needsFront: true,
    needsBack: false,
    api: "nin",
    placeholder: "11-digit NIN",
    hint: "National Identification Number from NIMC.",
  },
  {
    kind: "drivers_licence",
    label: "Driver’s licence",
    requiredForVerify: false,
    minLen: 5,
    maxLen: 20,
    charset: "alnum_dash",
    needsFront: true,
    needsBack: true,
    api: null,
    placeholder: "e.g. ABC12345AA12",
    hint: "Nigerian driver’s licence number. Front and back photos.",
  },
  {
    kind: "voters_card",
    label: "Voter’s card",
    requiredForVerify: false,
    minLen: 8,
    maxLen: 20,
    charset: "alnum",
    needsFront: true,
    needsBack: true,
    api: null,
    placeholder: "VIN / card number",
    hint: "INEC permanent voter’s card.",
  },
  {
    kind: "passport",
    label: "International passport",
    requiredForVerify: false,
    minLen: 6,
    maxLen: 12,
    charset: "alnum",
    needsFront: true,
    needsBack: false,
    api: null,
    placeholder: "Passport number",
    hint: "Photo of the main page with your picture and number.",
  },
];

let mockVerifyState: any = {};

vi.mock("../use-verify-identity", () => ({
  useVerifyIdentity: () => mockVerifyState,
}));

describe("Tier2UploadScreen document selection and front/back photo upload", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();

    mockVerifyState = {
      phoneOk: true,
      userProfile: { fullName: "Test User" },
      accountType: "motorist",
      submitted: false,
      tier2Ok: false,
      error: "",
      busy: false,
      idTypes: mockDocs,
      idType: "national_id",
      selectedDoc: mockDocs[0],
      idNumber: "",
      idFront: "",
      idFrontName: "",
      idBack: "",
      idBackName: "",
      setIdNumber: vi.fn(),
      pickIdFront: vi.fn(),
      pickIdBack: vi.fn(),
      changeIdType: vi.fn(),
      submitId: vi.fn(),
      onPhotoReadError: vi.fn(),
    };
  });

  it("renders all available document options in the ID type dropdown", () => {
    render(<Tier2UploadScreen isLight={true} />);

    const select = screen.getByLabelText("ID type") as HTMLSelectElement;
    expect(select).toBeTruthy();

    const options = Array.from(select.options).map((opt) => opt.textContent);
    expect(options).toEqual([
      "NIN",
      "Driver’s licence",
      "Voter’s card",
      "International passport",
    ]);
  });

  it("displays only front photo picker when NIN or International Passport is selected", () => {
    // NIN has needsBack === false
    mockVerifyState.idType = "national_id";
    mockVerifyState.selectedDoc = mockDocs[0];

    const { rerender } = render(<Tier2UploadScreen isLight={true} />);

    expect(screen.getByText("Upload ID photo (front only)")).toBeTruthy();
    expect(screen.queryByText("Upload ID photo (back)")).toBeNull();
    expect(screen.getByText("NIN number")).toBeTruthy();

    // Switch to passport (needsBack === false)
    mockVerifyState.idType = "passport";
    mockVerifyState.selectedDoc = mockDocs[3];
    rerender(<Tier2UploadScreen isLight={true} />);

    expect(screen.getByText("Upload ID photo (front only)")).toBeTruthy();
    expect(screen.queryByText("Upload ID photo (back)")).toBeNull();
    expect(screen.getByText("International passport number")).toBeTruthy();
  });

  it("displays both front and back photo pickers when Driver's Licence or Voter's Card is selected", () => {
    // Driver's licence has needsBack === true
    mockVerifyState.idType = "drivers_licence";
    mockVerifyState.selectedDoc = mockDocs[1];

    const { rerender } = render(<Tier2UploadScreen isLight={true} />);

    expect(screen.getByText("Upload ID photo (front)")).toBeTruthy();
    expect(screen.getByText("Upload ID photo (back)")).toBeTruthy();
    expect(screen.getByText("Driver’s licence number")).toBeTruthy();

    // Voter's card has needsBack === true
    mockVerifyState.idType = "voters_card";
    mockVerifyState.selectedDoc = mockDocs[2];
    rerender(<Tier2UploadScreen isLight={true} />);

    expect(screen.getByText("Upload ID photo (front)")).toBeTruthy();
    expect(screen.getByText("Upload ID photo (back)")).toBeTruthy();
    expect(screen.getByText("Voter’s card number")).toBeTruthy();
  });

  it("requires both front and back photos for isReady when doc needsBack is true", () => {
    mockVerifyState.idType = "drivers_licence";
    mockVerifyState.selectedDoc = mockDocs[1];
    mockVerifyState.idNumber = "ABC12345";
    mockVerifyState.idFront = "data:image/png;base64,front";

    // Only front uploaded -> submit button disabled
    const { rerender } = render(<Tier2UploadScreen isLight={true} />);
    const submitBtn = screen.getByRole("button", { name: /Submit ID for review/i });
    expect(submitBtn.hasAttribute("disabled")).toBe(true);

    // Both front and back uploaded -> submit button enabled
    mockVerifyState.idBack = "data:image/png;base64,back";
    rerender(<Tier2UploadScreen isLight={true} />);
    expect(submitBtn.hasAttribute("disabled")).toBe(false);

    fireEvent.click(submitBtn);
    expect(mockVerifyState.submitId).toHaveBeenCalledTimes(1);
  });
});
