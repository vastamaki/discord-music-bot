import { formatDistance } from "date-fns";

export const duration = (s: number) =>
  formatDistance(0, s * 1000, { includeSeconds: true });
