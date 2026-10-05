import type { MessageDict } from "./en";
import { ES_NAV } from "./es/nav";
import { ES_CORE } from "./es/core";
import { ES_SETTINGS } from "./es/settings";
import { ES_HOME } from "./es/home";
import { ES_JOBS } from "./es/jobs";
import { ES_ACCOUNT } from "./es/account";
import { ES_NAVSHOP } from "./es/navShop";
import { ES_TRADESHOP } from "./es/tradeShop";
import { ES_SHOP } from "./es/shop";

export const ES: MessageDict = {
  ...ES_NAV,
  ...ES_CORE,
  ...ES_SETTINGS,
  ...ES_HOME,
  ...ES_JOBS,
  ...ES_ACCOUNT,
  ...ES_NAVSHOP,
  ...ES_TRADESHOP,
  ...ES_SHOP,
};
