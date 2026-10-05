import { p } from "@/lib/shop/automedics-catalog/core";
import type { AutomedicsProduct } from "@/lib/shop/automedics-catalog/core";

export const TRANSMISSION_FLUID_PRODUCTS: AutomedicsProduct[] = [
  // 3. Transmission Fluid
  p("ATM-ATF-TIV-4L", "ATF T-IV 4L", "transmission-fluid", 25000, "General"),
  p(
    "ATM-ATF-WS-4L",
    "ATF WS 4L (Mannol)",
    "transmission-fluid",
    25000,
    "General",
    "Mannol",
  ),
  p(
    "ATM-ATF-DW1",
    "DW1 Transmission Oil",
    "transmission-fluid",
    8000,
    "General",
  ),
  p("ATM-ATF-DEXRON-VI", "Dexron VI", "transmission-fluid", null, "General"),
  p(
    "ATM-ATF-DEXIII",
    "Dexiii Transmission Oil",
    "transmission-fluid",
    7000,
    "General",
  ),
];
