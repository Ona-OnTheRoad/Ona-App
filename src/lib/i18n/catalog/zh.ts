import type { MessageDict } from "./en";
import { ZH_NAV } from "./zh/nav";
import { ZH_CORE } from "./zh/core";
import { ZH_SETTINGS } from "./zh/settings";
import { ZH_HOME } from "./zh/home";
import { ZH_JOBS } from "./zh/jobs";
import { ZH_ACCOUNT } from "./zh/account";
import { ZH_NAVSHOP } from "./zh/navShop";
import { ZH_TRADESHOP } from "./zh/tradeShop";
import { ZH_SHOP } from "./zh/shop";

export const ZH: MessageDict = {
  ...ZH_NAV,
  ...ZH_CORE,
  ...ZH_SETTINGS,
  ...ZH_HOME,
  ...ZH_JOBS,
  ...ZH_ACCOUNT,
  ...ZH_NAVSHOP,
  ...ZH_TRADESHOP,
  ...ZH_SHOP,
};
