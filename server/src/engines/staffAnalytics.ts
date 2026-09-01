import { employeeDailyFacts } from "../data/generate.js";
import { employeesInStore } from "../data/masters.js";

/**
 * Staff-level analytics (spec §18). Never returns a bare sales ranking —
 * every row carries hours worked, role, and shift alongside the numbers so
 * a reader can't mistake a part-time cashier's lower total for weaker
 * performance. Comparisons are per-hour, not per-person, for the same reason.
 */
export interface StaffSummaryRow {
  employeeId: string;
  name: string;
  role: string;
  shift: string;
  daysWorked: number;
  hoursWorked: number;
  salesAttributed: number;
  transactionsAttributed: number;
  salesPerHour: number;
  transactionsPerHour: number;
  atv: number;
}

export function staffSummary(storeId: string, dateFrom: string, dateTo: string): StaffSummaryRow[] {
  const staff = employeesInStore(storeId);
  return staff.map((emp) => {
    const facts = employeeDailyFacts.filter((f) => f.employeeId === emp.id && f.date >= dateFrom && f.date <= dateTo);
    const daysWorked = facts.filter((f) => f.hoursWorked > 0).length;
    const hoursWorked = round1(facts.reduce((a, f) => a + f.hoursWorked, 0));
    const salesAttributed = round2(facts.reduce((a, f) => a + f.salesAttributed, 0));
    const transactionsAttributed = facts.reduce((a, f) => a + f.transactionsAttributed, 0);
    return {
      employeeId: emp.id,
      name: emp.name,
      role: emp.role,
      shift: emp.shift,
      daysWorked,
      hoursWorked,
      salesAttributed,
      transactionsAttributed,
      salesPerHour: hoursWorked ? round2(salesAttributed / hoursWorked) : 0,
      transactionsPerHour: hoursWorked ? round2(transactionsAttributed / hoursWorked) : 0,
      atv: transactionsAttributed ? round2(salesAttributed / transactionsAttributed) : 0,
    };
  });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
