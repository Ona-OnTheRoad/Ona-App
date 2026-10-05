import { useEffect, useMemo, useState } from "react";
import { SCHEDULE_MAX_MS } from "./constants";
import type { BookingType } from "./types";

/** Booking type + scheduled date/time capture and validation. */
export function useExpressSchedule() {
  const [bookingType, setBookingType] = useState<BookingType>("instant");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");

  const scheduleIso = useMemo(() => {
    if (bookingType !== "scheduled" || !schedDate || !schedTime) return null;
    return new Date(`${schedDate}T${schedTime}:00`).toISOString();
  }, [bookingType, schedDate, schedTime]);

  const [nowTs, setNowTs] = useState(0);
  useEffect(() => {
    setNowTs(Date.now());
  }, []);

  const scheduleValid = useMemo(() => {
    if (!scheduleIso) return false;
    const t = Date.parse(scheduleIso);
    if (!Number.isFinite(t)) return false;
    if (!nowTs) return false;
    return t >= nowTs - 60_000 && t - nowTs <= SCHEDULE_MAX_MS;
  }, [scheduleIso, nowTs]);

  return {
    bookingType,
    setBookingType,
    schedDate,
    setSchedDate,
    schedTime,
    setSchedTime,
    scheduleIso,
    scheduleValid,
    nowTs,
  };
}
