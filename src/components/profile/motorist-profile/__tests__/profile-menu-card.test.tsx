// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  ProfileMenuCard,
  MOTORIST_PROFILE_MENU_ITEMS,
} from "../profile-menu-card";

const mockPush = vi.fn();
const mockSwitchAccount = vi.fn();
let mockHasProAccount = false;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/lib/store", () => ({
  useApp: () => ({
    hasProAccount: mockHasProAccount,
    switchAccount: mockSwitchAccount,
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    locale: "en",
    t: (key: string) => {
      const dict: Record<string, string> = {
        "settings.hub.personalInfo": "Personal Info",
        "settings.hub.appearance": "Appearance",
        "settings.hub.appearanceDetail": "Theme & language",
        "settings.hub.verification": "Verification",
        "settings.hub.verificationDetail": "Identity, phone & tier status",
        "settings.hub.referEarn": "Refer & Earn",
        "settings.hub.referEarnDetail": "Share your code. Earn credits",
        "settings.hub.paymentsCustomer": "Payments & Refunds",
        "settings.hub.paymentsDetailCustomer": "Overview, bank & activity",
        "settings.hub.security": "Security",
        "settings.hub.securityDetail": "Password, sessions & alerts",
        "settings.hub.notifications": "Notifications",
        "settings.hub.notificationsDetail": "Alerts & sounds",
        "settings.hub.privacy": "Privacy & Account",
        "settings.hub.privacyDetail": "Visibility, data & permissions",
        "settings.hub.support": "Support & Tools",
        "settings.hub.supportDetail": "Help, legal & about",
        "settings.hub.addresses": "Addresses & location",
        "settings.hub.addressesDetail": "Home, Work, service area & pin",
        "settings.hub.becomePro": "Become a Repair Pro",
        "settings.hub.becomeProDetail": "Apply with your motorist details",
        "settings.hub.switchPro": "Switch to Repair Pro",
        "settings.hub.switchProDetail": "Open Pro dashboard & Go Live",
      };
      return dict[key] || key;
    },
  }),
}));

describe("ProfileMenuCard", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSwitchAccount.mockClear();
    mockHasProAccount = false;
  });

  it("does not include availability or pricing in MOTORIST_PROFILE_MENU_ITEMS", () => {
    const ids = MOTORIST_PROFILE_MENU_ITEMS.map((item) => item.id);
    expect(ids).not.toContain("availability");
    expect(ids).not.toContain("pricing");
    expect(ids).toEqual([
      "personal-info",
      "appearance",
      "verification",
      "refer-earn",
      "payments",
      "security",
      "notifications",
      "privacy",
      "support",
      "addresses",
    ]);
  });

  it("renders 'Become a Repair Pro' gateway item for pure motorist (!hasProAccount)", () => {
    mockHasProAccount = false;
    render(<ProfileMenuCard />);

    expect(screen.queryByText("Availability & Scheduling")).toBeNull();
    expect(screen.queryByText("Pricing & Services")).toBeNull();

    const becomePro = screen.getByText("Become a Repair Pro");
    expect(becomePro).toBeTruthy();
    expect(screen.getByText("Apply with your motorist details")).toBeTruthy();

    const link = becomePro.closest("a");
    expect(link?.getAttribute("href")).toBe(
      "/signup/pro?from=profile&attach=1&next=/dashboard",
    );
  });

  it("renders 'Switch to Repair Pro' gateway item for dual-role user (hasProAccount)", async () => {
    mockHasProAccount = true;
    render(<ProfileMenuCard />);

    expect(screen.queryByText("Availability & Scheduling")).toBeNull();
    expect(screen.queryByText("Pricing & Services")).toBeNull();
    expect(screen.queryByText("Become a Repair Pro")).toBeNull();

    const switchPro = screen.getByText("Switch to Repair Pro");
    expect(switchPro).toBeTruthy();
    expect(screen.getByText("Open Pro dashboard & Go Live")).toBeTruthy();

    const link = switchPro.closest("a")!;
    await act(async () => {
      fireEvent.click(link);
    });

    expect(mockSwitchAccount).toHaveBeenCalledWith("professional");
  });

  it("respects custom items when passed as a prop", () => {
    const custom = [
      {
        id: "custom-1",
        title: "Custom Item",
        iconSrc: "/icons/profile-appearance.png",
        href: "/custom",
      },
    ];

    render(<ProfileMenuCard items={custom} />);

    expect(screen.getByText("Custom Item")).toBeTruthy();
    expect(screen.queryByText("Personal Info")).toBeNull();
  });
});
