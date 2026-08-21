import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function RoutesList() {
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetch(`${apiUrl}/routes`)
      .then(res => res.json())
      .then(data => setRoutes(data));
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Rutas de Transporte</h1>
        <button 
          onClick={() => alert("Usa Swagger (/docs) para crear rutas en el MVP")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium"
        >
          + Nueva Ruta
        </button>
      </div>
      
      {routes.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          No hay rutas creadas. Corre `pnpm run seed` en el backend o usa Swagger.
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 font-semibold text-slate-600">ID</th>
              <th className="pb-3 font-semibold text-slate-600">Nombre</th>
              <th className="pb-3 font-semibold text-slate-600">Puntos</th>
              <th className="pb-3 font-semibold text-slate-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(r => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="py-4 text-sm text-slate-500 font-mono">{r.id.substring(0, 8)}</td>
                <td className="py-4 font-medium text-slate-800">{r.name}</td>
                <td className="py-4 text-sm text-slate-600">{r.points?.length || 0} stops</td>
                <td className="py-4">
                  <Link 
                    to={`/routes/${r.id}`} 
                    className="text-indigo-600 font-medium hover:text-indigo-800 text-sm flex items-center"
                  >
                    Ver Detalle →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
