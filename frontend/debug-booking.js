// Debug Booking Page Issues
// Copy và paste vào browser console khi ở trang booking

console.log('🔍 Debugging Booking Page...\n');

// 1. Check current URL and params
const currentUrl = window.location.href;
const pathname = window.location.pathname;
const params = new URLSearchParams(window.location.search);

console.log('📍 URL Info:');
console.log('- Current URL:', currentUrl);
console.log('- Pathname:', pathname);
console.log('- Search params:', params.toString());

// Extract movieId from URL
const movieId = pathname.split('/booking/')[1];
console.log('- Movie ID:', movieId);

// 2. Check if React app is loaded
console.log('\n⚛️ React App Status:');
const reactRoot = document.getElementById('root');
console.log('- React root exists:', !!reactRoot);
console.log('- Root has content:', !!reactRoot?.children.length);

// 3. Check for React components
const bookingComponents = document.querySelectorAll('[class*="booking"]');
console.log('- Booking components found:', bookingComponents.length);

// 4. Check console for actual errors (filter out extension noise)
console.log('\n🚨 Checking for Real Errors:');
const originalError = console.error;
const originalWarn = console.warn;

let realErrors = [];
let realWarnings = [];

console.error = function(...args) {
  const message = args.join(' ');
  // Filter out known extension messages
  if (!message.includes('metadata') && 
      !message.includes('content.js') && 
      !message.includes('siteDubbingRules') &&
      !message.includes('mountUi')) {
    realErrors.push(message);
    originalError.apply(console, args);
  }
};

console.warn = function(...args) {
  const message = args.join(' ');
  if (!message.includes('metadata') && 
      !message.includes('content.js')) {
    realWarnings.push(message);
    originalWarn.apply(console, args);
  }
};

// 5. Test API connectivity
const testMovieAPI = async () => {
  console.log('\n🎬 Testing Movie API...');
  
  if (!movieId) {
    console.log('❌ No movie ID found in URL');
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:8080/api/phim/${movieId}`);
    const result = await response.json();
    
    console.log('✅ Movie API Response:', result);
    
    if (result.code === 200) {
      console.log('✅ Movie data loaded successfully');
      console.log('- Movie name:', result.data.tenPhim);
      console.log('- Showtimes:', result.data.listSuatChieu?.length || 0);
    } else {
      console.log('❌ Movie API returned error:', result.message);
    }
  } catch (error) {
    console.log('❌ Movie API fetch failed:', error.message);
  }
};

// 6. Check React Router
const checkRouter = () => {
  console.log('\n🧭 React Router Status:');
  
  // Check if we're in the right route
  const expectedRoute = `/booking/${movieId}`;
  const isCorrectRoute = pathname === expectedRoute;
  
  console.log('- Expected route:', expectedRoute);
  console.log('- Current route:', pathname);
  console.log('- Route match:', isCorrectRoute);
  
  if (!isCorrectRoute) {
    console.log('⚠️ Route mismatch detected');
  }
};

// 7. Check for missing dependencies
const checkDependencies = () => {
  console.log('\n📦 Checking Dependencies:');
  
  // Check if common libraries are loaded
  const checks = {
    'React': typeof React !== 'undefined',
    'ReactDOM': typeof ReactDOM !== 'undefined', 
    'React Router': !!window.location,
    'Fetch API': typeof fetch !== 'undefined'
  };
  
  Object.entries(checks).forEach(([name, exists]) => {
    console.log(`- ${name}: ${exists ? '✅' : '❌'}`);
  });
};

// 8. Network tab guidance
const networkGuidance = () => {
  console.log('\n🌐 Network Debugging:');
  console.log('1. Open Network tab in DevTools');
  console.log('2. Reload the page');
  console.log('3. Look for failed requests (red status)');
  console.log('4. Check API calls to localhost:8080');
  console.log('5. Verify all assets load correctly');
};

// Run all checks
const runDiagnostics = async () => {
  console.log('🏥 Running Booking Page Diagnostics...\n');
  
  checkRouter();
  checkDependencies();
  await testMovieAPI();
  networkGuidance();
  
  // Report findings
  setTimeout(() => {
    console.log('\n📊 Diagnostic Summary:');
    console.log('- Real errors found:', realErrors.length);
    console.log('- Real warnings found:', realWarnings.length);
    
    if (realErrors.length > 0) {
      console.log('\n🚨 Real Errors to Fix:');
      realErrors.forEach(error => console.log('❌', error));
    }
    
    if (realWarnings.length > 0) {
      console.log('\n⚠️ Real Warnings:');
      realWarnings.forEach(warn => console.log('⚠️', warn));
    }
    
    if (realErrors.length === 0 && realWarnings.length === 0) {
      console.log('✅ No real errors detected - extension messages are normal');
    }
    
    // Restore original console methods
    console.error = originalError;
    console.warn = originalWarn;
  }, 2000);
};

// Instructions for user
console.log(`
🎯 Booking Page Debugger Ready!

The messages you see about "metadata.js", "content.js", and "siteDubbingRules" 
are from browser extensions (likely translation extensions) and are NORMAL.
They don't affect your React app.

Run: debugBooking.runDiagnostics()

Or check individual parts:
- debugBooking.testMovieAPI()      // Test API connection
- debugBooking.checkRouter()       // Check routing
- debugBooking.checkDependencies() // Check if React loaded
`);

// Export functions
window.debugBooking = {
  runDiagnostics,
  testMovieAPI,
  checkRouter,
  checkDependencies,
  realErrors,
  realWarnings
};

// Auto-run diagnostics
runDiagnostics();