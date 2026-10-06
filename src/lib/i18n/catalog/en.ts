/**
 * Ona English master catalog source of truth for all locales.
 * Add every user-visible string here first, then translate.
 */

import { EN_NAV } from "./en/nav";
import { EN_NAVSHOP } from "./en/navShop";
import { EN_CORE } from "./en/core";
import { EN_SETTINGS } from "./en/settings";
import { EN_HOME } from "./en/home";
import { EN_TRADESHOP } from "./en/tradeShop";
import { EN_JOBS } from "./en/jobs";
import { EN_ACCOUNT } from "./en/account";
import { EN_SHOP } from "./en/shop";

export const EN = {
  ...EN_NAV,
  ...EN_NAVSHOP,
  ...EN_CORE,
  ...EN_SETTINGS,
  ...EN_HOME,
  ...EN_TRADESHOP,
  ...EN_JOBS,
  ...EN_ACCOUNT,
  ...EN_SHOP,
} as const;

export type MessageKey = keyof typeof EN;
export type MessageDict = Record<MessageKey, string>;
