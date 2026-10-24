"use client";

import { ProSignupV2 } from "./pro-signup/v2/pro-signup-v2";

/**
 * Repair Pro v2 5-step registration wizard:
 * 1. Base Location (City, Area, Radius)
 * 2. Repair Service (Trade, Focus, Workshop, Experience, Bio)
 * 3. Vehicles you fix (Any type vs Specific vehicle list)
 * 4. Guarantor (First/Last name, Phone, Occupation, Address, Relationship)
 * 5. Bank Account (Bank, Account number, Name resolution, Continue, Skip)
 */
export function ProSignup() {
  return <ProSignupV2 />;
}
