-- 085: record when the bank confirmed the holder name of a payout / refund account.
--
-- bank_account_name used to be whatever the client sent. From this migration the
-- server stores the name the bank returns (Flutterwave account resolve) and stamps
-- bank_account_resolved_at. NULL means the name on the row is self-declared (every
-- row that predates this migration) or the bank could not be asked yet; such an
-- account is resolved before anything is paid to it.

alter table public.motorist_profiles
  add column if not exists bank_account_resolved_at timestamptz;

alter table public.repair_pro_profiles
  add column if not exists bank_account_resolved_at timestamptz;

comment on column public.motorist_profiles.bank_account_resolved_at is
  'When the bank confirmed bank_account_name for the stored bank code + number. NULL = not confirmed.';
comment on column public.repair_pro_profiles.bank_account_resolved_at is
  'When the bank confirmed bank_account_name for the stored bank code + number. NULL = not confirmed.';
