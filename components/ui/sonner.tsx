"use client";

import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "../ThemeProvider";

const Toaster = ({ ...props }: ToasterProps) => {
  const { actualTheme } = useTheme();

  return (
    <Sonner
      theme={actualTheme as ToasterProps["theme"]}
      className="toaster group"
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      }}
      {...props}
    />
  );
};

export { Toaster };
