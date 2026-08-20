"use client";

import { useEffect } from "react";

export function AutoImprimir() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  return null;
}