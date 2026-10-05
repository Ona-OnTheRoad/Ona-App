export function automedicsImageUrl(imageKey: string): string {
  return `/shop/automedics/${imageKey}.jpg`;
}

export function parseVehicleFitment(vehicle: string): {
  vehicleLabel: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehicleGeneral: boolean;
  vehicleTags: string[];
} {
  const label = vehicle.trim();
  const general = /^general$/i.test(label) || /^various$/i.test(label);
  const tags = label
    .split(/,|&|\//)
    .map((t) => t.trim())
    .filter(Boolean);
  const yearMatch = label.match(/\b(19|20)\d{2}\b/);
  const makes = [
    "Toyota",
    "Honda",
    "Lexus",
    "Nissan",
    "Hyundai",
    "Ford",
    "Mitsubishi",
    "Acura",
  ];
  const make = makes.find((m) => label.toLowerCase().includes(m.toLowerCase()));
  let model: string | null = null;
  if (make) {
    const after = label
      .slice(label.toLowerCase().indexOf(make.toLowerCase()) + make.length)
      .trim();
    const modelTok = after.split(/\s+/)[0];
    if (modelTok && !/^\d/.test(modelTok) && modelTok.toLowerCase() !== "and") {
      model = modelTok.replace(/,$/, "");
    }
  }
  return {
    vehicleLabel: label,
    vehicleMake: make ?? null,
    vehicleModel: model,
    vehicleYear: yearMatch ? Number(yearMatch[0]) : null,
    vehicleGeneral: general,
    vehicleTags: general ? ["General"] : tags,
  };
}
