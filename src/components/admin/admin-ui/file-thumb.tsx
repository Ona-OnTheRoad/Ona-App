"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { cacheDocUrl, proxyDocUrl, readCachedDoc } from "./doc-cache";
import { adminDocViewHref, type AdminDocKind } from "./doc-href";
import { FileLightbox } from "./file-lightbox";

/** Thumbnail for uploaded ID / cert / portfolio proxy + lightbox for proper view */
export function FileThumb({
  label,
  url,
  size = "sm",
  userId,
  kind,
}: {
  label: string;
  url: string | null | undefined;
  size?: "sm" | "md" | "lg";
  /** When set with kind, admin proxy loads from DB even if raw URL fails */
  userId?: string | null;
  kind?: AdminDocKind;
}) {
  const dim = size === "lg" ? 160 : size === "md" ? 96 : 48;
  const [src, setSrc] = useState<string | null>(url || null);
  const [offline, setOffline] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!url && !(userId && kind)) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    setFailed(false);
    const initial = adminDocViewHref(url, { userId, kind }) || null;
    setSrc(initial);
    void (async () => {
      if (url) {
        const cached = await readCachedDoc(url);
        if (cancelled) return;
        if (cached) {
          setSrc(cached);
          setOffline(true);
          return;
        }
      }
      const fresh = await cacheDocUrl(url || "", { userId, kind });
      if (cancelled) return;
      if (fresh) {
        setSrc(fresh);
        setOffline(true);
      } else if (!initial) {
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, userId, kind]);

  if (!url && !(userId && kind)) {
    return (
      <div
        className="om-admin-file-empty"
        style={{ width: dim, height: Math.round(dim * 0.72) }}
        title={`No ${label}`}
      >
        <span>{label}</span>
      </div>
    );
  }
  const view = src || adminDocViewHref(url, { userId, kind });
  const isPdf =
    (url && /\.pdf(\?|$)/i.test(url)) ||
    (url && url.includes("application/pdf")) ||
    Boolean(url && url.startsWith("data:application/pdf")) ||
    (view && view.includes("pdf") && !view.includes("video"));
  const isVideo =
    Boolean(url && url.startsWith("data:video")) ||
    Boolean(url && /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url)) ||
    Boolean(url && /video\//i.test(url || "")) ||
    Boolean(
      label &&
      /video|intro/i.test(label) &&
      view &&
      !isPdf &&
      !view.startsWith("data:image"),
    );
  const isImage =
    !isPdf &&
    !isVideo &&
    (view.startsWith("data:image") ||
      view.startsWith("blob:") ||
      Boolean(
        url &&
        (/\.(jpe?g|png|gif|webp|heic)(\?|$)/i.test(url) ||
          url.includes("image") ||
          url.startsWith("data:image")),
      ) ||
      // Proxy often serves images without extension in the path
      Boolean(view.includes("/api/admin/docs")));

  if (failed && !view) {
    return (
      <div
        className="om-admin-file-empty"
        style={{ width: dim, height: Math.round(dim * 0.72) }}
      >
        <span>{label} failed</span>
      </div>
    );
  }

  const openViewer = (e: MouseEvent) => {
    e.preventDefault();
    setLightbox(true);
  };

  const retrySrc = () => {
    if (userId && kind) {
      setSrc(
        `/api/admin/docs?userId=${encodeURIComponent(userId)}&kind=${encodeURIComponent(kind)}&t=${Date.now()}`,
      );
    } else if (url) {
      setSrc(proxyDocUrl(url) + `&t=${Date.now()}`);
    } else {
      setFailed(true);
    }
  };

  const viewer =
    lightbox && view ? (
      <FileLightbox
        label={label}
        view={view}
        isVideo={isVideo}
        isPdf={Boolean(isPdf)}
        offline={offline}
        onClose={() => setLightbox(false)}
        onImageError={retrySrc}
      />
    ) : null;

  if (isVideo) {
    return (
      <>
        <button
          type="button"
          className="om-admin-file-link"
          onClick={openViewer}
          title={`Play ${label} (Admin / Care · proxy)`}
          style={{
            cursor: "pointer",
            border: 0,
            background: "transparent",
            textAlign: "left",
          }}
        >
          🎬 {label}
          {offline ? " · offline" : " · play"}
        </button>
        {viewer}
      </>
    );
  }

  if (isPdf || (!isImage && view && !view.startsWith("data:image"))) {
    return (
      <>
        <button
          type="button"
          className="om-admin-file-link"
          onClick={openViewer}
          title={`View ${label} (Admin / Care · proxy)`}
          style={{
            cursor: "pointer",
            border: 0,
            background: "transparent",
            textAlign: "left",
          }}
        >
          📄 {label}
          {offline ? " · offline" : " · view"}
        </button>
        {viewer}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="om-admin-file-thumb"
        onClick={openViewer}
        title={`${label}${offline ? " · offline" : ""} · tap to view full size`}
        style={{
          width: dim,
          height: Math.round(dim * 0.72),
          cursor: "pointer",
          border: 0,
          padding: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          loading="lazy"
          decoding="async"
          src={view}
          alt={label}
          onError={retrySrc}
        />
        <span className="om-admin-file-caption">
          {label}
          {offline ? " · offline" : ""}
        </span>
      </button>
      {viewer}
    </>
  );
}
