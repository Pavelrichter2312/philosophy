export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateShort(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isUpcoming(isoDate: string): boolean {
  return new Date(isoDate) >= new Date();
}

export function daysUntil(isoDate: string): number {
  const now = new Date();
  const target = new Date(isoDate);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function groupByMonth<T extends { announcedDate: string }>(
  events: T[]
): Record<string, T[]> {
  return events.reduce(
    (acc, event) => {
      const key = event.announcedDate.slice(0, 7); // YYYY-MM
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    },
    {} as Record<string, T[]>
  );
}
