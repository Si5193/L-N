import { eachDayOfInterval, format, isSaturday, isSunday } from 'https://cdn.jsdelivr.net/npm/date-fns@2.23.0/dist/date-fns.esm.js';

export function getRedDays(year) {
    const fixedHolidays = [
        `${year}-01-01`, // Nyårsdagen
        `${year}-01-06`, // Trettondedag jul
        `${year}-05-01`, // Första maj
        `${year}-06-06`, // Sveriges nationaldag
        `${year}-12-24`, // Julafton
        `${year}-12-25`, // Juldagen
        `${year}-12-26`, // Annandag jul
        `${year}-12-31`  // Nyårsafton
    ];

    const dynamicHolidays = [
        // Påskdagar (beräknas dynamiskt)
        getEasterSunday(year),               // Påskdagen
        addDays(getEasterSunday(year), 1),   // Annandag påsk
        subDays(getEasterSunday(year), 2),   // Långfredagen
        subDays(getEasterSunday(year), 3),   // Skärtorsdagen
        // Kristi himmelsfärdsdag
        addDays(getEasterSunday(year), 39),  // Kristi himmelsfärdsdag
        // Pingstdagen
        addDays(getEasterSunday(year), 49)   // Pingstdagen
    ];

    const allHolidays = [...fixedHolidays, ...dynamicHolidays.map(date => format(date, 'yyyy-MM-dd'))];

    // Lägg till midsommarafton (fredagen mellan 19-25 juni)
    const midsummerEve = eachDayOfInterval({
        start: new Date(year, 5, 19),
        end: new Date(year, 5, 25)
    }).find(date => isFriday(date));
    allHolidays.push(format(midsummerEve, 'yyyy-MM-dd'));

    return allHolidays;
}

function getEasterSunday(year) {
    const f = Math.floor,
          // Meeus/Jones/Butcher algorithm
          G = year % 19,
          C = f(year / 100),
          H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
          I = H - f(H / 28) * (1 - f(H / 28) * f(29 / (H + 1)) * f((21 - G) / 11)),
          J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
          L = I - J,
          month = 3 + f((L + 40) / 44),
          day = L + 28 - 31 * f(month / 4);
    return new Date(year, month - 1, day);
}
