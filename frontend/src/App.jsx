import './App.css'
import { ToastProvider } from './components/common/Toast';
import Router from './router';

function App() {
  return (
    <ToastProvider>
      <Router />
    </ToastProvider>
  );
}

export default App;
