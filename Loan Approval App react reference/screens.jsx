// cicil.in screens — all screens for the app
const { fmtRp, LOAN_INTENTS, DEADLINES, HISTORY, LEADERBOARD, PROFILE, mockPredict, formatExpiry } = window.CData;
const { PageHeader, HistoryRow, Quest, RankHex, DataPair } = window.CComp;
const { IShieldRank, IUpDouble, IProfile: IProfileAvatar, IEdit } = window.Icons;

/* ====================================================================
   HOME SCREEN
   ==================================================================== */
function HomeScreen({ onNewApp, onOpenItem, onPay }) {
  const recent = HISTORY.slice(0, 5);
  return (
    <div className="screen screen-enter">
      {/* Greeting */}
      <div style={{ padding: '4px 22px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="glass-circle" style={{ width: 47, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IProfileAvatar size={22} color="#fff" />
        </div>
        <h2 style={{ fontSize: 23, fontWeight: 800, whiteSpace: 'nowrap' }}>Hi, Budi</h2>
      </div>

      {/* Tagihan Aktif (active bill) glass card */}
      <div style={{ padding: '0 22px', marginBottom: 24 }}>
        <div className="glass" style={{ padding: 20, borderRadius: 28 }}>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 14 }}>Tagihan Aktif</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Rp 2.500.000
          </div>
          <div style={{ fontSize: 11, color: '#fff', marginTop: 6 }}>s/d 18 Mei 2026</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 22 }}>
            <button className="btn-mini" onClick={onPay}>Bayar Sekarang</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: 0 }}>Limit Bulan Ini</div>
              <div className="progress-track"><div className="fill" style={{ width: '83%' }} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Misi Bulanan */}
      <div style={{ padding: '0 22px', marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Misi Bulanan</h2>
        <div className="quests-row">
          <Quest title="Pinjam min. Rp 1.000.000" xp="50" tone="olive" />
          <Quest title="Share ke teman kamu" xp="20" tone="purple" />
          <Quest title="Bayar tepat waktu" xp="30" tone="olive" />
        </div>
      </div>

      {/* Riwayat */}
      <div style={{ padding: '0 22px' }}>
        <h2 style={{ marginBottom: 12 }}>Riwayat</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {recent.map(item => (
            <HistoryRow key={item.id} item={item} onClick={() => onOpenItem(item)} />
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-mute)', fontWeight: 700, marginTop: 12 }}>
          lihat lebih lanjut
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
   LOAN AMOUNT INPUT
   ==================================================================== */
function LoanAmount({ form, setForm, onBack, onNext }) {
  const [raw, setRaw] = React.useState(form.loan_amnt ? form.loan_amnt.toLocaleString('id-ID') : '');
  const valid = (parseInt(raw.replace(/\D/g, ''), 10) || 0) >= 500000;
  return (
    <div className="screen screen-enter">
      <PageHeader
        title="Mau pinjam berapa?"
        sub="masukkin jumlah uang yang sesuai dengan kebutuhan ya"
        onBack={onBack}
      />
      <div style={{ padding: '24px 22px' }}>
        <div style={{ position: 'relative' }}>
          <input
            className="input-pill"
            type="text"
            inputMode="numeric"
            placeholder="Masukin Disini..."
            value={raw}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setRaw(v ? parseInt(v, 10).toLocaleString('id-ID') : '');
              setForm(f => ({ ...f, loan_amnt: parseInt(v, 10) || 0 }));
            }}
          />
          {raw && (
            <span style={{
              position: 'absolute', left: 24, top: 12, fontSize: 11, color: 'var(--text-3)', fontWeight: 500,
            }}>Rp</span>
          )}
        </div>
        <div style={{ marginTop: 10, marginLeft: 10, fontSize: 13, color: 'var(--text-3)' }}>
          *minimal Rp 500.000
        </div>
      </div>

      <div style={{ padding: '60px 22px 0' }}>
        <button
          className="btn lg"
          onClick={() => valid && onNext()}
          style={{ opacity: valid ? 1 : 0.45, cursor: valid ? 'pointer' : 'not-allowed' }}
        >
          Lanjut
        </button>
      </div>
    </div>
  );
}

/* ====================================================================
   LOAN INTENT INPUT
   ==================================================================== */
function LoanIntent({ form, setForm, onBack, onNext }) {
  const valid = !!form.loan_intent;
  return (
    <div className="screen screen-enter">
      <PageHeader
        title="Hmm, buat apa ya?"
        sub="pilih tujuan kamu untuk pinjam uang"
        onBack={onBack}
      />
      <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {LOAN_INTENTS.map(it => (
          <button
            key={it.id}
            className={'chip-pill' + (form.loan_intent === it.id ? ' active' : '')}
            onClick={() => setForm(f => ({ ...f, loan_intent: it.id }))}
            style={{ alignSelf: 'flex-start' }}
          >
            {it.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '36px 22px 0' }}>
        <button
          className="btn lg"
          onClick={() => valid && onNext()}
          style={{ opacity: valid ? 1 : 0.45, cursor: valid ? 'pointer' : 'not-allowed' }}
        >Lanjut</button>
      </div>
    </div>
  );
}

/* ====================================================================
   LOAN DEADLINE
   ==================================================================== */
function LoanDeadline({ form, setForm, onBack, onNext }) {
  const valid = !!form.deadline;
  return (
    <div className="screen screen-enter">
      <PageHeader
        title="Jatuh tempo"
        sub="kira-kira kamu bisa bayar maksimal dalam berapa bulan?"
        onBack={onBack}
      />
      <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DEADLINES.map(it => (
          <button
            key={it.id}
            className={'chip-pill' + (form.deadline === it.id ? ' active' : '')}
            onClick={() => setForm(f => ({ ...f, deadline: it.id }))}
            style={{ alignSelf: 'flex-start' }}
          >
            {it.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '36px 22px 0' }}>
        <button
          className="btn lg"
          onClick={() => valid && onNext()}
          style={{ opacity: valid ? 1 : 0.45, cursor: valid ? 'pointer' : 'not-allowed' }}
        >Lanjut</button>
      </div>
    </div>
  );
}

/* ====================================================================
   LOAN CONFIRMATION ("Konfirmasi ULANG")
   ==================================================================== */
function LoanConfirm({ form, onBack, onNext }) {
  const preview = mockPredict(form);
  const intentLabel = LOAN_INTENTS.find(i => i.id === form.loan_intent)?.label || '-';
  return (
    <div className="screen screen-enter">
      <PageHeader
        title="Konfirmasi ULANG"
        sub="lihat lagi detail dari permintaan kamu, teliti ya!"
        onBack={onBack}
      />

      <div style={{ padding: '0 22px' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Kamu mau pinjam :</h3>

        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-2)', letterSpacing: '-0.03em' }}>
          {fmtRp(form.loan_amnt)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, marginBottom: 28 }}>
          s/d {formatExpiry(form.deadline)} ({form.deadline} bulan dari sekarang)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', marginBottom: 36 }}>
          <span className="ring-pill">{intentLabel}</span>
          <span className="ring-pill warn">Bunga {preview.rate}% (sesuai tier kamu)</span>
        </div>

        <h3 style={{ fontSize: 23, fontWeight: 800, marginBottom: 16 }}>Total akhir :</h3>

        <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.03em', marginBottom: 36 }}>
          {fmtRp(preview.finalTotal)}
        </div>

        <button className="btn lg" onClick={onNext}>Gas</button>
      </div>
    </div>
  );
}

/* ====================================================================
   LOAN PIN
   ==================================================================== */
function LoanPin({ onBack, onSubmit }) {
  const [pin, setPin] = React.useState('');
  React.useEffect(() => {
    const onKey = (e) => {
      if (/^\d$/.test(e.key) && pin.length < 6) setPin(p => p + e.key);
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pin]);

  const valid = pin.length === 6;
  return (
    <div className="screen screen-enter">
      <PageHeader title="Masukin PIN kamu" sub="supaya aman ya" onBack={onBack} />
      <div style={{ padding: '80px 22px 0' }}>
        <div className="pin-dots">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={'pin-dot' + (i < pin.length ? ' filled' : '')} />
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 18 }}>
          Ketuk untuk mengisi PIN (atau ketik dengan keyboard)
        </div>
        {/* On-screen tap pad (simple) */}
        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 280, margin: '32px auto 0' }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => k === '' ? <div key={i} /> : (
            <button
              key={i}
              onClick={() => {
                if (k === '⌫') setPin(p => p.slice(0, -1));
                else if (pin.length < 6) setPin(p => p + k);
              }}
              style={{
                height: 52,
                borderRadius: 18,
                border: 'none',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 22,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >{k}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: '36px 22px 0' }}>
        <button
          className="btn lg"
          onClick={() => valid && onSubmit()}
          style={{ opacity: valid ? 1 : 0.45, cursor: valid ? 'pointer' : 'not-allowed' }}
        >Gas</button>
      </div>
    </div>
  );
}

/* ====================================================================
   LOAN WAITING / PROCESSING
   ==================================================================== */
function LoanWaiting() {
  return (
    <div className="screen screen-enter" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ flex: 1 }} />
      <div style={{ textAlign: 'center', padding: '0 22px', paddingBottom: 280 }}>
        <div className="wait-pulse" />
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>Tunggu bentar yah</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 8 }}>
          sistem kita lagi cek permintaan kamu
        </p>
      </div>
    </div>
  );
}

