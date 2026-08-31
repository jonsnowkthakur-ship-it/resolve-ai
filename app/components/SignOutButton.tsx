"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    try {
      setLoading(true);

      await signOut({
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error(
        "Sign out error:",
        error
      );

      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}