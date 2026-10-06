/**
 * Browse categories on home.
 * Real trades match Repair Pro signup (exclude "all").
 */
export type ServiceCategory =
  | "mechanic"
  | "vulcanizer"
  | "towing"
  | "battery"
  | "ac"
  | "body"
  | "electrical"
  | "diagnostics"
  | "fashion"
  | "plumber"
  | "carpenter"
  | "painter"
  | "solar"
  | "generator"
  | "all"
  /** Home start: no trade tapped yet */
  | "none";

/**
 * Services a professional can register / offer.
 * Matches home service cards (excludes "All").
 */
export type ProService =
  | "mechanic"
  | "vulcanizer"
  | "towing"
  | "battery"
  | "ac"
  | "body"
  | "electrical"
  | "diagnostics"
  | "fashion"
  | "plumber"
  | "carpenter"
  | "painter"
  | "solar"
  | "generator";

/**
 * What the user registered as.
 * Determines the first screen on app open.
 * Pros can still add more services later.
 */
export type RegisteredAs = "client" | ProService;

/** Current session view: client discovery vs professional tools */
export type UserMode = "client" | "professional";

/** Account type chosen on login / sign-up */
export type AccountType = "motorist" | "professional";
