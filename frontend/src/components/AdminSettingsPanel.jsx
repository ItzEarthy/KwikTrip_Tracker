import { useState, useEffect } from "react";

const API_BASE = `${window.location.origin}/api`;

export default function AdminSettingsPanel({ userId }) {
  const [settings, setSettings] = useState({
    max_photos: '3',
    allow_photos: '1'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/settings?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/admin/settings?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, [key]: String(value) }));
        setMessage('✅ Settings updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to update settings');
      }
    } catch (error) {
      setMessage('❌ Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">📸 Photo Upload Settings</h3>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.allow_photos === '1'}
              onChange={(e) => handleUpdate('allow_photos', e.target.checked ? '1' : '0')}
              disabled={saving}
              className="w-5 h-5"
            />
            <span className="font-medium">Allow Photo Uploads</span>
          </label>
          <p className="text-sm text-gray-600 ml-8 mt-1">
            When disabled, users cannot upload photos with their reviews
          </p>
        </div>

        <div>
          <label className="block font-medium mb-2">
            Maximum Photos Per Review
          </label>
          <select
            value={settings.max_photos}
            onChange={(e) => handleUpdate('max_photos', e.target.value)}
            disabled={saving || settings.allow_photos === '0'}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="1">1 photo</option>
            <option value="2">2 photos</option>
            <option value="3">3 photos</option>
            <option value="4">4 photos</option>
            <option value="5">5 photos</option>
            <option value="10">10 photos</option>
          </select>
          <p className="text-sm text-gray-600 mt-1">
            Maximum number of photos users can upload per review
          </p>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Current Configuration:</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• Photos Allowed: <strong>{settings.allow_photos === '1' ? 'Yes' : 'No'}</strong></li>
            <li>• Max Photos: <strong>{settings.max_photos}</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
