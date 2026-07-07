/**
 * Scheduled jobs. Non-transactional emails (reminders/nudges) run here rather
 * than off user activity so they can be batched, capped, and rate-limited.
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily profile-completion nudge to educators with thin profiles. 15:00 UTC
// lands in the US morning, and the send is capped + cooldown-gated inside the
// action so a single run never blasts the roster or re-nudges too soon.
crons.daily(
    "profile completion reminders",
    { hourUTC: 15, minuteUTC: 0 },
    internal.emails.sendProfileCompletionReminders
);

export default crons;
