import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

// Generate timeframe display string from start and end dates
export const getTimeframe = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];

  // Check if start and end dates are the same
  if (startDate === endDate) {
    // Return specific date for deadline events
    return `${startMonth} ${start.getDate()}, ${start.getFullYear()}`;
  }

  // If different years
  if (start.getFullYear() !== end.getFullYear()) {
    return `${startMonth} - ${endMonth} (${end.getFullYear()})`;
  }

  // Same year
  return `${startMonth} - ${endMonth}`;
};
