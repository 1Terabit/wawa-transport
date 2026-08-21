import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function RouteDetail() {
  const { id } = useParams();
  const [route, setRoute] = useState<any>(null);
  
  // Form states
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formVehicle, setFormVehicle] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{reason: string, metrics: any} | null>(null);

  const [routeGeometry, setRouteGeometry] = useState<any>(null);

  const fetchRoute = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/routes/${id}`);
      const data = await res.json();
      setRoute(data);

      if (data.points && data.points.length > 1) {
        const coords = data.points.map((p: any) => `${p.lng},${p.lat}`).join(';');
        const dirRes = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`);
        const dirData = await dirRes.json();
        if (dirData.routes && dirData.routes.length > 0) {
          setRouteGeometry(dirData.routes[0].geometry);
        }
      }
    } catch (error) {
      console.error("Error fetching route data:", error);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [id]);

  const handleAssignDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Necesitamos el UUID del vehículo, pero la UI pide la patente para simplificar. 
      // Si estuviéramos en un escenario completo tendríamos un select de vehículos.
      // Acá para el MVP, enviaremos el ID tal cual o asumiremos que ingresan el ID.
      // NOTA: Como la BD exige vehicleId, asumimos que se ingresa el UUID o un auto-lookup.
      // Para no complicarla, le pedimos al backend que asigne... Wait! El backend pide vehicleId.
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/duties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: id,
          vehicleId: formVehicle, // Asumimos que escriben el UUID del vehículo
          startTime: formStart,
          endTime: formEnd,
        })
      });
      
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Error al asignar');
      }
      
      // Limpiar form y recargar
      setFormStart('');
      setFormEnd('');
      setFormVehicle('');
      setAiSuggestion(null);
      fetchRoute();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!formStart || !formEnd) {
      setError('Por favor, selecciona una fecha de Inicio y Fin para que la IA pueda buscar vehículos disponibles.');
      return;
    }
    
    setError('');
    setIsAiLoading(true);
    setAiSuggestion(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/ai/suggest-vehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: formStart,
          endTime: formEnd,
        })
      });
      
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Error al obtener sugerencia de IA');
      }
      
      if (!result.suggestion.vehicleId) {
        throw new Error('La IA determinó que no hay vehículos disponibles para esta franja horaria.');
      }
      
      setFormVehicle(result.suggestion.vehicleId);
      setAiSuggestion({
        reason: result.suggestion.reason,
        metrics: result.metrics
      });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!route) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (route.statusCode === 404 || !route.points) return (
    <div className="max-w-6xl mx-auto mt-12 text-center">
      <h2 className="text-2xl font-bold text-slate-800">Ruta no encontrada</h2>
      <p className="text-slate-500 mt-2 mb-6">La ruta a la que intentás acceder no existe o fue eliminada.</p>
      <Link to="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
        Volver a la lista de Rutas
      </Link>
    </div>
  );

  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: routeGeometry || {
      type: 'LineString',
      coordinates: route.points.map((p: any) => [p.lng, p.lat])
    }
  };

  const lineStyle = {
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#4f46e5', 'line-width': 4 }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-800 mb-4 inline-block">
        ← Volver a Rutas
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
        <div className="lg:col-span-2 rounded-xl overflow-hidden border shadow-sm relative bg-slate-100">
          <Map
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            initialViewState={{
              longitude: route.points[0]?.lng || -58.3816,
              latitude: route.points[0]?.lat || -34.6037,
              zoom: 13
            }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
          >
            {route.points.length > 1 && (
              <Source id="route" type="geojson" data={geojson as any}>
                <Layer {...lineStyle as any} />
              </Source>
            )}
            {route.points.map((p: any, idx: number) => (
              <Marker key={p.id} longitude={p.lng} latitude={p.lat}>
                <div className="bg-white border-2 border-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-md">
                  {idx + 1}
                </div>
              </Marker>
            ))}
          </Map>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border overflow-y-auto flex flex-col">
          <h2 className="text-2xl font-bold text-slate-800">{route.name}</h2>
          <p className="text-sm text-slate-500 mb-6 font-mono">ID: {route.id}</p>
          
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Duties Asignados</h3>
          
          {route.duties?.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center">
              Esta ruta no tiene duties asignados.
            </div>
          ) : (
            <ul className="space-y-4 flex-1 mb-6">
              {route.duties.map((d: any) => (
                <li key={d.id} className="border border-slate-200 p-4 rounded-lg bg-slate-50 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700 text-sm">🚗 Unidad {d.vehicle?.plate}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Inicio</p>
                      <p className="font-medium text-slate-800">{new Date(d.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Fin</p>
                      <p className="font-medium text-slate-800">{new Date(d.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Formulario de Asignación */}
          <div className="mt-auto border-t pt-4">
            <h4 className="font-bold text-slate-700 mb-3 text-sm">Asignar Nuevo Vehículo</h4>
            
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAssignDuty} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">ID del Vehículo</label>
                <input 
                  required
                  type="text" 
                  value={formVehicle}
                  onChange={(e) => setFormVehicle(e.target.value)}
                  placeholder="Ej. WAWA-001" 
                  className="w-full border rounded-md p-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Inicio</label>
                  <input 
                    required
                    type="datetime-local" 
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full border rounded-md p-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Fin</label>
                  <input 
                    required
                    type="datetime-local" 
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full border rounded-md p-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Asignando...' : 'Asignar Duty'}
              </button>

              <button 
                type="button"
                onClick={handleAiSuggest}
                disabled={isAiLoading || isSubmitting}
                className="w-full mt-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isAiLoading ? 'Pensando...' : '✨ Asignación Inteligente (IA)'}
              </button>
            </form>

            {aiSuggestion && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-800 font-medium leading-relaxed">
                  🤖 {aiSuggestion.reason}
                </p>
                <div className="mt-2 text-[10px] text-purple-600 font-mono opacity-80 flex gap-3">
                  <span>🪙 Prompt: {aiSuggestion.metrics.promptTokens}</span>
                  <span>🪙 Respuesta: {aiSuggestion.metrics.candidatesTokens}</span>
                  <span>📈 Total: {aiSuggestion.metrics.totalTokens}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
