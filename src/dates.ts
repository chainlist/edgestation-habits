export interface Day {
	key: string;
	date: Date;
	/** The short month name that shows above this day, if any. */
	month?: string;
}

const monthName = new Intl.DateTimeFormat(undefined, { month: 'short' });
export const dayName = new Intl.DateTimeFormat(undefined, {
	weekday: 'short',
	day: 'numeric',
	month: 'short'
});

/** The local calendar day of `date`, as `YYYY-MM-DD`. The saved check-ins use this key. */
export function dayKey(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The `count` days that end with `today`, oldest first. A month name labels the first day of
 * each month. The oldest day gets one too when its month has 4 days or more in the list, as a
 * label is about 3 squares wide.
 */
export function lastDays(today: Date, count: number): Day[] {
	const days: Day[] = [];
	for (let back = count - 1; back >= 0; back--) {
		// The Date constructor moves to the previous month or year when the day number is 0 or less.
		const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
		const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
		const label = date.getDate() === 1 || (!days.length && monthEnd - date.getDate() >= 3);
		days.push({ key: dayKey(date), date, month: label ? monthName.format(date) : undefined });
	}
	return days;
}

/** The number of checked days in a row that end today, or yesterday while today is not checked. */
export function streak(done: ReadonlySet<string>, today: Date): number {
	const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	if (!done.has(dayKey(date))) date.setDate(date.getDate() - 1);
	let count = 0;
	while (done.has(dayKey(date))) {
		count++;
		date.setDate(date.getDate() - 1);
	}
	return count;
}

/** The time from `now` to the next midnight, in miliseconds. */
export function untilTomorrow(now: Date): number {
	return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
}
