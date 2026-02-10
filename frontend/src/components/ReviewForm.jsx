import { useState, useEffect } from "react";

const API_BASE = `${window.location.origin}/api`;

const StarRating = ({ label, value, onChange, disabled = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHover(star)}
            onMouseLeave={() => !disabled && setHover(0)}
            className={`text-2xl transition-colors ${
              disabled ? 'cursor-default' : 'cursor-pointer'
            }`}
            style={{
              color: star <= (hover || value) ? '#facc15' : '#d1d5db',
              filter: star <= (hover || value) ? 'drop-shadow(0 0 2px rgba(250,204,21,0.5))' : 'none'
            }}
          >
            ★
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-gray-600 self-center">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
};

export default function ReviewForm({ visitId, storeNumber, onSuccess, onCancel, existingReview }) {
  const [ratings, setRatings] = useState({
    overall: 0,
    clean: 0,
    staff: 0,
    hotspot: 0,
    bathroom: 0,
    vibe: 0
  });
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPreviewURLs, setPhotoPreviewURLs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appSettings, setAppSettings] = useState({ max_photos: 3, allow_photos: true });
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch app settings
    fetch(`${API_BASE}/admin/settings?userId=${localStorage.getItem("userId")}`)
      .then(res => res.ok ? res.json() : { max_photos: '3', allow_photos: '1' })
      .then(settings => {
        setAppSettings({
          max_photos: parseInt(settings.max_photos || '3'),
          allow_photos: settings.allow_photos === '1'
        });
      })
      .catch(() => {
        setAppSettings({ max_photos: 3, allow_photos: true });
      });
  }, []);

  // Prefill when editing
  useEffect(() => {
    if (existingReview) {
      const r = existingReview;
      setRatings({
        overall: r.ratings?.overall || 0,
        clean: r.ratings?.clean || 0,
        staff: r.ratings?.staff || 0,
        hotspot: r.ratings?.hotspot || 0,
        bathroom: r.ratings?.bathroom || 0,
        vibe: r.ratings?.vibe || 0,
      });
      setComment(r.comment || "");

      // Prefill existing photos as preview URLs (won't be removable server-side yet)
      if (r.photos && r.photos.length > 0) {
        setPhotoPreviewURLs(r.photos.map(p => `${API_BASE}/uploads/${p.filePath}`));
      }
    }
  }, [existingReview]);

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const maxPhotos = appSettings.max_photos;

    if (files.length + photos.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setError("");
    setPhotos(prev => [...prev, ...files]);

    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviewURLs(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewURLs(prev => prev.filter((_, i) => i !== index));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userId = localStorage.getItem("userId");
      const formData = new FormData();
      
      formData.append("userId", userId);
      formData.append("storeNumber", storeNumber);
      formData.append("comment", comment);
      
      Object.entries(ratings).forEach(([key, value]) => {
        if (value > 0) {
          formData.append(`rating${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
        }
      });

      photos.forEach(photo => {
        formData.append("photos", photo);
      });

      const response = await fetch(`${API_BASE}/visits/${visitId}/review`, {
        method: "POST",
        body: formData
      });

      // Try to parse JSON from a clone, fallback to text from the original if parsing fails
      let parsed;
      try {
        parsed = await response.clone().json();
      } catch (e) {
        try {
          parsed = await response.text();
        } catch (e2) {
          parsed = null;
        }
      }

      if (!response.ok) {
        // parsed may be a string (HTML/text) or an object
        const msg = typeof parsed === 'string' ? parsed : (parsed && parsed.error) ? parsed.error : 'Failed to submit review';
        throw new Error(msg.replace(/\n|<[^>]*>/g, ' ').trim());
      }

      const result = parsed;
      setLoading(false);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const hasAnyRating = Object.values(ratings).some(r => r > 0);
  const canSubmit = hasAnyRating || comment.trim() || photos.length > 0;

  return (
    <div className="review-form bg-white rounded-lg p-4 max-w-lg">
      <h3 className="text-lg font-bold mb-4">Add Review</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          <StarRating 
            label="⭐ Overall" 
            value={ratings.overall} 
            onChange={(v) => handleRatingChange('overall', v)}
            disabled={loading}
          />
          <StarRating 
            label="🧼 Cleanliness" 
            value={ratings.clean} 
            onChange={(v) => handleRatingChange('clean', v)}
            disabled={loading}
          />
          <StarRating 
            label="👥 Staff" 
            value={ratings.staff} 
            onChange={(v) => handleRatingChange('staff', v)}
            disabled={loading}
          />
          <StarRating 
            label="☕ Hotspot" 
            value={ratings.hotspot} 
            onChange={(v) => handleRatingChange('hotspot', v)}
            disabled={loading}
          />
          <StarRating 
            label="🚻 Bathroom" 
            value={ratings.bathroom} 
            onChange={(v) => handleRatingChange('bathroom', v)}
            disabled={loading}
          />
          <StarRating 
            label="✨ Vibe" 
            value={ratings.vibe} 
            onChange={(v) => handleRatingChange('vibe', v)}
            disabled={loading}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">💬 Comment (Friends Only)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
            placeholder="Share your thoughts with friends..."
            className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
        </div>

        {appSettings.allow_photos && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              📷 Photos (Friends Only) — Max {appSettings.max_photos}
            </label>
            
            {photoPreviewURLs.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {photoPreviewURLs.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      disabled={loading}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {photos.length < appSettings.max_photos && (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                disabled={loading}
                className="w-full text-sm"
              />
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
