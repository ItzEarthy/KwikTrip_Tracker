import { useState, useEffect } from "react";

const API_BASE = `${window.location.origin}/api`;

const RatingBar = ({ label, rating, icon }) => {
  if (!rating) return null;
  
  const percentage = (rating / 5) * 100;
  const color = rating >= 4 ? '#16a34a' : rating >= 3 ? '#facc15' : '#dc2626';
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 text-gray-700" title={label}>{icon}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-12 text-right font-medium" style={{ color }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default function StoreStats({ storeNumber, compact = false }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/locations/${storeNumber}/stats`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [storeNumber]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading ratings...</div>;
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No ratings yet. Be the first to review!
      </div>
    );
  }

  const { ratings, totalReviews } = stats;

  if (compact) {
    const avgRating = ratings.overall || 
      (Object.values(ratings).filter(r => r !== null).reduce((a, b) => a + b, 0) / 
       Object.values(ratings).filter(r => r !== null).length);
    
    if (!avgRating) return null;

    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-yellow-500 text-lg">★</span>
        <span className="font-semibold">{avgRating.toFixed(1)}</span>
        <span className="text-gray-600">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
      </div>
    );
  }

  return (
    <div className="store-stats bg-gray-50 rounded-lg p-3 mt-2">
      <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
        ✨ Vibe Check
        <span className="text-xs font-normal text-gray-600">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      </h4>
      <div className="space-y-1.5">
        <RatingBar label="Overall" rating={ratings.overall} icon="⭐ Overall" />
        <RatingBar label="Clean" rating={ratings.clean} icon="🧼 Clean" />
        <RatingBar label="Staff" rating={ratings.staff} icon="👥 Staff" />
        <RatingBar label="Hotspot" rating={ratings.hotspot} icon="☕ Hotspot" />
        <RatingBar label="Bathroom" rating={ratings.bathroom} icon="🚻 Bathroom" />
        <RatingBar label="Vibe" rating={ratings.vibe} icon="✨ Vibe" />
      </div>
    </div>
  );
}
