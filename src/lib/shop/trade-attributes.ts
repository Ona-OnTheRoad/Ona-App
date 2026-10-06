/**
 * ONA Shop trade-specific dynamic attributes (Phase 2).
 *
 * Shared server + client module. Each of the 14 trades has its own attribute
 * dictionary for validation, filters, and fixtures.
 *
 * Vehicle fitment attributes are ONLY valid for vehicle-based trades;
 * solar/plumber/carpenter/painter/generator/fashion never require them.
 */

import type { TradeAttributeSchema } from "./trade-attributes/types";
import { VEHICLE_CORE_SCHEMAS } from "./trade-attributes/schemas-vehicle-core";
import { VEHICLE_BODY_SCHEMAS } from "./trade-attributes/schemas-vehicle-body";
import { CRAFT_SCHEMAS } from "./trade-attributes/schemas-craft";
import { ENERGY_SCHEMAS } from "./trade-attributes/schemas-energy";

export type {
  TradeAttributeType,
  TradeAttributeDef,
  TradeAttributeSchema,
} from "./trade-attributes/types";

export const TRADE_ATTRIBUTE_SCHEMAS: TradeAttributeSchema[] = [
  ...VEHICLE_CORE_SCHEMAS,
  ...VEHICLE_BODY_SCHEMAS,
  ...CRAFT_SCHEMAS,
  ...ENERGY_SCHEMAS,
];

const SCHEMA_BY_TRADE = new Map<string, TradeAttributeSchema>(
  TRADE_ATTRIBUTE_SCHEMAS.map((s) => [s.tradeKey, s]),
);

export function getTradeAttributeSchema(
  tradeKey: string,
): TradeAttributeSchema | null {
  return SCHEMA_BY_TRADE.get(tradeKey) ?? null;
}

export function isVehicleFitmentAttribute(key: string): boolean {
  return [
    "vehicleMake",
    "vehicleModel",
    "vehicleYear",
    "position",
    "engine",
  ].includes(key);
}

/** All attribute keys valid for a trade. */
export function tradeAttributeKeys(tradeKey: string): Set<string> {
  return new Set(
    (getTradeAttributeSchema(tradeKey)?.attributes ?? []).map((a) => a.key),
  );
}

/**
 * Trade-aware attribute validation.
 * Returns errors for: unknown attributes, forbidden vehicle fitment on
 * non-vehicle trades, required-but-missing attributes.
 */
export function validateTradeAttributes(
  tradeKey: string,
  attributes: Record<string, unknown>,
): { valid: boolean; errors: string[] } {
  const schema = getTradeAttributeSchema(tradeKey);
  if (!schema) return { valid: false, errors: [`Unknown trade: ${tradeKey}`] };

  const errors: string[] = [];
  const allowed = new Set(schema.attributes.map((a) => a.key));

  for (const [key, value] of Object.entries(attributes || {})) {
    if (value === undefined || value === null || value === "") continue;
    if (!allowed.has(key)) {
      errors.push(`Attribute "${key}" is not valid for trade "${tradeKey}"`);
    }
  }

  if (schema.vehicleForbidden) {
    for (const key of Object.keys(attributes || {})) {
      if (isVehicleFitmentAttribute(key)) {
        errors.push(
          `Vehicle fitment attribute "${key}" is not allowed for trade "${tradeKey}"`,
        );
      }
    }
  }

  for (const def of schema.attributes) {
    if (!def.required) continue;
    const v = attributes?.[def.key];
    if (v === undefined || v === null || v === "") {
      errors.push(
        `Attribute "${def.key}" (${def.label}) is required for trade "${tradeKey}"`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
