import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** "Chat with X" title and the other party's card. */
export function ChatPeerHeader({
  title,
  subtitle,
  photo,
}: {
  title: string;
  subtitle?: string;
  photo?: string | null;
}) {
  return (
    <div className="px-5 pt-1">
      <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ona-ink">
        Chat with {title}
      </h1>
      <div className="mt-3 flex items-center gap-3 rounded-ona-card border border-ona-border bg-ona-surface p-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={photo || undefined} alt="" />
          <AvatarFallback>
            {(title || "?").trim().charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ona-ink">
            {title}
          </p>
          <p className="truncate text-[12px] text-ona-muted">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
