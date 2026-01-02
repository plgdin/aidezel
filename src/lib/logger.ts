// src/lib/logger.ts
import { supabase } from './supabase';

export const logAction = async (action: string, details: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('admin_logs').insert({
      admin_email: user.email, // This will store the Staff's email
      action: action,
      details: details
    });
  } catch (error) {
    console.error("Failed to log action:", error);
    // We don't block the UI if logging fails, just log to console
  }
};