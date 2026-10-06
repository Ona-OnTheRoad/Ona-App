import type { MessageDict } from "./en";
import { FR_NAV } from "./fr/nav";
import { FR_CORE } from "./fr/core";
import { FR_SETTINGS } from "./fr/settings";
import { FR_HOME } from "./fr/home";
import { FR_JOBS } from "./fr/jobs";
import { FR_ACCOUNT } from "./fr/account";
import { FR_NAVSHOP } from "./fr/navShop";
import { FR_TRADESHOP } from "./fr/tradeShop";
import { FR_SHOP } from "./fr/shop";

export const FR: MessageDict = {
  ...FR_NAV,
  ...FR_CORE,
  ...FR_SETTINGS,
  ...FR_HOME,
  ...FR_JOBS,
  ...FR_ACCOUNT,
  ...FR_NAVSHOP,
  ...FR_TRADESHOP,
  ...FR_SHOP,
};
