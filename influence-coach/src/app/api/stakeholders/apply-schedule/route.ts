import { NextResponse } from "next/server";
import { listStakeholders, upsertStakeholder } from "@/lib/db";
import { isScheduledToday, todayWeekday } from "@/lib/days";

/**
 * Sets is_in_office for every stakeholder based on their office_days schedule
 * and today's day of the week. Returns the day applied and a count.
 */
export async function POST() {
  const today = todayWeekday();
  const all = await listStakeholders();

  const updates = await Promise.all(
    all.map((s) =>
      upsertStakeholder({
        ...s,
        isInOffice: isScheduledToday(s.officeDays),
      })
    )
  );

  const inOffice = updates.filter((s) => s?.isInOffice).length;
  return NextResponse.json({ today, applied: updates.length, inOffice });
}
