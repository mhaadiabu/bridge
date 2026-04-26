import { formatHours } from "@/utils/format";

export function getStatusLabel(status: string) {
  if (status === "dueSoon") {
    return "Due soon";
  }
  if (status === "overdue") {
    return "Overdue";
  }
  if (status === "submitted") {
    return "Submitted";
  }
  return "Upcoming";
}

export function getLeadTimeSummary(leadTimeHours: number | null, submittedAt: number | null) {
  if (!submittedAt) {
    return "Not submitted";
  }
  if (leadTimeHours === null) {
    return "Submitted";
  }
  if (leadTimeHours >= 0) {
    return `Submitted ${formatHours(leadTimeHours)} before deadline`;
  }
  return `Submitted ${formatHours(Math.abs(leadTimeHours))} after deadline`;
}
