import Link from "next/link";
import SiteNav from "@/components/SiteNav";

/**
 * Help / guide page: how Corner Mug works. Static content, no game assets —
 * the creator draws all art; these steps use CSS shapes and text only.
 */
export default function HelpPage() {
  return (
    <>
      <SiteNav />
      <main className="page-enter">
        <h1>How Corner Mug works</h1>
        <p className="muted">
          A cozy cafe to hang out, chat, and study — no accounts, no video, no voice.
        </p>

        <section className="card">
          <div className="help-step">
            <div className="num">1</div>
            <div>
              <h2>Walk in — no account needed</h2>
              <p>
                Enter your <strong>@gmail.com</strong> address and a username. That&apos;s the
                whole gate — no passwords, no OAuth. Your username is your name tag at
                the tables.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="help-step">
            <div className="num">2</div>
            <div>
              <h2>Pick a room</h2>
              <p>
                Three cozy cafe interiors to choose from. Each has its own seating,
                desks, and a counter. You can switch rooms any time from the cafe
                page.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="help-step">
            <div className="num">3</div>
            <div>
              <h2>Walk around</h2>
              <p>
                Move with <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or the
                arrow keys. Your avatar turns left or right as you walk.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="help-step">
            <div className="num">4</div>
            <div>
              <h2>Sit at a table for proximity chat</h2>
              <p>
                Click a red seat marker when you&apos;re close (within a step or two) to sit
                down. Everyone seated at the same table shares a chat channel — walk
                over, pull up a chair, and join the conversation. Move again to stand
                up.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="help-step">
            <div className="num">5</div>
            <div>
              <h2>Speak up</h2>
              <p>
                Press <kbd>T</kbd> to open the speech input, type, and hit{" "}
                <kbd>Enter</kbd>. Your words appear in a speech bubble above your
                avatar for everyone nearby to see.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="help-step">
            <div className="num">6</div>
            <div>
              <h2>Study together with the shared Pomodoro</h2>
              <p>
                The Pomodoro timer runs 25 minutes of focus, then a 5-minute break.
                Completed sessions feed your Stats dashboard — streaks, weekly
                minutes, and monthly totals.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Curious what exists today?</h2>
          <p className="muted">
            Multiplayer rooms, table chat, and shared timers arrive with the Supabase
            Realtime phase. The cozy artwork is being hand-drawn right now — missing
            art shows as labeled placeholders in the meantime.
          </p>
        </section>

        <p>
          <Link className="btn btn-accent" href="/cafe">
            Enter the cafe
          </Link>
        </p>
      </main>
    </>
  );
}
