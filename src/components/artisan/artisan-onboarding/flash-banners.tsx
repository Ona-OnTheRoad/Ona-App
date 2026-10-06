import { cn } from "@/lib/utils";
import type { OnboardingStyles } from "./types";

/** Error + success banners at the top of the scroll body */
export function FlashBanners({
  err,
  msg,
  styles,
}: {
  err: string | null;
  msg: string | null;
  styles: Pick<OnboardingStyles, "errBox" | "msgBox">;
}) {
  return (
    <>
      {err ? (
        <p
          className={cn(
            "mb-2 rounded-md px-3 py-2 text-[12px] font-semibold",
            styles.errBox,
          )}
        >
          {err}
        </p>
      ) : null}
      {msg ? (
        <p
          className={cn(
            "mb-2 rounded-md px-3 py-2 text-[12px] font-semibold",
            styles.msgBox,
          )}
        >
          {msg}
        </p>
      ) : null}
    </>
  );
}
