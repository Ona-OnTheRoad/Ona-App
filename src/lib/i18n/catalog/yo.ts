import type { MessageDict } from "./en";
import { YO_NAV } from "./yo/nav";
import { YO_CORE } from "./yo/core";
import { YO_SETTINGS } from "./yo/settings";
import { YO_HOME } from "./yo/home";
import { YO_JOBS } from "./yo/jobs";
import { YO_ACCOUNT } from "./yo/account";
import { YO_NAVSHOP } from "./yo/navShop";
import { YO_TRADESHOP } from "./yo/tradeShop";
import { YO_SHOP } from "./yo/shop";

export const YO: MessageDict = {
  ...YO_NAV,
  ...YO_CORE,
  ...YO_SETTINGS,
  ...YO_HOME,
  ...YO_JOBS,
  ...YO_ACCOUNT,
  ...YO_NAVSHOP,
  ...YO_TRADESHOP,
  ...YO_SHOP,
};
