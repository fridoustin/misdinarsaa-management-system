export interface MonthlyScheduleItem {
  date: string; // ISO yyyy-mm-dd
  time: string;
  massTypeName: string; // must match a seeded mass_types.name
}

/** 0=Sunday ... 6=Saturday (JS Date convention) */
const WEEKDAY = { SUNDAY: 0, TUESDAY: 2, FRIDAY: 5, SATURDAY: 6 } as const;

/**
 * Church's fixed weekly mass pattern (spec section 4): Tuesday & Friday daily
 * mass, Friday-of-the-month gets the bigger "Jumat Pertama" mass, Saturday
 * evening, and Sunday morning + evening. Pure function — no DB, easy to test.
 */
export function computeMonthlySchedule(year: number, month1to12: number): MonthlyScheduleItem[] {
  const items: MonthlyScheduleItem[] = [];
  const daysInMonth = new Date(year, month1to12, 0).getDate();
  let fridayCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month1to12 - 1, day);
    const iso = toIso(date);
    const weekday = date.getDay();

    if (weekday === WEEKDAY.TUESDAY) {
      items.push({ date: iso, time: "18:30", massTypeName: "Selasa" });
    }
    if (weekday === WEEKDAY.FRIDAY) {
      fridayCount += 1;
      if (fridayCount === 1) {
        items.push({ date: iso, time: "18:30", massTypeName: "Jumat Pertama" });
      } else {
        items.push({ date: iso, time: "18:30", massTypeName: "Jumat" });
      }
    }
    if (weekday === WEEKDAY.SATURDAY) {
      items.push({ date: iso, time: "18:30", massTypeName: "Sabtu" });
    }
    if (weekday === WEEKDAY.SUNDAY) {
      items.push({ date: iso, time: "08:00", massTypeName: "Minggu Pagi" });
      items.push({ date: iso, time: "17:00", massTypeName: "Minggu Sore" });
    }
  }

  return items;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
