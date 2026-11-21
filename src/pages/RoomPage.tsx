import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function RoomPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center gap-3 py-14 text-center">
        <Clock className="h-10 w-10 text-charcoal/30 dark:text-white/30" />
        <div>
          <p className="text-lg font-bold">No rooms available yet</p>
          <p className="mt-1 max-w-sm text-sm text-charcoal/55 dark:text-white/70">
            Maps are being rebuilt. Hangout tracking and your progress features remain active.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Button>
      </Card>
    </div>
  );
}
