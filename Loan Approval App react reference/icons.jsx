// cicil.in icon set — simple SF-Pro-style stroke icons drawn in SVG.
const Ico = ({ size = 24, sw = 1.75, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

const IChevLeft  = (p) => <Ico {...p}><path d="M14.5 5l-7 7 7 7" /></Ico>;
const IChevRight = (p) => <Ico {...p}><path d="M9.5 5l7 7-7 7" /></Ico>;
const ISearch    = (p) => <Ico {...p}><circle cx="11" cy="11" r="7.5"/><path d="M17 17l4 4"/></Ico>;
const IEdit      = (p) => <Ico {...p}><path d="M14 4l6 6L9 21H3v-6L14 4z"/></Ico>;

// Solid-filled home icon (cicil.in version: filled house silhouette)
const IHomeSolid = ({ size = 24, color = "currentColor", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 23 24" fill={color} {...p}>
    <path d="M 12.715 0.455 C 12.37 0.161 11.931 0 11.478 0 C 11.025 0 10.587 0.161 10.241 0.455 L 0.676 8.593 C 0.464 8.773 0.294 8.997 0.177 9.25 C 0.061 9.502 0 9.777 0 10.056 L 0 22.082 C 0 22.59 0.202 23.078 0.56 23.438 C 0.919 23.798 1.406 24 1.913 24 L 7.971 24 C 8.225 24 8.468 23.899 8.647 23.719 C 8.827 23.539 8.928 23.295 8.928 23.041 L 8.928 15.048 L 14.029 15.048 L 14.029 23.041 C 14.029 23.57 14.458 24 14.986 24 L 21.043 24 C 21.551 24 22.037 23.798 22.396 23.438 C 22.755 23.798 22.957 22.59 22.957 22.082 L 22.957 10.056 C 22.956 9.777 22.896 9.502 22.779 9.25 C 22.663 8.997 22.492 8.773 22.281 8.593 Z" />
  </svg>
);

const IPlus = ({ size = 22, color = "currentColor", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill={color} {...p}>
    <rect x="10" y="0" width="2" height="22" rx="0.5"/>
    <rect x="0" y="10" width="22" height="2" rx="0.5"/>
  </svg>
);

// Leaderboard: 3 ascending bars
const ILeaderboard = ({ size = 22, color = "currentColor", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill={color} {...p}>
    <rect x="1" y="11" width="4" height="10" rx="1"/>
    <rect x="9" y="6"  width="4" height="15" rx="1"/>
    <rect x="17" y="1" width="4" height="20" rx="1"/>
  </svg>
);

// History: speech-bubble / chat icon (cicil uses a Q-shape)
const IHistory = ({ size = 22, color = "currentColor", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M11 2a8 8 0 1 1-5.5 13.8L2 17l1.3-3.5A8 8 0 0 1 11 2z"/>
    <path d="M13 14l3 3"/>
  </svg>
);

// Profile silhouette (head + shoulders)
const IProfile = ({ size = 22, color = "currentColor", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...p}>
    <circle cx="12" cy="7" r="4.5"/>
    <path d="M2 22c.6-4.7 4.6-8.5 10-8.5S21.4 17.3 22 22z"/>
  </svg>
);

// Double up-chevron (leaderboard arrow)
const IUpDouble = ({ size = 16, ...p }) => (
  <Ico size={size} sw={2.6} {...p}>
    <path d="M5 13l7-7 7 7M5 18l7-7 7 7"/>
  </Ico>
);

// Shield icon for leaderboard rank
const IShieldRank = ({ size = 22, fill = "#FF8D80", ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} {...p}>
    <path d="M12 1.5l9 3.5v6.5c0 5-3.7 9.4-9 10.5-5.3-1.1-9-5.5-9-10.5V5l9-3.5z"/>
  </svg>
);

window.Icons = {
  IChevLeft, IChevRight, ISearch, IEdit,
  IHomeSolid, IPlus, ILeaderboard, IHistory, IProfile,
  IUpDouble, IShieldRank,
};
