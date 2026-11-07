export function monthRange(year, month) {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 1);
    return { from: from.toISOString(), to: to.toISOString() };
}

// Seven days starting on the Sunday of the week that contains `date`.
export function weekRange(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    const to = new Date(start);
    to.setDate(start.getDate() + 7);
    return { from: start.toISOString(), to: to.toISOString() };
}

// Six weeks (42 days) that fill a month grid, starting on the Sunday on or before the 1st.
export function calendarGridRange(year, month) {
    const first = new Date(year, month, 1);
    const from = new Date(first);
    from.setDate(1 - first.getDay());
    const to = new Date(from);
    to.setDate(from.getDate() + 42);
    return { from: from.toISOString(), to: to.toISOString() };
}