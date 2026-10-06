import type { MessageDict } from "./en";
import { HA_NAV } from "./ha/nav";
import { HA_CORE } from "./ha/core";
import { HA_SETTINGS } from "./ha/settings";
import { HA_HOME } from "./ha/home";
import { HA_JOBS } from "./ha/jobs";
import { HA_ACCOUNT } from "./ha/account";
import { HA_NAVSHOP } from "./ha/navShop";
import { HA_TRADESHOP } from "./ha/tradeShop";
import { HA_SHOP } from "./ha/shop";

export const HA: MessageDict = {
  ...HA_NAV,
  ...HA_CORE,
  ...HA_SETTINGS,
  ...HA_HOME,
  ...HA_JOBS,
  ...HA_ACCOUNT,
  ...HA_NAVSHOP,
  ...HA_TRADESHOP,
  ...HA_SHOP,
};
