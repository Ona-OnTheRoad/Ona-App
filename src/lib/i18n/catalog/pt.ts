import type { MessageDict } from "./en";
import { PT_NAV } from "./pt/nav";
import { PT_CORE } from "./pt/core";
import { PT_SETTINGS } from "./pt/settings";
import { PT_HOME } from "./pt/home";
import { PT_JOBS } from "./pt/jobs";
import { PT_ACCOUNT } from "./pt/account";
import { PT_NAVSHOP } from "./pt/navShop";
import { PT_TRADESHOP } from "./pt/tradeShop";
import { PT_SHOP } from "./pt/shop";

export const PT: MessageDict = {
  ...PT_NAV,
  ...PT_CORE,
  ...PT_SETTINGS,
  ...PT_HOME,
  ...PT_JOBS,
  ...PT_ACCOUNT,
  ...PT_NAVSHOP,
  ...PT_TRADESHOP,
  ...PT_SHOP,
};