/* ====================================================================
   LOAN RESULT (decision)
   ==================================================================== */
function LoanResult({ result, form, onDone }) {
  const ok = result.status === 'diterima';
  const review = result.status === 'menunggu';
  const reject = result.status === 'ditolak';

  const title = ok ? 'Berhasil!' : review ? 'Lagi ditinjau' : 'Belum berhasil';
  const sub = ok ? 'Dana akan segera ditransfer ke rekening kamu.'
          : review ? 'Tim kita lagi mengecek permintaan kamu lebih lanjut.'
          : 'Coba lagi nanti atau perbaiki info di profil kamu.';

  const intentLabel = LOAN_INTENTS.find(i => i.id === form.loan_intent)?.label || '-';

  return (
    <div className="screen screen-enter">
      <div style={{ padding: '40px 22px 24px', textAlign: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: 999, margin: '0 auto 18px',
          background: ok ? 'var(--green-glass)' : reject ? 'rgba(255,43,20,0.18)' : 'rgba(240,126,0,0.18)',
          boxShadow: 'var(--glass-shadow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none"
               stroke={ok ? 'var(--green)' : reject ? 'var(--red)' : 'var(--orange)'}
               strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            {ok && <path d="M10 22l8 8 16-18" />}
            {reject && <><path d="M12 12l20 20" /><path d="M32 12L12 32" /></>}
            {review && <><path d="M22 12v12" /><circle cx="22" cy="30" r="1.5" fill="currentColor" stroke="none" /></>}
          </svg>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800 }}>{title}</h1>
        <p style={{ marginTop: 10, padding: '0 12px' }}>{sub}</p>
      </div>

      <div style={{ padding: '0 22px' }}>
        <div className="glass" style={{ padding: 22, borderRadius: 28 }}>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>Total</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.03em', marginBottom: 14 }}>
            {fmtRp(result.finalTotal)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
            <div>
              <div style={{ color: 'var(--text-3)' }}>Tujuan</div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: 2 }}>{intentLabel}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-3)' }}>Tenor</div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: 2 }}>{result.deadlineMonths} bulan</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-3)' }}>Bunga</div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: 2 }}>{result.rate}%</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-3)' }}>Skor</div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: 2 }}>{result.score}/100</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 22px 0' }}>
        <button className="btn lg" onClick={onDone}>Kembali</button>
      </div>
    </div>
  );
}

