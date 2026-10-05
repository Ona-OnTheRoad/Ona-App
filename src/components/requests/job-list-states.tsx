import { Loader2 } from "lucide-react";

export function JobListLoading() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
    </div>
  );
}

export function JobListError({ message }: { message: string }) {
  return (
    <p className="py-4 text-center text-[12px] font-semibold text-red-500">
      {message}
    </p>
  );
}
