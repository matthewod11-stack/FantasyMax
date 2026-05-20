import { redirect } from 'next/navigation';

export default async function WeekPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  redirect(`/?week=${n}`);
}
