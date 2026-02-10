import { useState, useEffect } from "react";
import { useFocus } from "../contexts/FocusContext";

const API_BASE = `${window.location.origin}/api`;

const StarDisplay = ({ rating }) => {
  if (!rating) return <span className="text-gray-400">—</span>;
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className="text-sm"
          style={{ color: star <= rating ? '#facc15' : '#d1d5db' }}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-gray-600 ml-1">{rating}/5</span>
    </div>
  );
};

const ReviewCard = ({ review, onEdit }) => {
  const hasRatings = Object.values(review.ratings).some(r => r !== null && r !== undefined);
  const canSeePrivate = !review.isPrivate;
  const currentUserId = parseInt(localStorage.getItem('userId'), 10);
  const isAuthor = currentUserId && review.userId && parseInt(review.userId, 10) === currentUserId;

  return (
    <div className="bg-white border rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-semibold text-gray-900">{review.nickname}</span>
          <span className="text-xs text-gray-500 ml-2">
            {new Date(review.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div>
          {isAuthor && onEdit && (
            <button
              onClick={() => onEdit(review)}
              className="text-sm text-blue-600 hover:underline mr-1"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {hasRatings && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          {review.ratings.overall && (
            <div>
              <span className="text-gray-600">⭐ Overall:</span>
              <StarDisplay rating={review.ratings.overall} />
            </div>
          )}
          {review.ratings.clean && (
            <div>
              <span className="text-gray-600">🧼 Clean:</span>
              <StarDisplay rating={review.ratings.clean} />
            </div>
          )}
          {review.ratings.staff && (
            <div>
              <span className="text-gray-600">👥 Staff:</span>
              <StarDisplay rating={review.ratings.staff} />
            </div>
          )}
          {review.ratings.hotspot && (
            <div>
              <span className="text-gray-600">☕ Hotspot:</span>
              <StarDisplay rating={review.ratings.hotspot} />
            </div>
          )}
          {review.ratings.bathroom && (
            <div>
              <span className="text-gray-600">🚻 Bathroom:</span>
              <StarDisplay rating={review.ratings.bathroom} />
            </div>
          )}
          {review.ratings.vibe && (
            <div>
              <span className="text-gray-600">✨ Vibe:</span>
              <StarDisplay rating={review.ratings.vibe} />
            </div>
          )}
        </div>
      )}

      {canSeePrivate ? (
        <>
          {review.comment && (
            <p className="text-gray-700 text-sm mb-2 italic">"{review.comment}"</p>
          )}
          
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {review.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={`${API_BASE}/uploads/${photo.filePath}`}
                  alt="Review photo"
                  className="w-24 h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                  onClick={() => window.open(`${API_BASE}/uploads/${photo.filePath}`, '_blank')}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        // Only show privacy note if there's something private to view
        (review.comment || (review.photos && review.photos.length > 0)) ? (
          <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
            🔒 Comment and photos are only visible to friends
          </div>
        ) : null
      )}
    </div>
  );
};

export default function StoreActivity({ storeNumber, onClose, onEdit, onBringTo }) {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const { requestFocus } = useFocus();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    fetch(`${API_BASE}/locations/${storeNumber}/activity?requesterId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setActivity(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [storeNumber]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">Loading activity...</div>
      </div>
    );
  }

  if (!activity || activity.reviews.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No reviews yet for this location.</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-3 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="store-activity max-h-96 overflow-y-auto p-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">Recent Reviews</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onBringTo) {
                onBringTo(storeNumber);
              } else {
                requestFocus(storeNumber);
                window.location.href = '/map';
              }
            }}
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
          >
            Bring me to
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {activity.reviews.map((review) => (
        <ReviewCard key={review.id} review={review} onEdit={onEdit} />
      ))}
    </div>
  );
}
