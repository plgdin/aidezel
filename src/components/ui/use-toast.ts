// src/components/ui/use-toast.ts
import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast;

// Optional typed wrapper (if you ever want it)
export type ToastOptions = Parameters<typeof sonnerToast>[1];
