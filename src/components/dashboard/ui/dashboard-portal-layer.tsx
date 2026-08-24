"use client";

import * as React from "react";

export type DashboardPortalLayer = "default" | "modal";

const DashboardPortalLayerContext =
  React.createContext<DashboardPortalLayer>("default");

export const DashboardPortalLayerProvider =
  DashboardPortalLayerContext.Provider;

export function useDashboardPortalLayer() {
  return React.useContext(DashboardPortalLayerContext);
}

export function getDashboardPopoverLayerClass(layer: DashboardPortalLayer) {
  return layer === "modal"
    ? "z-[var(--dashboard-layer-modal-popover)]"
    : "z-[var(--dashboard-layer-popover)]";
}
