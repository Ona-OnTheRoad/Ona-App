import { OverlayViewF, OVERLAY_MOUSE_TARGET } from "@react-google-maps/api";
import { tradeIconDataUrl } from "@/lib/map-trade-icons";

/**
 * Pro pin on trip map solid Message-orange trade icon.
 * Pulses only while the pro is actively on the trip (en route / arrived / working).
 */
export function ProMapPin({
  position,
  label,
  serviceType,
  active = true,
}: {
  position: { lat: number; lng: number };
  label: string;
  serviceType: string;
  active?: boolean;
}) {
  const size = 30;
  const box = 32;
  const icon = tradeIconDataUrl(serviceType, {
    size,
    selected: true,
    flat: true,
  });
  return (
    <OverlayViewF
      position={position}
      mapPaneName={OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(w, h) => ({
        x: -(w ?? box) / 2,
        y: -(h ?? box) / 2,
      })}
    >
      <div
        className="relative border-0 bg-transparent"
        style={{ width: box, height: box }}
        title={label}
        aria-label={label}
      >
        <span
          className="absolute left-1/2 top-1/2 flex items-center justify-center"
          style={{
            width: size,
            height: size,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            loading="lazy"
            decoding="async"
            src={icon}
            alt=""
            width={size}
            height={size}
            className={
              active
                ? "om-live-glyph om-live-glyph--pulse block border-0"
                : "om-live-glyph block border-0"
            }
            style={{
              width: size,
              height: size,
              filter: "none",
              display: "block",
            }}
            draggable={false}
          />
        </span>
      </div>
    </OverlayViewF>
  );
}
