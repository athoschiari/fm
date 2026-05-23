const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatVersion(version: string): string {
    const parts = version.split('_');

    if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        return `${day} ${MONTHS[month - 1]} ${year}`;
    }

    const [year, month, day, hour, minute] = parts.map(Number);

    const isDST = (() => {
        if (month > 3 && month < 10) return true;
        if (month < 3 || month > 10) return false;
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const lastDay = new Date(year, month - 1, lastDayOfMonth);
        const lastSunday = lastDayOfMonth - lastDay.getDay();
        if (month === 3) return day >= lastSunday;
        return day < lastSunday;
    })();

    const romeOffset = isDST ? 2 : 1;

    let utcHour = hour - romeOffset;
    let utcDay = day;
    let utcMonth = month;
    let utcYear = year;

    if (utcHour < 0) {
        utcHour += 24;
        utcDay -= 1;
    }

    if (utcDay < 1) {
        utcMonth -= 1;
        if (utcMonth < 1) {
            utcMonth = 12;
            utcYear -= 1;
        }
        utcDay = new Date(utcYear, utcMonth, 0).getDate();
    }

    return `${utcDay} ${MONTHS[utcMonth - 1]} ${utcYear} at ${String(utcHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} UTC`;
}
