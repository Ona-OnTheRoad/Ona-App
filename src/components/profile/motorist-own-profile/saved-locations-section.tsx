import type { Dispatch, SetStateAction } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { ProfileSection } from "@/components/profile/profile-shell";
import { profileTheme } from "@/lib/profile-system";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

type SavedLocations = NonNullable<UserProfile["savedLocations"]>;

export function SavedLocationsSection({
  isLight,
  editing,
  field,
  saved,
  setSaved,
  onAdd,
}: {
  isLight: boolean;
  editing: boolean;
  field: string;
  saved: SavedLocations;
  setSaved: Dispatch<SetStateAction<SavedLocations>>;
  onAdd: () => void;
}) {
  const t = profileTheme(isLight);
  return (
    <ProfileSection
      title="Saved locations"
      isLight={isLight}
      action={
        editing ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-0.5 text-[11px] font-bold text-brand"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        ) : null
      }
    >
      {saved.length === 0 ? (
        <p className={cn("text-[12px]", t.muted)}>No saved places yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {saved.map((loc) => (
            <li
              key={loc.id}
              className={cn(
                "flex items-start gap-2 rounded-xl px-2 py-2",
                isLight ? "bg-black/[0.04]" : "bg-[#2c2c2e]",
              )}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                {editing ? (
                  <input
                    className={cn(field, "h-8")}
                    value={loc.label}
                    onChange={(e) =>
                      setSaved((prev) =>
                        prev.map((x) =>
                          x.id === loc.id ? { ...x, label: e.target.value } : x,
                        ),
                      )
                    }
                  />
                ) : (
                  <p className={cn("text-[12px] font-bold", t.ink)}>
                    {loc.label}
                  </p>
                )}
                <p className={cn("truncate text-[11px]", t.muted)}>
                  {loc.address}
                </p>
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={() =>
                    setSaved((prev) => prev.filter((x) => x.id !== loc.id))
                  }
                  className="border-0 bg-transparent p-1 text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </ProfileSection>
  );
}
