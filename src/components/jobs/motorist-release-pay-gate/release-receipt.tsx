import { CheckCircle2 } from "lucide-react";

export type ReleaseReceiptData = {
  amount: string;
  pro: string;
  platform: string;
  note?: string;
};

export function ReleaseReceipt({
  receipt,
  isLight,
}: {
  receipt: ReleaseReceiptData;
  isLight: boolean;
}) {
  const ink = isLight ? "#1a1b1e" : "#ffffff";
  const card = isLight ? "#d4d5d9" : "#1c1c1e";
  return (
    <div className="absolute inset-0 z-[98] flex flex-col" role="status">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: isLight ? "#00000066" : "#000000b3" }}
      />
      <div
        className="relative z-10 m-auto flex w-[min(100%-1.5rem,360px)] flex-col items-center rounded-2xl px-5 py-6 text-center shadow-xl"
        style={{ backgroundColor: card }}
      >
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        <p className="mt-3 text-[17px] font-black" style={{ color: ink }}>
          {receipt.note?.toLowerCase().includes("process")
            ? "Processing"
            : "Released"}
        </p>
        <p
          className="mt-2 text-[13px] font-medium leading-snug opacity-80"
          style={{ color: ink }}
        >
          {receipt.note || "Payment confirmed"}
        </p>
        <p
          className="mt-3 text-[22px] font-black tabular-nums"
          style={{ color: ink }}
        >
          {receipt.amount}
        </p>
        <div
          className="mt-3 w-full space-y-1 text-[12px] font-semibold"
          style={{ color: ink }}
        >
          <p>Pro 87.5% · {receipt.pro}</p>
          <p>Ona 5% · {receipt.platform}</p>
          <p className="opacity-70">VAT 7.5% held on Flutterwave</p>
        </div>
      </div>
    </div>
  );
}
