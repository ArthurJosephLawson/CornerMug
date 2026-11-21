import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { CornerDownLeft, Terminal } from 'lucide-react';
import type { AdminUserRow } from '@/services/adminService';
import {
  getUserPassword,
  grantUser,
  removeUser,
  renameUser,
  setAdmin,
} from '@/services/adminService';

interface AdminTerminalProps {
  users: AdminUserRow[];
  selfId: string;
  isOwner: boolean;
  onRefresh: () => Promise<void> | void;
}

interface TerminalLine {
  kind: 'input' | 'output' | 'error' | 'success';
  text: string;
}

const WELCOME: TerminalLine[] = [
  { kind: 'output', text: 'CornerMug admin terminal. Type /help for commands.' },
  { kind: 'output', text: 'XP targets: @me or @username.' },
];

function tokenize(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean);
}

export function AdminTerminal({ users, selfId, isOwner, onRefresh }: AdminTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(WELCOME);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines]);

  const append = (line: TerminalLine) => setLines((current) => [...current, line]);
  const fail = (text: string) => append({ kind: 'error', text });

  const resolveTarget = (raw: string): AdminUserRow | null => {
    const name = raw.replace(/^@/, '').trim().toLowerCase();
    if (!name) return null;
    if (name === 'me') return users.find((user) => user.id === selfId) ?? null;
    return users.find((user) => user.username.toLowerCase() === name) ?? null;
  };

  const run = async (command: string) => {
    const parts = tokenize(command);
    if (parts.length === 0) return;
    if (!parts[0].startsWith('/')) {
      fail('Commands start with /. Try /help.');
      return;
    }

    const name = parts[0].slice(1).toLowerCase();
    const args = parts.slice(1);

    if (name === 'help') {
      append({
        kind: 'output',
        text: [
          '/help',
          '/whoami',
          '/give @me 500',
          '/give @username 500 xp',
          '/give @username 500 money',
          '/give @username kitten',
          '/admin @username',
          '/unadmin @username',
          '/rename @username NewName',
          '/password @username',
          '/remove @username CONFIRM',
          '/clear',
        ].join('  |  '),
      });
      return;
    }

    if (name === 'clear') {
      setLines(WELCOME);
      return;
    }

    if (name === 'whoami') {
      const self = users.find((user) => user.id === selfId);
      append({
        kind: 'output',
        text: self
          ? `${self.username} | ${self.is_owner ? 'owner' : self.is_admin ? 'admin' : 'player'} | ${self.xp} XP | ${self.money} money`
          : 'Could not find your player row.',
      });
      return;
    }

    if (name === 'give') {
      const target = resolveTarget(args[0] ?? '');
      if (!target) {
        fail('Target not found. Use @me or @username.');
        return;
      }
      const value = args[1];
      if (!value) {
        fail('Give what? Example: /give @me 500 or /give @me kitten.');
        return;
      }

      const unit = (args[2] ?? 'xp').toLowerCase();
      const amount = Number(value);
      let xp = 0;
      let money = 0;
      let item: string | null = null;

      if (Number.isFinite(amount) && Number.isInteger(amount) && amount >= 0) {
        if (unit === 'money') money = amount;
        else if (unit === 'xp') xp = amount;
        else {
          fail('Unit must be xp or money. Example: /give @me 500 xp.');
          return;
        }
      } else if (unit === 'xp' || args[2] === undefined) {
        item = value.toLowerCase();
      } else {
        fail('Invalid amount. Use a whole number.');
        return;
      }

      if (xp === 0 && money === 0 && !item) {
        fail('Nothing to give. Use a positive amount or an item name.');
        return;
      }

      const result = await grantUser(target.id, { xp, money, item });
      const pieces: string[] = [];
      if (result.granted_xp) pieces.push(`+${result.granted_xp} XP`);
      if (result.granted_money) pieces.push(`+${result.granted_money} money`);
      if (result.granted_item) pieces.push(result.granted_item);
      append({
        kind: 'success',
        text: `${target.username}: ${pieces.length ? pieces.join(', ') : 'already had that item'} | now ${result.xp} XP, ${result.money} money.`,
      });
      await onRefresh();
      return;
    }

    if (name === 'admin' || name === 'unadmin') {
      const target = resolveTarget(args[0] ?? '');
      if (!target) {
        fail('Target not found. Use @username.');
        return;
      }
      const makeAdmin = name === 'admin';
      await setAdmin(target.id, makeAdmin);
      append({
        kind: 'success',
        text: `${target.username} is ${makeAdmin ? 'now an admin' : 'no longer an admin'}.`,
      });
      await onRefresh();
      return;
    }

    if (name === 'rename') {
      const target = resolveTarget(args[0] ?? '');
      const nextName = args.slice(1).join(' ').trim();
      if (!target) {
        fail('Target not found. Use @username.');
        return;
      }
      if (!nextName) {
        fail('Add a new username. Example: /rename @quietfox newname.');
        return;
      }
      await renameUser(target.id, nextName);
      append({ kind: 'success', text: `${target.username} renamed to ${nextName}.` });
      await onRefresh();
      return;
    }

    if (name === 'password') {
      if (!isOwner) {
        fail('Only the owner can view passwords.');
        return;
      }
      const target = resolveTarget(args[0] ?? '');
      if (!target) {
        fail('Target not found. Use @username.');
        return;
      }
      const password = await getUserPassword(target.id);
      append({ kind: 'output', text: `${target.username}: ${password || '(empty)'}` });
      return;
    }

    if (name === 'remove') {
      const target = resolveTarget(args[0] ?? '');
      if (!target) {
        fail('Target not found. Use @username.');
        return;
      }
      if ((args[1] ?? '').toUpperCase() !== 'CONFIRM') {
        fail(`Type /remove @${target.username} CONFIRM to confirm deletion.`);
        return;
      }
      await removeUser(target.id);
      append({ kind: 'success', text: `${target.username} removed permanently.` });
      await onRefresh();
      return;
    }

    fail(`Unknown command: /${name}. Try /help.`);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const command = value.trim();
    if (!command || busy) return;

    append({ kind: 'input', text: command });
    setValue('');
    setHistory((current) => [command, ...current].slice(0, 50));
    setHistoryIndex(-1);
    setBusy(true);
    try {
      await run(command);
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : 'Command failed.');
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next = Math.min(history.length - 1, historyIndex + 1);
      if (next >= 0) {
        setHistoryIndex(next);
        setValue(history[next] ?? '');
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = historyIndex - 1;
      setHistoryIndex(next);
      setValue(next >= 0 ? (history[next] ?? '') : '');
    }
  };

  const color = (kind: TerminalLine['kind']) => {
    if (kind === 'input') return 'text-lavender';
    if (kind === 'error') return 'text-pink';
    if (kind === 'success') return 'text-sage';
    return 'text-ivory/75';
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-charcoal shadow-card">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-ivory">
        <Terminal className="h-4 w-4 text-lavender" />
        <p className="text-sm font-bold">Admin terminal</p>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-ivory/40">
          owner tools
        </span>
      </div>

      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed sm:text-xs"
      >
        {lines.map((line, index) => (
          <p key={`${index}-${line.text}`} className={`whitespace-pre-wrap ${color(line.kind)}`}>
            {line.kind === 'input' ? '> ' : ''}
            {line.text}
          </p>
        ))}
        {busy ? <p className="text-ivory/40">working...</p> : null}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
        <span className="font-mono text-xs text-lavender">$</span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="/give @me 500"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-ivory outline-none placeholder:text-ivory/30"
          aria-label="Admin command"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-lavender text-charcoal disabled:opacity-40"
          aria-label="Run command"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
