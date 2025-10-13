export function timeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.round((now - then) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44);
  const years = Math.round(days / 365.25);

  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return "1 week ago";
  if (weeks < 4) return `${weeks} weeks ago`;
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  if (years === 1) return "1 year ago";
  return `${years} years ago`;
}
