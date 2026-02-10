import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFocus } from "../contexts/FocusContext";
const API_BASE = `${window.location.origin}/api`;
import Navbar from "./Navbar";
import StoreStats from "./StoreStats";

export default function FriendsDashboard({ onSelectUser }) {
  const { requestFocus } = useFocus();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [visits, setVisits] = useState({});
  const [locations, setLocations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [sortBy, setSortBy] = useState("mostVisits");
  const [myVisits, setMyVisits] = useState([]);
  const [myStats, setMyStats] = useState({ total: 0, visited: 0, percent: 0 });
  const [allFriendActivity, setAllFriendActivity] = useState([]);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) {
      setUserId(id);
      loadFriends(id);
      loadMyData(id);
    }

    fetch(`${API_BASE}/locations`)
      .then((res) => res.json())
      .then(setLocations);
  }, []);

  const loadMyData = async (id) => {
    try {
      // Load my visits
      const visitsRes = await fetch(`${API_BASE}/visits/${id}`);
      const visitsData = await visitsRes.json();
      setMyVisits(visitsData);

      // Load my stats
      const statsRes = await fetch(`${API_BASE}/stats/${id}`);
      const statsData = await statsRes.json();
      setMyStats(statsData);
    } catch (err) {
      console.error("Failed to load my data:", err);
    }
  };

  const loadFriends = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/friends/${id}`);
      const friendsData = await res.json();
      setFriends(friendsData);
    } catch (err) {
      console.error("Failed to load friends:", err);
    }
  };

  useEffect(() => {
    if (!friends || friends.length === 0) {
      setAllFriendActivity([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const activities = await Promise.all(
          friends.map(async (friend) => {
            try {
              const res = await fetch(`${API_BASE}/visits/${friend.id}`);
              const data = await res.json();
              // store the raw visits array so we can compute count and lastActive
              setVisits((prev) => ({ ...prev, [friend.id]: data }));

              if (!data || data.length === 0) return null;

              const recentVisit = data[0];

              // fetch activity for that store (reviews + photos)
              let reviews = [];
              try {
                const actRes = await fetch(
                  `${API_BASE}/locations/${recentVisit.storeNumber}/activity?requesterId=${userId}`
                );
                const act = await actRes.json();
                if (act && act.reviews) reviews = act.reviews;
              } catch (err) {
                // ignore per-store activity failures
              }

              const allPhotos = reviews.flatMap((rv) => (rv.photos || []).map((p) => p.filePath));

              return {
                friendId: friend.id,
                friendNickname: friend.nickname,
                storeNumber: recentVisit.storeNumber,
                visitDate: recentVisit.visitDate,
                isNew: data.length === 1,
                reviews,
                photos: allPhotos,
              };
            } catch (err) {
              return null;
            }
          })
        );

        const filtered = activities
          .filter(Boolean)
          .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
          .slice(0, 5);

        if (!cancelled) setAllFriendActivity(filtered);
      } catch (err) {
        console.error("Failed to build friend activity:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [friends, userId]);

  // Calculate milestone progress
  const getMilestones = () => {
    const milestones = [1, 5, 10, 25, 50, 75, 100];
    const currentPercent = myStats.percent;
    
    // Find the next milestone
    const nextMilestone = milestones.find(m => m > currentPercent);
    if (!nextMilestone) return null;
    
    const previousMilestone = milestones[milestones.indexOf(nextMilestone) - 1] || 0;
    const progressToNext = ((currentPercent - previousMilestone) / (nextMilestone - previousMilestone)) * 100;
    const visitsNeeded = Math.ceil((nextMilestone / 100) * myStats.total) - myStats.visited;
    
    return { nextMilestone, progressToNext, visitsNeeded };
  };

  const milestoneData = getMilestones();

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ background: "var(--brand-bg)" }} className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto p-4 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Friends Dashboard</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={() => navigate('/friend-management')}
          >
            Manage Friends
          </button>
        </div>

        {/* My Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">📍</span>
            Your Recent Activity
          </h2>
          {myVisits.length === 0 ? (
            <p className="text-gray-500 text-sm">No visits yet. Start exploring!</p>
          ) : (
            <div className="space-y-2">
              {myVisits.slice(0, 3).map((visit, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm py-2 border-b last:border-b-0">
                  <span className="text-xl">🏪</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {(() => {
                          const loc = locations.find(l => String(l.storeNumber) === String(visit.storeNumber));
                          return loc ? loc.name : `Store #${visit.storeNumber}`;
                        })()}
                      </span>
                      <span className="text-gray-500 ml-2">{formatTimeAgo(visit.visitDate)}</span>
                    </div>
                    <div className="mt-2">
                      <StoreStats storeNumber={visit.storeNumber} compact />
                    </div>
                  </div>
                </div>
              ))}
              {myVisits.length > 3 && (
                <button 
                  onClick={() => navigate('/visit-history')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                >
                  View all {myVisits.length} visits →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Milestone Progress */}
        {milestoneData && (
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md p-5 mb-4 text-white">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Next Milestone
            </h2>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium opacity-90">Progress to {milestoneData.nextMilestone}%</span>
                <span className="text-sm font-bold">{myStats.percent}% → {milestoneData.nextMilestone}%</span>
              </div>
              <div className="w-full bg-white/30 h-4 rounded-full overflow-hidden">
                <div
                  className="bg-white h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${milestoneData.progressToNext}%` }}
                >
                  {milestoneData.progressToNext > 20 && (
                    <span className="text-xs font-bold text-blue-600">
                      {Math.round(milestoneData.progressToNext)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm opacity-90">
              <span className="font-bold text-lg">{milestoneData.visitsNeeded}</span> more {milestoneData.visitsNeeded === 1 ? 'visit' : 'visits'} to reach {milestoneData.nextMilestone}%!
            </p>
          </div>
        )}

        {/* Friend Activity Feed */}
        {friends.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5 mb-4">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Friend Activity
            </h2>
            {allFriendActivity.length === 0 ? (
              <p className="text-gray-500 text-sm">No friend activity yet.</p>
            ) : (
              <div className="space-y-3">
                {allFriendActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                    <span className="text-2xl">{activity.isNew ? '🎉' : '📍'}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm">
                          <span className="font-semibold text-blue-600">{activity.friendNickname}</span>
                          {activity.isNew ? (
                            <span className="text-gray-700"> visited their first store!</span>
                          ) : (
                            <span className="text-gray-700"> visited Store #{activity.storeNumber}</span>
                          )}
                        </p>
                        <span className="text-xs text-gray-500">{formatTimeAgo(activity.visitDate)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <StoreStats storeNumber={activity.storeNumber} compact />
                        {activity.photos && activity.photos.length > 0 && (
                          <div className="flex items-center gap-2">
                            {activity.photos.slice(0, 3).map((p, i) => (
                              <img
                                key={i}
                                src={`${API_BASE}/uploads/${p}`}
                                alt={`photo ${i + 1}`}
                                className="w-16 h-16 object-cover rounded border cursor-pointer"
                                onClick={() => window.open(`${API_BASE}/uploads/${p}`, "_blank")}
                              />
                            ))}
                          </div>
                        )}

                        {activity.reviews && activity.reviews.length > 0 && (
                          <div className="ml-2 text-sm text-gray-700">
                            {activity.reviews.slice(0, 1).map((rv, i) => (
                              <p key={i} className="truncate max-w-xs">{rv.text || rv.comment || ''}</p>
                            ))}
                          </div>
                        )}
                        <button
                          className="ml-auto px-3 py-1 rounded bg-blue-600 text-white text-sm"
                          onClick={() => {
                            requestFocus(activity.storeNumber);
                            navigate('/map');
                          }}
                        >
                          Bring me to
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Leaderboard
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 font-medium">Sort:</label>
              <select 
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="mostVisits">Most Visits</option>
                <option value="highestPercent">Highest %</option>
                <option value="recentlyActive">Recently Active</option>
              </select>
            </div>
          </div>

          {friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No friends yet. Add friends to see their progress!</p>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors" 
                onClick={() => navigate('/friend-management')}
              >
                Add Friends
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {friends
                .map((friend) => {
                  const friendVisits = visits[friend.id] || [];
                  const progress = friendVisits.length || 0;
                  const total = locations.length || 1;
                  const percent = Math.round((progress / total) * 100);
                  const lastActive = friendVisits && friendVisits.length ? friendVisits[0].visitDate : null;
                  return { ...friend, progress, percent, lastActive };
                })
                .sort((a, b) => {
                  if (sortBy === "mostVisits") return b.progress - a.progress;
                  if (sortBy === "highestPercent") return b.percent - a.percent;
                  if (sortBy === "recentlyActive") {
                    const ta = a.lastActive ? new Date(a.lastActive).getTime() : 0;
                    const tb = b.lastActive ? new Date(b.lastActive).getTime() : 0;
                    return tb - ta;
                  }
                  return 0;
                })
                .map((friend, idx) => {
                  const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤';
                  return (
                    <div key={friend.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-base flex items-center gap-2">
                          <span className="text-xl">{rankEmoji}</span>
                          {friend.nickname}
                        </h3>
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          onClick={() => {
                            localStorage.setItem("mode", "friend");
                            localStorage.setItem("selectedUserId", friend.id);
                            onSelectUser(friend.id);
                          }}
                        >
                          View Map
                        </button>
                      </div>
                      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${friend.percent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span className="font-medium">
                          {friend.progress} of {locations.length || 0} visited ({friend.percent}%)
                        </span>
                        {friend.lastActive && (
                          <span className="text-gray-500">
                            Last: {formatTimeAgo(friend.lastActive)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
