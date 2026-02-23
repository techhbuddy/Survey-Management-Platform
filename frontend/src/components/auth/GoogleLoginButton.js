// import React from 'react';

// const GOOGLE_LOGO = 'https://developers.google.com/identity/images/g-logo.png';

// const GoogleLoginButton = ({ className = '' }) => {
//   const backend = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
//   const href = `${backend}/api/auth/google`;

//   return (
//     <a
//       href={href}
//       className={`google-btn ${className}`.trim()}
//       aria-label="Sign in with Google"
//       role="button"
//     >
//       <span className="google-btn__logo" aria-hidden>
//         <img src={GOOGLE_LOGO} alt="" width="18" height="18" />
//       </span>
//       <span className="google-btn__text">Sign in with Google</span>
//     </a>
//   );
// };

// export default GoogleLoginButton;

import React from "react";

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    const apiBase =
      process.env.REACT_APP_API_BASE_URL ||
      "http://localhost:5000/api";

    // IMPORTANT: apiBase already contains /api
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <button onClick={handleGoogleLogin} className="google-btn">
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;
