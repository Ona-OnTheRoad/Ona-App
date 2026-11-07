"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { JobsTable, type AdminJobItem } from "@/components/admin/jobs/jobs-table";
import { JobsPagination } from "@/components/admin/jobs/jobs-pagination";
import { Loader2 } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toast";

const DEMO_JOBS: AdminJobItem[] = [
  {
    id: "demo-1",
    service_type: "Mechanic",
    description: "What is the main problem with your vehicle? Brake inspection",
    status: "draft",
    created_at: new Date().toISOString(),
    motorist: { full_name: "Paul Olowookere" },
    pro: null,
  },
  {
    id: "demo-2",
    service_type: "Chef",
    description: "What type of cuisine are you interested in? Italian",
    status: "expired",
    created_at: new Date().toISOString(),
    motorist: { full_name: "Daniel Zighan" },
    pro: null,
  },
  {
    id: "demo-3",
    service_type: "Electrician",
    description: "What electrical issues are you experiencing? Flickering fuse",
    status: "cancelled",
    created_at: new Date().toISOString(),
    motorist: { full_name: "Stephen Aluko" },
    pro: null,
  },
  {
    id: "demo-4",
    service_type: "Carpenter",
    description: "What woodworking project are you planning? Custom wardrobe",
    status: "completed",
    created_at: new Date().toISOString(),
    motorist: { full_name: "Victoria Wariboko" },
    pro: { full_name: "Andrew Ojo" },
  },
  {
    id: "demo-5",
    service_type: "Mechanic",
    description: "What is the main problem with your vehicle? Brake pads change",
    status: "completed",
    created_at: new Date().toISOString(),
    motorist: { full_name: "Joshua Adebayo" },
    pro: { full_name: "Samuel Diongoli" },
  },
  {
    id: "demo-6",
    service_type: "Gardener",
    description: "What gardening challenge are you facing? Pests in shrubs",
    status: "failed",
    created_at: new Date().toISOString(),
    motorist: { full_name: "Esther Garba" },
    pro: null,
  },
  {
    id: "demo-7",
    service_type: "Plumber",
    description: "What plumbing issue do you need help with? Leaking kitchen pipe",
    status: "completed",
    created_at: new Date().toISOString(),
    motorist: { full_name: "James Tukur" },
    pro: { full_name: "Sarah Oyedepo" },
  },
  {
    id: "demo-8",
    service_type: "Fitness Trainer",
    description: "What fitness goals are you aiming for? Weight loss and strength",
    status: "completed",
    created_at: new Date().toISOString(),
    motorist: { full_name: "Philip Maiwada" },
    pro: { full_name: "Samuel Pepple" },
  },
  {
    id: "demo-9",
    service_type: "Teacher",
    description: "What subject do you need tutoring in? Mathematics & Physics",
    status: "completed",
    created_at: new Date().toISOString(),
    motorist: { full_name: "Esther Akinyemi" },
    pro: { full_name: "Elizabeth Ogan" },
  },
  {
    id: "demo-10",
    service_type: "Web Developer",
    description: "What website issue are you encountering? Slow landing page speed",
    status: "completed",
    created_at: new Date().toISOString(),
    motorist: { full_name: "Andrew Nwanze" },
    pro: { full_name: "Esther Garba" },
  },
];

const ITEMS_PER_PAGE = 10;

export default function AdminJobsPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [jobs, setJobs] = useState<AdminJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/requests");
      const json = await res.json();
      if (!json.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login");
          return;
        }
        // Fallback to demo jobs if API table isn't seeded yet
        setJobs(DEMO_JOBS);
        return;
      }
      const fetched: AdminJobItem[] = json.data.requests || [];
      setJobs(fetched.length > 0 ? fetched : DEMO_JOBS);
    } catch {
      setJobs(DEMO_JOBS);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/admin/auth/me");
        const meJson = await me.json();
        if (!meJson.ok) {
          router.replace("/admin/login");
          return;
        }
        setAdminName(meJson.data.fullName || meJson.data.email);
      } catch {
        // Continue with default
      }
      await load();
    })();
  }, [load, router]);

  async function handleUpdateStatus(id: string, status: string) {
    setUpdatingId(id);

    try {
      // Optimistic update
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status } : j)),
      );

      // Only attempt remote save if not demo id
      if (!id.startsWith("demo-")) {
        const res = await fetch("/api/admin/requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        const json = await res.json();
        if (!json.ok) {
          toastError(json.error?.message || "Failed to update job status");
          await load();
          return;
        }
      }
      toastSuccess(`Saved job status → ${status}`);
    } catch {
      toastError("Network error while updating status");
    } finally {
      setUpdatingId(null);
    }
  }

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(jobs.length / ITEMS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return jobs.slice(start, start + ITEMS_PER_PAGE);
  }, [jobs, currentPage]);

  return (
    <AdminShell
      adminName={adminName}
      title="Jobs"
      subtitle="Active service jobs, progress, and completions."
      guideKey="jobs"
    >
      {/* Main Jobs Card Container */}
      <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header Title */}
        <div className="px-6 pt-5 pb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
            Active Jobs
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-ona-brand" />
            Loading active jobs…
          </div>
        ) : (
          <>
            {/* Table extending edge-to-edge */}
            <JobsTable
              jobs={paginatedJobs}
              updatingId={updatingId}
              onUpdateStatus={handleUpdateStatus}
            />

            {/* Pagination Controls */}
            <div className="px-6 py-4">
              <JobsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
