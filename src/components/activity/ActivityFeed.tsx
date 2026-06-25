import { useActivityFeed } from "@/hooks/useActivityFeed";
import ActivityItem from "./ActivityItem";
import ConnectionStatusBadge from "./ConnectionStatusBadge";

export interface ActivityFeedProps {
  /** Disable the live stream (e.g. when the panel is hidden). Default true. */
  enabled?: boolean;
  /** Max events to render. */
  limit?: number;
}

/**
 * Live protocol activity feed. Subscribes to the real-time event stream and
 * renders deposits, withdrawals, rewards and governance actions as they arrive
 * — no manual refresh required (issue #215).
 */
export default function ActivityFeed({ enabled = true, limit = 50 }: ActivityFeedProps) {
  const { events, status, clear } = useActivityFeed({ enabled });
  const visible = events.slice(0, limit);

  return (
    <section
      aria-label="Live activity feed"
      className="rounded-2xl border border-border-primary bg-background-secondary/20 p-4"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Live Activity</h2>
          <ConnectionStatusBadge status={status} />
        </div>
        {events.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-border-primary bg-background-secondary/30 px-2.5 py-1 text-xs text-text-secondary transition hover:bg-background-secondary/60 focus:border-axion-500 focus:outline-none"
          >
            Clear
          </button>
        ) : null}
      </header>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          {status === "error"
            ? "Couldn't connect to the event stream. Retrying…"
            : "Waiting for protocol activity…"}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((event) => (
            <ActivityItem key={event.id} event={event} />
          ))}
        </ul>
      )}
    </section>
  );
}
