"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EntryResponse, SessionData } from "@/types/entry";
import { saveSession } from "@/lib/session";

/**
 * Bare-bones entry gate: Gmail + Username. No styling — the creator
 * designs the UI later. Verification happens server-side.
 */
export default function EntryForm() {
  const router = useRouter();
  const [gmail, setGmail] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch("/api/verify-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmail, username }),
      });
      const data = (await response.json()) as EntryResponse;

      if (data.ok) {
        saveSession(data.session as SessionData);
        router.push("/cafe");
      } else {
        setErrors(data.errors);
      }
    } catch {
      setErrors(["Could not reach the cafe. Try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="gmail">Gmail</label>
      <input
        id="gmail"
        name="gmail"
        type="email"
        value={gmail}
        onChange={(event) => setGmail(event.target.value)}
        required
      />

      <label htmlFor="username">Username</label>
      <input
        id="username"
        name="username"
        type="text"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        required
      />

      <button type="submit" disabled={submitting}>
        Enter the cafe
      </button>

      {errors.length > 0 && (
        <ul>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
