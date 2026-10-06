import { useState } from "react";
import { DEFAULT_RADIUS_KM } from "@/lib/matching";
import type {
  AppFilters,
  Booking,
  MessageThread,
  ServiceCategory,
  ServiceRequest,
  Technician,
} from "@/lib/types";
import { defaultFilters } from "./constants";
import { readInitialLocation } from "./storage";

export function useMarketState() {
  const [location, setLocation] = useState(readInitialLocation);
  const [radiusKm, setRadiusKmState] = useState(DEFAULT_RADIUS_KM);
  const [category, setCategoryState] = useState<ServiceCategory>("none");
  const [specialtyFilter, setSpecialtyFilterState] = useState<string | null>(
    null,
  );
  const [specialtyPickerOpen, setSpecialtyPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<AppFilters>(defaultFilters);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  // Start empty no demo seed payload on first paint (faster load)
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [bookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  /** Live pros from Supabase (null = use demo seed) */
  const [cloudTechs, setCloudTechs] = useState<Technician[] | null>(null);
  return {
    location,
    setLocation,
    radiusKm,
    setRadiusKmState,
    category,
    setCategoryState,
    specialtyFilter,
    setSpecialtyFilterState,
    specialtyPickerOpen,
    setSpecialtyPickerOpen,
    query,
    setQuery,
    filters,
    setFilters,
    selectedTechId,
    setSelectedTechId,
    requests,
    setRequests,
    bookings,
    messages,
    setMessages,
    locationError,
    setLocationError,
    isLocating,
    setIsLocating,
    cloudTechs,
    setCloudTechs,
  };
}

export type MarketStateResult = ReturnType<typeof useMarketState>;
