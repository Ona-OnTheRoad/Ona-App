"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";
import { toastError } from "@/lib/toast";
import {
  ReviewsTable,
  type ReviewRow,
} from "@/components/admin/reviews/reviews-table";
import { Loader2 } from "lucide-react";

export default function AdminReviewsPage() {
  const { adminName, ready, api } = useAdminGate();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function loadReviews() {
      setLoading(true);
      const res = await api<{ reviews: ReviewRow[] }>("/api/admin/reviews");
      if (cancelled) return;
      if (!res.ok) {
        toastError(res.message);
        setLoading(false);
        return;
      }
      setReviews(res.data.reviews || []);
      setLoading(false);
    }

    void loadReviews();
    return () => {
      cancelled = true;
    };
  }, [ready, api]);

  return (
    <AdminShell
      adminName={adminName}
      title="Reviews"
      subtitle="Rating moderation and pro scorecards"
      guideKey="reviews"
    >
      <div className="w-full pb-16">
        {/* Loading state to eliminate empty-state flash */}
        {!ready || loading ? (
          <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-ona-brand mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Loading reviews...
            </p>
          </div>
        ) : (
          <ReviewsTable reviews={reviews} />
        )}
      </div>
    </AdminShell>
  );
}
