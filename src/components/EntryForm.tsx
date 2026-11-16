"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EntryResponse, SessionData } from "@/types/entry";
import { saveSession } from "@/lib/session";

/**
 * Entry gate: Gmail + Username. Warm styled card flow. Verification
 * happens server-side via /api/verify-entry.
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
      <div className="entry-form">
        <div>
          <label htmlFor="gmail" className="muted" style={{ display: "block", marginBottom: 4 }}>
            Gmail
          </label>
          <input
            id="gmail"
            name="gmail"
            type="email"
            placeholder="you@gmail.com"
            value={gmail}
            onChange={(event) => setGmail(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="username" className="muted" style={{ display: "block", marginBottom: 4 }}>
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="cafe_name"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
      </div>
      <button className="btn btn-accent" type="submit" disabled={submitting}>
        {submitting ? "Unlocking the door…" : "Enter the cafe"}
      </button>

      {errors.length > 0 && (
        <ul className="entry-error" style={{ listStyle: "none", padding: 0 }}>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
