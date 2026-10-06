import type { Booking, MessageThread, ServiceRequest } from "@/lib/types";

export const INITIAL_REQUESTS: ServiceRequest[] = [
  {
    id: "r1",
    technicianId: "t2",
    technicianName: "Bola T.",
    serviceType: "vulcanizer",
    problem: "Flat tyre (front right)",
    status: "en_route",
    createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    etaMinutes: 5,
    distanceKm: 2.9,
    locationLabel: "Ikeja, Lagos",
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "b1",
    technicianName: "Ikechukwu A.",
    serviceType: "mechanic",
    date: "2026-07-15",
    time: "10:00 AM",
    status: "upcoming",
    locationLabel: "Allen Avenue, Ikeja",
  },
  {
    id: "b2",
    technicianName: "Chinedu O.",
    serviceType: "towing",
    date: "2026-07-02",
    time: "3:30 PM",
    status: "completed",
    locationLabel: "Lekki Phase 1",
  },
];

export const INITIAL_MESSAGES: MessageThread[] = [
  {
    id: "m1",
    requestId: "demo-r1",
    technicianId: "t2",
    technicianName: "Bola T.",
    motoristName: "You",
    serviceType: "vulcanizer",
    lastMessage: "I'm 5 minutes away. Stay put!",
    time: "2m",
    unread: 2,
    photo: "/technicians/t2.jpg",
    messages: [
      {
        id: "m1-1",
        sender: "motorist",
        text: "Flat tire on Allen Avenue. Can you come?",
        at: new Date(Date.now() - 12 * 60_000).toISOString(),
      },
      {
        id: "m1-2",
        sender: "professional",
        text: "I'm 5 minutes away. Stay put!",
        at: new Date(Date.now() - 2 * 60_000).toISOString(),
      },
    ],
  },
  {
    id: "m2",
    requestId: "demo-r2",
    technicianId: "t1",
    technicianName: "Ikechukwu A.",
    motoristName: "You",
    serviceType: "mechanic",
    lastMessage: "Your booking is confirmed for Tuesday.",
    time: "1h",
    unread: 0,
    photo: "/technicians/t1.jpg",
    messages: [
      {
        id: "m2-1",
        sender: "professional",
        text: "Your booking is confirmed for Tuesday.",
        at: new Date(Date.now() - 60 * 60_000).toISOString(),
      },
    ],
  },
];
