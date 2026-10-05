import type { MessageDict } from "./en";
import { SW_NAV } from "./sw/nav";
import { SW_CORE } from "./sw/core";
import { SW_SETTINGS } from "./sw/settings";
import { SW_HOME } from "./sw/home";
import { SW_JOBS } from "./sw/jobs";
import { SW_ACCOUNT } from "./sw/account";
import { SW_NAVSHOP } from "./sw/navShop";
import { SW_TRADESHOP } from "./sw/tradeShop";
import { SW_SHOP } from "./sw/shop";

export const SW: MessageDict = {
  ...SW_NAV,
  ...SW_CORE,
  ...SW_SETTINGS,
  ...SW_HOME,
  ...SW_JOBS,
  ...SW_ACCOUNT,
  ...SW_NAVSHOP,
  ...SW_TRADESHOP,
  ...SW_SHOP,
};
