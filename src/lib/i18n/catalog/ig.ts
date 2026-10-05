import type { MessageDict } from "./en";
import { IG_NAV } from "./ig/nav";
import { IG_CORE } from "./ig/core";
import { IG_SETTINGS } from "./ig/settings";
import { IG_HOME } from "./ig/home";
import { IG_JOBS } from "./ig/jobs";
import { IG_ACCOUNT } from "./ig/account";
import { IG_NAVSHOP } from "./ig/navShop";
import { IG_TRADESHOP } from "./ig/tradeShop";
import { IG_SHOP } from "./ig/shop";

export const IG: MessageDict = {
  ...IG_NAV,
  ...IG_CORE,
  ...IG_SETTINGS,
  ...IG_HOME,
  ...IG_JOBS,
  ...IG_ACCOUNT,
  ...IG_NAVSHOP,
  ...IG_TRADESHOP,
  ...IG_SHOP,
};
