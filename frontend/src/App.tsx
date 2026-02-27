import React, { useState } from 'react';
import { Captcha } from './components/Captcha';

function App() {
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 antialiased font-sans">
      <div className="w-full max-w-sm">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Captcha Demo</h2>
        <Captcha onSuccess={() => setIsCaptchaVerified(true)} />
        {isCaptchaVerified && (
          <p className="mt-4 text-center text-green-600 font-medium text-sm">
            Captcha Verified Successfully!
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
