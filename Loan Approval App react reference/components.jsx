// Reusable cicil.in components
const { IChevLeft, ISearch, IHomeSolid, IPlus, ILeaderboard, IHistory, IProfile, IUpDouble, IShieldRank } = window.Icons;

/* Page header — back button + title block */
function PageHeader({ title, sub, onBack }) {
  return (
    <div className="page-header">
      <button className="back-btn" onClick={onBack} aria-label="Back">
        <IChevLeft size={26} sw={2.5} />
      </button>
      <div className="titles">
        <h1>{title}</h1>
        {sub && <div className="eyebrow-sub">{sub}</div>}
      </div>
    </div>
  );
}

/* Floating bottom nav (cicil.in signature) */
function NavDock({ tab, onTab }) {
  const items = [
    { id: 'home',        icon: <IHomeSolid size={26} /> },
    { id: 'new',         icon: <IPlus size={22} /> },
    { id: 'leaderboard', icon: <ILeaderboard size={22} /> },
    { id: 'history',     icon: <IHistory size={24} /> },
    { id: 'profile',     icon: <IProfile size={22} /> },
  ];
  return (
    <div className="nav-dock" style={{ pointerEvents: 'auto' }}>
      {items.map(it => (
        <button
          key={it.id}
          className={'nav-btn' + (tab === it.id ? ' active' : '')}
          onClick={() => onTab(it.id)}
          aria-label={it.id}
        >
          {it.icon}
        </button>
      ))}
    </div>
  );
}

/* History row (used on home + history) */
function HistoryRow({ item, onClick }) {
  const { fmtRp } = window.CData;
  const isOverdue = item.status === 'menunggak' || item.overdue;
  return (
    <button className={'history-row' + (isOverdue ? ' overdue' : '')} onClick={onClick}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="amount">{fmtRp(item.amount)}</div>
        <div className="sub">
          {isOverdue
            ? `lewat jatuh tempo - ${item.date}`
            : `${item.status} - ${item.date}`}
        </div>
      </div>
      <div className="search-circle">
        <ISearch size={22} sw={1.75} />
      </div>
    </button>
  );
}

/* Quest card */
function Quest({ title, xp, tone = 'olive' }) {
  return (
    <div className={'quest' + (tone === 'purple' ? ' purple' : '')}>
      <div className="title">{title}</div>
      <div className="xp-pill">+{xp}xp</div>
    </div>
  );
}

/* Hex rank badge — Platinum gradient with star */
function RankHex() {
  return (
    <div className="rank-hex">
      <div className="hex-body" />
      <div className="hex-glare" />
      <svg className="hex-star" viewBox="0 0 56 56" fill="currentColor">
        <path d="M28 4 L33 23 L52 28 L33 33 L28 52 L23 33 L4 28 L23 23 Z" opacity="0.5"/>
      </svg>
    </div>
  );
}

/* Profile data row pair */
function DataPair({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.005em' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4 }}>{value}</div>
    </div>
  );
}

window.CComp = { PageHeader, NavDock, HistoryRow, Quest, RankHex, DataPair };
