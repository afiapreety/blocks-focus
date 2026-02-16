import { format } from 'date-fns';

export function getPreviewText(content: string): string {
  const text = content
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1 ')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1 ')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1 ')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1 ')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1 ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 100 ? text.substring(0, 100) + '...' : text;
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'a few seconds ago';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return format(date, 'MMM d, yyyy');
  }
}
