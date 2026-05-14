// cicil.in app — routing & state
const { mockPredict } = window.CData;
const { NavDock } = window.CComp;
const S = window.CScreens;

function App() {
  // Routes:
  //   home | loan-amount | loan-intent | loan-deadline | loan-confirm | loan-pin | loan-waiting | loan-result
  //   history | leaderboard | profile
  const [route, setRoute] = React.useState('home');
  const [form, setForm] = React.useState({ loan_amnt: 3500000, loan_intent: null, deadline: null });
  const [result, setResult] = React.useState(null);

  const startLoan = () => {
    setForm({ loan_amnt: 0, loan_intent: null, deadline: null });
    setRoute('loan-amount');
  };

  const submitLoan = () => {
    setRoute('loan-waiting');
    setTimeout(() => {
      setResult(mockPredict(form));
      setRoute('loan-result');
    }, 2400);
  };

  // Active tab in nav dock — derived from route
  const tab = (
    route === 'home' ? 'home' :
    route === 'history' ? 'history' :
    route === 'profile' ? 'profile' :
    route === 'leaderboard' ? 'leaderboard' :
    route.startsWith('loan-') ? 'new' : null
  );

  const showNav = ['home','history','profile','leaderboard','loan-amount','loan-intent','loan-deadline','loan-confirm','loan-pin','loan-waiting','loan-result'].includes(route);

  const onTab = (id) => {
    if (id === 'new') startLoan();
    else if (id === 'home') setRoute('home');
    else if (id === 'history') setRoute('history');
    else if (id === 'profile') setRoute('profile');
    else if (id === 'leaderboard') setRoute('leaderboard');
  };

  let content = null;
  if (route === 'home') {
    content = <S.HomeScreen
      onNewApp={startLoan}
      onOpenItem={() => setRoute('history')}
      onPay={() => {}}
    />;
  } else if (route === 'loan-amount') {
    content = <S.LoanAmount form={form} setForm={setForm}
      onBack={() => setRoute('home')}
      onNext={() => setRoute('loan-intent')} />;
  } else if (route === 'loan-intent') {
    content = <S.LoanIntent form={form} setForm={setForm}
      onBack={() => setRoute('loan-amount')}
      onNext={() => setRoute('loan-deadline')} />;
  } else if (route === 'loan-deadline') {
    content = <S.LoanDeadline form={form} setForm={setForm}
      onBack={() => setRoute('loan-intent')}
      onNext={() => setRoute('loan-confirm')} />;
  } else if (route === 'loan-confirm') {
    content = <S.LoanConfirm form={form}
      onBack={() => setRoute('loan-deadline')}
      onNext={() => setRoute('loan-pin')} />;
  } else if (route === 'loan-pin') {
    content = <S.LoanPin
      onBack={() => setRoute('loan-confirm')}
      onSubmit={submitLoan} />;
  } else if (route === 'loan-waiting') {
    content = <S.LoanWaiting />;
  } else if (route === 'loan-result') {
    content = <S.LoanResult result={result} form={form} onDone={() => setRoute('home')} />;
  } else if (route === 'history') {
    content = <S.HistoryScreen onBack={() => setRoute('home')} onOpenItem={() => {}} />;
  } else if (route === 'profile') {
    content = <S.ProfileScreen onBack={() => setRoute('home')} />;
  } else if (route === 'leaderboard') {
    content = <S.LeaderboardScreen onBack={() => setRoute('home')} />;
  }

  return (
    <>
      <ScreenMount>{content}</ScreenMount>
      {showNav && <NavMount><NavDock tab={tab} onTab={onTab} /></NavMount>}
      <DevNavMount><DevNav route={route} onJump={(id) => { if (id === 'new') startLoan(); else setRoute(id); }} /></DevNavMount>
    </>
  );
}

function DevNav({ route, onJump }) {
  const opts = [
    ['Home', 'home'],
    ['New loan', 'new'],
    ['Amount', 'loan-amount'],
    ['Intent', 'loan-intent'],
    ['Deadline', 'loan-deadline'],
    ['Confirm', 'loan-confirm'],
    ['PIN', 'loan-pin'],
    ['Waiting', 'loan-waiting'],
    ['Result', 'loan-result'],
    ['History', 'history'],
    ['Leaderboard', 'leaderboard'],
    ['Profile', 'profile'],
  ];
  return (
    <>
      {opts.map(([label, id]) => (
        <button key={id} className={route === id ? 'active' : ''} onClick={() => onJump(id)}>{label}</button>
      ))}
    </>
  );
}

// Portal mounts
function ScreenMount({ children }) {
  const ref = React.useRef(document.getElementById('screen-wrap'));
  return ReactDOM.createPortal(children, ref.current);
}
function NavMount({ children }) {
  const ref = React.useRef(document.getElementById('nav-mount'));
  return ReactDOM.createPortal(children, ref.current);
}
function DevNavMount({ children }) {
  const ref = React.useRef(document.getElementById('dev-nav'));
  return ReactDOM.createPortal(children, ref.current);
}

ReactDOM.createRoot(document.createElement('div')).render(<App />);
