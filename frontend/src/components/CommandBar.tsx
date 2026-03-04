'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';

const EXAMPLES = [
  'Swap 100 HBAR for USDC',
  'Stake 50 HBAR and show yield',
  'Create SWRM token and airdrop to 3 wallets',
  'Get price of HBAR and ETH',
];

interface Props { onSubmit: (cmd: string) => void; loading: boolean; }

export default function CommandBar({ onSubmit, loading }: Props) {
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim() || loading) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Enter a DeFi intent... e.g. Swap 100 HBAR for USDC"
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-hedera rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors"
          disabled={loading}
        />
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="bg-hedera hover:bg-hedera-dark disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          {loading ? (
            <span className="animate-spin">⟳</span>
          ) : (
            <Send size={18} />
          )}
          {loading ? 'Processing...' : 'Execute'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => setValue(ex)}
            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-hedera/50 px-3 py-1.5 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
