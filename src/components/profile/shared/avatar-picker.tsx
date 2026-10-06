"use client";

import type { RefObject } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadProfileAvatar } from "@/components/profile/shared/upload-avatar";
import { avatarInitials, DEFAULT_VENDOR_PHOTO } from "@/lib/brand";

/** Round avatar button; clickable only while editing. */
export function AvatarPickerButton({
  editing,
  avatarUrl,
  fullName,
  onPick,
}: {
  editing: boolean;
  avatarUrl: string;
  fullName: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!editing}
      onClick={onPick}
      className="relative shrink-0 border-0 bg-transparent p-0"
    >
      <Avatar className="h-[72px] w-[72px] overflow-hidden rounded-full">
        <AvatarImage
          src={avatarUrl || DEFAULT_VENDOR_PHOTO}
          alt={fullName}
          className="object-cover"
        />
        <AvatarFallback className="bg-brand font-bold text-white">
          {avatarInitials(fullName)}
        </AvatarFallback>
      </Avatar>
      {editing && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white">
          <Camera className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}

/** Hidden file input that uploads the chosen avatar image. */
export function AvatarFileInput({
  fileRef,
  accessToken,
  onUrl,
  onError,
}: {
  fileRef: RefObject<HTMLInputElement | null>;
  accessToken: string;
  onUrl: (url: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        await uploadProfileAvatar(f, accessToken, onUrl, onError);
      }}
    />
  );
}
