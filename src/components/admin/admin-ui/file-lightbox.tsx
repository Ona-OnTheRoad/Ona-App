"use client";

export function FileLightbox({
  label,
  view,
  isVideo,
  isPdf,
  offline,
  onClose,
  onImageError,
}: {
  label: string;
  view: string;
  isVideo: boolean;
  isPdf: boolean;
  offline: boolean;
  onClose: () => void;
  onImageError: () => void;
}) {
  return (
    <div
      className="om-admin-doc-lightbox"
      role="dialog"
      aria-modal
      aria-label={`View ${label}`}
      onClick={() => onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: 960,
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span>
          {label}
          {isVideo ? " · video" : isPdf ? " · PDF" : " · image"}
          {offline ? " · offline" : " · view only"}
        </span>
        <button
          type="button"
          className="om-admin-btn ghost"
          onClick={() => onClose()}
          style={{ color: "#fff" }}
        >
          Close
        </button>
      </div>
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 960,
          maxHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isPdf ? (
          <iframe
            title={label}
            src={view}
            style={{
              width: "100%",
              height: "min(80vh, 900px)",
              border: 0,
              borderRadius: 8,
              background: "#111",
            }}
          />
        ) : isVideo ? (
          <video
            src={view}
            controls
            playsInline
            autoPlay={false}
            style={{
              width: "100%",
              maxHeight: "min(80vh, 900px)",
              borderRadius: 8,
              background: "#000",
            }}
          >
            Video preview unavailable
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            decoding="async"
            src={view}
            alt={label}
            style={{
              maxWidth: "100%",
              maxHeight: "min(80vh, 900px)",
              objectFit: "contain",
              borderRadius: 8,
            }}
            onError={onImageError}
          />
        )}
      </div>
    </div>
  );
}
