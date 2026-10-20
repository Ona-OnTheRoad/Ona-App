"use client";

interface Tier2NinInputProps {
  value: string;
  onChange: (value: string) => void;
  isLight?: boolean;
}

export function Tier2NinInput({
  value,
  onChange,
}: Tier2NinInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    onChange(digits);
  };

  return (
    <div>
      <label
        htmlFor="verify-id-number"
        className="block text-[12px] font-medium mb-1.5 text-ona-ink"
      >
        NIN number
      </label>
      <input
        id="verify-id-number"
        value={value}
        onChange={handleChange}
        placeholder="Enter your 11-digit NIN"
        maxLength={11}
        inputMode="numeric"
        className="w-full rounded-ona-ctl border border-ona-border bg-ona-field px-4 py-3.5 text-[12px] font-normal text-ona-ink placeholder:text-ona-muted transition-colors focus:outline-none focus:border-ona-ink"
      />
      <p className="text-[12px] mt-2 leading-snug text-ona-muted">
        Dial *346# on the phone number you used for NIN registration.
      </p>
    </div>
  );
}
