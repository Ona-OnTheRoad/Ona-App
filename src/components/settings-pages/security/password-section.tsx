"use client";

import { PasswordInput } from "@/components/ui/password-input";
import {
  SettingsField,
  SettingsSaveBar,
  settingsInputClass,
} from "@/components/settings/settings-ui";
import { passwordChecklist } from "@/lib/signup-validation";
import { cn } from "@/lib/utils";
import type { useChangePassword } from "./use-change-password";

type Props = {
  isLight: boolean;
  card: string;
  ink: string;
  pw: ReturnType<typeof useChangePassword>;
};

export function PasswordSection({ isLight, card, ink, pw }: Props) {
  const {
    current,
    setCurrent,
    next,
    setNext,
    confirm,
    setConfirm,
    msg,
    err,
    busy,
    rules,
    changePassword,
  } = pw;
  return (
    <div className={cn("overflow-hidden rounded-md", card)}>
      <p className={cn("px-3 pt-3 text-[12px] font-bold", ink)}>
        Change password
      </p>
      <SettingsField label="Current password" isLight={isLight}>
        <PasswordInput
          className={settingsInputClass(isLight)}
          value={current}
          onChange={setCurrent}
          isLight={isLight}
          autoComplete="current-password"
        />
      </SettingsField>
      <SettingsField label="New password" isLight={isLight}>
        <PasswordInput
          className={settingsInputClass(isLight)}
          value={next}
          onChange={setNext}
          isLight={isLight}
          autoComplete="new-password"
        />
      </SettingsField>
      <ul className="space-y-0.5 px-3 pb-1 text-[10px] font-medium">
        {passwordChecklist(next).map(({ text: label, ok }) => (
          <li
            key={label}
            className={
              ok
                ? "text-emerald-600"
                : isLight
                  ? "text-slate-500"
                  : "text-white/40"
            }
          >
            {ok ? "✓" : "·"} {label}
          </li>
        ))}
      </ul>
      <SettingsField label="Confirm new password" isLight={isLight}>
        <PasswordInput
          className={settingsInputClass(isLight)}
          value={confirm}
          onChange={setConfirm}
          isLight={isLight}
          autoComplete="new-password"
        />
      </SettingsField>
      <SettingsSaveBar
        isLight={isLight}
        busy={busy}
        msg={msg}
        err={err}
        onSave={changePassword}
        label="Update password"
      />
    </div>
  );
}
