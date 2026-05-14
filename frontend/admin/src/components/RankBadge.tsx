interface Props {
  rank: string
  className?: string
}

const RANK_MAP: Record<string, { cls: string; emoji: string }> = {
  Ruby:     { cls: 'bg-red-500/15 text-red-400 border-red-500/30',     emoji: '💎' },
  Diamond:  { cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',  emoji: '🔷' },
  Platinum: { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',  emoji: '🌟' },
  Gold:     { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', emoji: '🥇' },
  Silver:   { cls: 'bg-gray-400/15 text-gray-300 border-gray-400/30',  emoji: '🥈' },
  Bronze:   { cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30', emoji: '🥉' },
  Iron:     { cls: 'bg-zinc-600/15 text-zinc-400 border-zinc-600/30',  emoji: '⚙️' },
}

export default function RankBadge({ rank, className = '' }: Props) {
  const { cls, emoji } = RANK_MAP[rank] ?? RANK_MAP.Iron
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls} ${className}`}>
      {emoji} {rank}
    </span>
  )
}
