import { describe, expect, it } from "vitest";
import {
  KNOWN_PLACES,
  matchKnownPlaces,
  resolveKnownPlace,
  scoreKnownPlace,
} from "@/lib/known-places";

describe("known-places", () => {
  it("includes curated locations across Lagos and Nigeria", () => {
    expect(KNOWN_PLACES.length).toBeGreaterThan(30);

    const akesan = KNOWN_PLACES.find((p) => p.id === "akesan-lagos");
    expect(akesan).toBeDefined();
    expect(akesan?.name).toBe("Akesan");

    const igando = KNOWN_PLACES.find((p) => p.id === "igando-alimosho-lagos");
    expect(igando).toBeDefined();
    expect(igando?.name).toBe("Igando");

    const abuja = KNOWN_PLACES.find((p) => p.id === "abuja-cbd");
    expect(abuja).toBeDefined();

    const firstPrice = KNOWN_PLACES.find((p) => p.id === "1st-price-furniture-company");
    expect(firstPrice).toBeDefined();
  });

  it("scores and matches queries accurately", () => {
    const akesanHits = matchKnownPlaces("akesan", 3);
    expect(akesanHits.length).toBeGreaterThan(0);
    expect(akesanHits[0].place.name).toBe("Akesan");

    const igandoHits = matchKnownPlaces("igando", 3);
    expect(igandoHits.length).toBeGreaterThan(0);
    expect(igandoHits[0].place.name).toBe("Igando");

    const allenHits = matchKnownPlaces("allen avenue", 3);
    expect(allenHits.length).toBeGreaterThan(0);
    expect(allenHits[0].place.name).toContain("Allen");

    const furnitureHits = matchKnownPlaces("1st price", 3);
    expect(furnitureHits.length).toBeGreaterThan(0);
    expect(furnitureHits[0].place.name).toBe("1st Price Furniture Company");
  });

  it("resolves exact or top known place", () => {
    const resolvedAkesan = resolveKnownPlace("akesan");
    expect(resolvedAkesan).not.toBeNull();
    expect(resolvedAkesan?.name).toBe("Akesan");

    const resolvedFurniture = resolveKnownPlace("1st price furniture");
    expect(resolvedFurniture).not.toBeNull();
    expect(resolvedFurniture?.name).toBe("1st Price Furniture Company");
  });
});
