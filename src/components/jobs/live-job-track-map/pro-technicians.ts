import type { JobRecord } from "@/lib/jobs/types";
import type { Technician } from "@/lib/types";

/** Single-pro technician list for the OSM fallback map (empty until pro GPS is known). */
export function tripProTechnicians(
  job: JobRecord,
  proLocation: { lat: number; lng: number } | null | undefined,
): Technician[] {
  return proLocation
    ? [
        {
          id: job.repairProId,
          name: job.repairProName,
          shortName: job.repairProName.split(" ")[0] || "Pro",
          serviceType: job.serviceType,
          roleLabel: "Repair Pro",
          photo: job.repairProPhoto || "",
          rating: 5,
          reviewCount: 0,
          distanceKm: job.distanceKm ?? 0,
          etaMinutes: job.etaMinutes ?? 0,
          status: "available" as const,
          verified: true,
          fastResponse: true,
          specialties: [],
          description: "",
          phone: "",
          serviceRadiusKm: 5,
          location: proLocation,
          responseSpeedScore: 1,
          currentLoad: 0,
        },
      ]
    : [];
}
