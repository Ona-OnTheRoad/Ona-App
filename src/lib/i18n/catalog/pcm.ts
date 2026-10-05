import type { MessageDict } from "./en";
import { PCM_NAV } from "./pcm/nav";
import { PCM_CORE } from "./pcm/core";
import { PCM_SETTINGS } from "./pcm/settings";
import { PCM_HOME } from "./pcm/home";
import { PCM_JOBS } from "./pcm/jobs";
import { PCM_ACCOUNT } from "./pcm/account";
import { PCM_NAVSHOP } from "./pcm/navShop";
import { PCM_TRADESHOP } from "./pcm/tradeShop";
import { PCM_SHOP } from "./pcm/shop";

export const PCM: MessageDict = {
  ...PCM_NAV,
  ...PCM_CORE,
  ...PCM_SETTINGS,
  ...PCM_HOME,
  ...PCM_JOBS,
  ...PCM_ACCOUNT,
  ...PCM_NAVSHOP,
  ...PCM_TRADESHOP,
  ...PCM_SHOP,
};
