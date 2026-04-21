import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import isToday from "dayjs/plugin/isToday.js";
import isYesterday from "dayjs/plugin/isYesterday.js";
import calendar from "dayjs/plugin/calendar.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(calendar);
dayjs.extend(localizedFormat);

export default dayjs;
