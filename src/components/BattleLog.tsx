import type { LogEntry } from '../game/game';

export function BattleLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="log" aria-live="polite">
      <h3>Battle log</h3>
      {entries.length === 0 ? (
        <p className="log__empty">No shots fired yet.</p>
      ) : (
        <ol className="log__list">
          {entries.map((entry) => (
            <li key={entry.id} className={`log__entry log__entry--${entry.actor}`}>
              <span className="log__actor">{entry.actor === 'player' ? 'You' : 'AI'}</span>
              <span>{entry.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
