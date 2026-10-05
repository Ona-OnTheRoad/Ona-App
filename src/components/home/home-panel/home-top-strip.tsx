"use client";

import { CategoryTabs } from "@/components/home/category-tabs";
import { HelpAddressBar } from "@/components/home/home-panel/help-address-bar";
import type { HelpSomeone } from "@/components/home/home-panel/use-help-someone";

/*
 Default: trade strip only.
 Help mode: quiet “Where are they?” on top.
 After confirm: address stays + trade strip below (no chip).
 Repair Pro mode: no trade strip the market is pinned to their
 own trade (server-enforced), so there is nothing to switch between.
 */
export function HomeTopStrip({
  isLight,
  isProMode,
  isMotorist,
  addressConfirmed,
  expanded,
  onExpand,
  onCollapse,
  menuOpen,
  help,
}: {
  isLight: boolean;
  isProMode: boolean;
  isMotorist: boolean;
  addressConfirmed: boolean;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  menuOpen: boolean;
  help: HelpSomeone;
}) {
  if (help.helpMode) {
    return (
      <>
        <HelpAddressBar
          isLight={isLight}
          addressConfirmed={addressConfirmed}
          help={help}
        />

        {/* After address confirm: trade options under the address field */}
        {addressConfirmed && (
          <CategoryTabs
            expanded={expanded}
            onExpand={onExpand}
            onCollapse={onCollapse}
            menuOpen={menuOpen}
          />
        )}
      </>
    );
  }
  if (isProMode) return null;
  return (
    <CategoryTabs
      expanded={expanded}
      onExpand={onExpand}
      onCollapse={onCollapse}
      onSwipeLeft={isMotorist ? help.openHelpSomeone : undefined}
      onOpenHelp={isMotorist ? help.openHelpSomeone : undefined}
      menuOpen={menuOpen}
    />
  );
}
