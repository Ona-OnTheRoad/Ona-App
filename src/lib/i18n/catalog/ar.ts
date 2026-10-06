import type { MessageDict } from "./en";
import { AR_NAV } from "./ar/nav";
import { AR_CORE } from "./ar/core";
import { AR_SETTINGS } from "./ar/settings";
import { AR_HOME } from "./ar/home";
import { AR_JOBS } from "./ar/jobs";
import { AR_ACCOUNT } from "./ar/account";
import { AR_NAVSHOP } from "./ar/navShop";
import { AR_TRADESHOP } from "./ar/tradeShop";
import { AR_SHOP } from "./ar/shop";

export const AR: MessageDict = {
  ...AR_NAV,
  ...AR_CORE,
  ...AR_SETTINGS,
  ...AR_HOME,
  ...AR_JOBS,
  ...AR_ACCOUNT,
  ...AR_NAVSHOP,
  ...AR_TRADESHOP,
  ...AR_SHOP,
};
