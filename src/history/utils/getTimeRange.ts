import moment from 'moment';
import { AvailableDateOption } from '../dto/history,dto';
// Last month
export function getLastMonthRange(): [moment.Moment, moment.Moment] {
  const today = moment();
  const startOfMonth = today.clone().startOf('month').subtract(1, 'months');
  const endOfMonth = startOfMonth.clone().endOf('month');
  return [startOfMonth, endOfMonth];
}

//Last week
export function getLastWeekRange(): [moment.Moment, moment.Moment] {
  const today = moment();
  const startOfWeek = today.clone().startOf('isoWeek').subtract(7, 'days'); // Start of last week
  const endOfWeek = startOfWeek.clone().add(6, 'days'); // End of last week
  return [startOfWeek, endOfWeek];
}

// This Week
export function getThisWeekRange(): [moment.Moment, moment.Moment] {
  const today = moment();
  const startOfWeek = today.clone().startOf('isoWeek'); // ISO week starts on Monday
  const endOfWeek = today.clone().endOf('isoWeek');
  return [startOfWeek, endOfWeek];
}

// This Month
export function getThisMonthRange(): [moment.Moment, moment.Moment] {
  const today = moment();
  const startOfMonth = today.clone().startOf('month');
  const endOfMonth = today.clone().endOf('month');
  return [startOfMonth, endOfMonth];
}

export function mapToDate(date: AvailableDateOption): [string, string] {
  let startDate: string;
  let endDate: string;

  if (date === 'today') {
    startDate = moment().startOf('day').toISOString();
    endDate = moment().endOf('day').toISOString();
  } else if (date === 'yesterday') {
    startDate = moment().subtract(1, 'days').startOf('day').toISOString();
    endDate = moment().subtract(1, 'days').endOf('day').toISOString();
  } else if (date === 'this-week') {
    const [lastWeekStart, lastWeekEnd] = getThisWeekRange();
    startDate = lastWeekStart.toISOString();
    endDate = lastWeekEnd.toISOString();
  } else if (date === 'this-month') {
    const [lastWeekStart, lastWeekEnd] = getThisMonthRange();
    startDate = lastWeekStart.toISOString();
    endDate = lastWeekEnd.toISOString();
  } else if (date === 'last-week') {
    const [lastWeekStart, lastWeekEnd] = getLastWeekRange();
    startDate = lastWeekStart.toISOString();
    endDate = lastWeekEnd.toISOString();
  } else if (date === 'last-month') {
    const [lastMonthStart, lastMonthEnd] = getLastMonthRange();
    startDate = lastMonthStart.toISOString();
    endDate = lastMonthEnd.toISOString();
  }

  return [startDate, endDate];
}
