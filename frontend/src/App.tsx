
import { Routes, Route, Link } from 'react-router-dom';
import RoutesList from './views/RoutesList';
import RouteDetail from './views/RouteDetail';
import { MapIcon } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b px-6 py-4 flex items-center shadow-sm">
        <MapIcon className="text-indigo-600 mr-2" />
        <Link to="/" className="text-xl font-bold text-slate-800">
          WAWA Transport
        </Link>
      </nav>

      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<RoutesList />} />
          <Route path="/routes/:id" element={<RouteDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
