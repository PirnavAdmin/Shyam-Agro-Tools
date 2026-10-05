const fs = require('fs');
const filePath = 'c:/Users/ADMIN/OneDrive/Desktop/Project Code/Shyam-Agro-Tools/frontend/src/USER/pages/CheckoutPage.js';
const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
let startIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('if (error && !checkoutSummary) {')) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  const replacement = [
    '  if (error && !checkoutSummary) {',
    '    return (',
    '      <div className="checkout-page-shell flex flex-col min-h-screen bg-[#f8f9fa]">',
    '        <Header onLoginClick={() => setIsLoginOpen(true)} />',
    '        <main className="checkout-container">',
    '          <div className="checkout-card text-center py-12">',
    '            <p className="mb-4 text-red-600 font-semibold">{error}</p>',
    '            <button type="button" onClick={loadCheckoutSummary} className="btn-primary py-2 px-6">Retry</button>',
    '          </div>',
    '        </main>',
    '        <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />',
    '      </div>',
    '    );',
    '  }'
  ];
  lines.splice(startIdx, 16, ...replacement);
  fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
  console.log('CLEAN REPLACEMENT SUCCESS');
} else {
  console.log('NOT FOUND');
}
