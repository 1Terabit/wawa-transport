import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function RouteForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [points, setPoints] = useState<{ lat: string; lng: string; name: string }[]>([
    { lat: '', lng: '', name: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) {
      fetchRoute();
    }
  }, [id]);

  const fetchRoute = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/routes/${id}`);
      if (!res.ok) throw new Error('Failed to fetch route');
      const data = await res.json();
      setName(data.name);
      if (data.points && data.points.length > 0) {
        setPoints(data.points.map((p: any) => ({
          lat: p.lat.toString(),
          lng: p.lng.toString(),
          name: p.name || ''
        })));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoint = () => {
    setPoints([...points, { lat: '', lng: '', name: '' }]);
  };

  const handleRemovePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  const handlePointChange = (index: number, field: keyof typeof points[0], value: string) => {
    const newPoints = [...points];
    newPoints[index][field] = value;
    setPoints(newPoints);
  };

  const handleMapClick = (e: any) => {
    const lat = e.lngLat.lat.toFixed(6);
    const lng = e.lngLat.lng.toFixed(6);
    
    const lastPoint = points[points.length - 1];
    if (lastPoint && !lastPoint.lat && !lastPoint.lng && !lastPoint.name) {
      const newPoints = [...points];
      newPoints[points.length - 1] = { lat, lng, name: `Punto ${points.length}` };
      setPoints(newPoints);
    } else {
      setPoints([...points, { lat, lng, name: `Punto ${points.length + 1}` }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formattedPoints = points.map((p, i) => {
        const lat = parseFloat(p.lat);
        const lng = parseFloat(p.lng);
        if (isNaN(lat) || isNaN(lng)) throw new Error(`Invalid coordinates at point ${i + 1}`);
        return { lat, lng, name: p.name, orderIdx: i };
      });

      const payload = { name, points: formattedPoints };
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = isEditing ? `${apiUrl}/routes/${id}` : `${apiUrl}/routes`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save route');
      
      const data = await res.json();
      navigate(`/routes/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? 'Editar Ruta' : 'Crear Nueva Ruta'}</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow border h-fit">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Ruta</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Ruta Norte - Sur"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Puntos (Haz clic en el mapa)</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddPoint}>
                + Manual
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {points.map((point, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 border rounded-md">
                  <div className="text-gray-500 font-mono mt-2">{index + 1}.</div>
                  <div className="flex-1 grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre (opcional)"
                      value={point.name}
                      onChange={e => handlePointChange(index, 'name', e.target.value)}
                      className="border p-2 rounded text-sm w-full"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        required
                        placeholder="Latitud"
                        value={point.lat}
                        onChange={e => handlePointChange(index, 'lat', e.target.value)}
                        className="border p-2 rounded text-sm w-1/2"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Longitud"
                        value={point.lng}
                        onChange={e => handlePointChange(index, 'lng', e.target.value)}
                        className="border p-2 rounded text-sm w-1/2"
                      />
                    </div>
                  </div>
                  {points.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Eliminar punto"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar Ruta' : 'Crear Ruta')}
            </Button>
          </div>
        </form>

        <div className="bg-slate-100 rounded-lg overflow-hidden border shadow h-[600px] relative">
          <Map
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            initialViewState={{
              longitude: -58.3816, // Buenos Aires (Obelisco)
              latitude: -34.6037,
              zoom: 11
            }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            onClick={handleMapClick}
            cursor="crosshair"
          >
            {points.map((p, i) => {
              const lat = parseFloat(p.lat);
              const lng = parseFloat(p.lng);
              if (isNaN(lat) || isNaN(lng)) return null;
              return (
                <Marker key={i} longitude={lng} latitude={lat} color="#4f46e5">
                  <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                    {i + 1}
                  </div>
                </Marker>
              );
            })}
          </Map>
          <div className="absolute top-4 left-4 bg-white/90 p-3 rounded shadow text-sm font-medium z-10 pointer-events-none border border-slate-200">
            🖱️ Haz clic en el mapa para agregar paradas
          </div>
        </div>
      </div>
    </div>
  );
}
