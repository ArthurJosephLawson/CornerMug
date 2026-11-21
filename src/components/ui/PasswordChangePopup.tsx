import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const STORAGE_KEY = 'cornermug:seen-password-popup:v1';

export function PasswordChangePopup() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Ignore storage failures.
    }
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onClose={dismiss}
      title="New: change your key to a password"
      footer={
        <>
          <Button variant="ghost" onClick={dismiss}>
            Later
          </Button>
          <Button
            onClick={() => {
              dismiss();
              navigate('/settings');
            }}
          >
            <KeyRound className="h-4 w-4" /> Go to settings
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-charcoal/70 dark:text-white/75">
        You can now change your sign-in key into a password. Open settings to set a password you
        choose.
      </p>
    </Modal>
  );
}