/* ====================================================================
   HISTORY SCREEN
   ==================================================================== */
function HistoryScreen({ onBack, onOpenItem }) {
  const [filter, setFilter] = React.useState('semua');
  const filters = [
    { id: 'semua', label: 'Semua' },
    { id: 'diterima', label: 'Diterima' },
    { id: 'ditolak', label: 'Ditolak' },
    { id: 'lunas', label: 'Lunas' },
    { id: 'menunggak', label: 'Menunggak' },
  ];
  const items = filter === 'semua' ? HISTORY : HISTORY.filter(i => i.status === filter || (filter === 'menunggak' && i.overdue));
  return (
    <div className="screen screen-enter">
      <PageHeader title="Riwayat" sub="Budi Gunawan" onBack={onBack} />

      <div style={{ padding: '4px 14px 22px' }}>
        <div className="filter-pill">
          {filters.map(f => (
            <button key={f.id} className={filter === f.id ? 'active' : ''} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Belum ada riwayat.</div>
        ) : items.map(item => (
          <HistoryRow key={item.id} item={item} onClick={() => onOpenItem(item)} />
        ))}
      </div>
    </div>
  );
}

/* ====================================================================
   PROFILE SCREEN
   ==================================================================== */
function ProfileScreen({ onBack }) {
  return (
    <div className="screen screen-enter">
      {/* Header: back + avatar + name */}
      <div style={{ padding: '0 22px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button className="back-btn" onClick={onBack}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 5l-7 7 7 7" /></svg>
        </button>
        <div className="glass-circle" style={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IProfileAvatar size={26} color="#fff" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, flex: 1, minWidth: 0 }}>{PROFILE.name}</h1>
      </div>

      {/* Rank hex */}
      <div style={{ padding: '0 22px', marginBottom: 8 }}>
        <RankHex />
        <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'rgb(80,160,235)', marginTop: 4 }}>
          {PROFILE.rank}
        </div>
      </div>

      {/* XP progress */}
      <div style={{ padding: '20px 22px 4px' }}>
        <div className="limit-bar"><div className="fill" style={{ width: `${(PROFILE.xpCurrent / PROFILE.xpMax) * 100}%` }} /></div>
        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
          {PROFILE.xpCurrent}/{PROFILE.xpMax}xp
        </div>
      </div>

      {/* Limit bulan ini */}
      <div style={{ padding: '4px 22px 24px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Limit Bulan Ini</div>
        <div className="limit-bar"><div className="fill" style={{ width: `${PROFILE.limitUsed * 100}%` }} /></div>
      </div>

      {/* Data pribadi */}
      <div style={{ padding: '0 22px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="back-btn" style={{ color: 'var(--green)' }}>
          <IEdit size={20} sw={2} />
        </button>
        <h2 style={{ fontSize: 26, fontWeight: 800 }}>Data Pribadi</h2>
      </div>

      <div style={{ padding: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 22, rowGap: 22 }}>
        <DataPair label="NIK" value={PROFILE.data.NIK} />
        <DataPair label="NAMA BANK" value={PROFILE.data['NAMA BANK']} />
        <DataPair label="NAMA" value={PROFILE.data.NAMA} />
        <DataPair label="PENGHASILAN (per tahun)" value={PROFILE.data['PENGHASILAN (per tahun)']} />
        <DataPair label="UMUR" value={PROFILE.data.UMUR} />
        <DataPair label="STATUS DOMISILI" value={PROFILE.data['STATUS DOMISILI']} />
        <DataPair label="PROFESI" value={PROFILE.data.PROFESI} />
        <DataPair label="Alamat" value={PROFILE.data.Alamat} />
        <DataPair label="LAMA BEKERJA" value={PROFILE.data['LAMA BEKERJA']} />
        <DataPair label="NAMA PERUSAHAAN" value={PROFILE.data['NAMA PERUSAHAAN']} />
      </div>
    </div>
  );
}

/* ====================================================================
   LEADERBOARD SCREEN
   ==================================================================== */
function LeaderboardScreen({ onBack }) {
  return (
    <div className="screen screen-enter">
      <PageHeader title="Leaderboard" sub="periode April - Mei 2026" onBack={onBack} />
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {LEADERBOARD.map(entry => {
          const tone = entry.rankClass === 'gold' ? 'gold' : entry.rankClass === 'bronze' ? 'bronze' : '';
          const shieldFill = entry.rankClass === 'gold' ? '#E5A340' : entry.rankClass === 'bronze' ? '#FF8D80' : '#FF8D80';
          return (
            <div key={entry.rank} className={'lb-row ' + tone + (entry.me ? ' me' : '')}>
              <div className="rank">{entry.rank}</div>
              <div className="lb-arrows">
                <IUpDouble size={16} />
              </div>
              <div className="avatar"><IProfileAvatar size={20} color="#fff" /></div>
              <div className="name">{entry.name}</div>
              <IShieldRank size={22} fill={shieldFill} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.CScreens = {
  HomeScreen, LoanAmount, LoanIntent, LoanDeadline, LoanConfirm, LoanPin, LoanWaiting, LoanResult,
  HistoryScreen, ProfileScreen, LeaderboardScreen,
};
