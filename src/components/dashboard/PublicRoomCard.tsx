import { BedDouble, Coffee, Laptop, Users, UtensilsCrossed, Wine } from 'lucide-react';
import type { RoomRow } from '@/types/database.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const roomIcons: Record<string, typeof Coffee> = {
  'public-cafe': Coffee,
  'public-apartment': BedDouble,
  'public-workspace': Laptop,
  'public-bar': Wine,
  'public-restaurant': UtensilsCrossed,
};

const roomDescriptions: Record<string, string> = {
  'public-cafe': 'Espresso, pastries, and low hum. The main hangout.',
  'public-apartment': 'A small lounge corner for quiet co-working.',
  'public-workspace': 'Desks, printers, and focus energy.',
  'public-bar': 'Dim lights, clinking glasses, and a late-night counter.',
  'public-restaurant': 'Set tables, warm service, and a proper meal break.',
};

export interface PublicRoomCardProps {
  room: RoomRow;
  occupantCount?: number;
  onEnter: (roomId: string) => void;
}

export function PublicRoomCard({ room, occupantCount = 0, onEnter }: PublicRoomCardProps) {
  const Icon = roomIcons[room.id] ?? Coffee;

  return (
    <Card tone="powder" className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-charcoal shadow-soft">
          <Icon className="h-5 w-5" />
        </span>
        <span className="pill bg-sage/70 text-charcoal">
          <Users className="h-3.5 w-3.5" />
          {occupantCount} here
        </span>
      </div>
      <div>
        <h3 className="text-base font-bold">{room.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-charcoal/60">
          {roomDescriptions[room.id] ?? 'A shared space to sit and study.'}
        </p>
      </div>
      <div className="mt-auto pt-2">
        <Button variant="primary" size="sm" onClick={() => onEnter(room.id)} className="w-full">
          Enter room
        </Button>
      </div>
    </Card>
  );
}
