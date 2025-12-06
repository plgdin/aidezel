// src/components/ui/toaster.tsx
import React from "react";
import { Toaster as SonnerToaster } from "sonner";

export const Toaster: React.FC = () => {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: "999px",
          paddingInline: "16px",
        },
      }}
    />
  );
};

export default Toaster;
