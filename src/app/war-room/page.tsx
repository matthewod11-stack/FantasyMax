import type { Metadata } from 'next';

import { WarRoom } from '@/components/features/war-room/WarRoom';

import './war-room.css';

export const metadata: Metadata = {
  title: '2026 War Room | FantasyMax',
  description: 'A private evidence desk for the 2026 fantasy football draft.',
};

export default function WarRoomPage() {
  return <WarRoom />;
}
