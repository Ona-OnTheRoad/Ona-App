"use client";

/**
 * Shared admin UI: file thumbs, detail drawer, tabs, table helpers.
 * Used so Care pages stay consistent and non-overlapping.
 */

export {
  fmtDate,
  AdminTabs,
  DetailGrid,
  DetailField,
  StatusBadge,
  AdminTableWrap,
} from "./admin-ui/admin-ui-parts";
export { adminDocViewHref, type AdminDocKind } from "./admin-ui/doc-href";
export { FileThumb } from "./admin-ui/file-thumb";
export { FileThumbRow } from "./admin-ui/file-thumb-row";
export { DetailDrawer } from "./admin-ui/detail-drawer";
