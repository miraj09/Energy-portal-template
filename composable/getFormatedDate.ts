/**
 * Format ISO date string to dd/mm/yyyy format
 * @param dateString - ISO date string (e.g., "2025-08-05T15:25:37.682920+06:00")
 * @returns Promise<string> - Formatted date string (e.g., "05/08/2025")
 */
export async function formatDate(
  dateString: string | null | undefined
): Promise<string> {
  if (!dateString) {
    return "N/A";
  }

  try {
    // Use Promise to handle date parsing asynchronously
    const formattedDate = await new Promise<string>((resolve, reject) => {
      try {
        const date = new Date(dateString);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
          reject(new Error("Invalid date"));
          return;
        }

        // Format to dd/mm/yyyy
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        resolve(`${day}/${month}/${year}`);
      } catch (error) {
        reject(error);
      }
    });

    return formattedDate;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

/**
 * Format ISO date string to dd/mm/yyyy with time
 * @param dateString - ISO date string
 * @returns Formatted date string with time (e.g., "05/08/2025 15:25")
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return "N/A";
  }

  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    // Format to dd/mm/yyyy HH:mm
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting date time:", error);
    return "Invalid Date";
  }
}

/**
 * Format ISO date string to dd/mm/yyyy with time and seconds
 * @param dateString - ISO date string
 * @returns Formatted date string with time and seconds (e.g., "05/08/2025 15:25:37")
 */
export function formatDateTimeWithSeconds(
  dateString: string | null | undefined
): string {
  if (!dateString) {
    return "N/A";
  }

  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    // Format to dd/mm/yyyy HH:mm:ss
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error formatting date time with seconds:", error);
    return "Invalid Date";
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return "N/A";
  }

  try {
    const date = new Date(dateString);
    const now = new Date();

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  } catch (error) {
    console.error("Error getting relative time:", error);
    return "Invalid Date";
  }
}
