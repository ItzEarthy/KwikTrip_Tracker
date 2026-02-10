import { useEffect, useState } from "react";
import Navbar from "./Navbar";

const API_BASE = `${window.location.origin}/api`;

export default function FriendManagement() {
  const [userId, setUserId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState("friends"); // friends, requests, search

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) {
      setUserId(id);
      loadFriends(id);
      loadIncomingRequests(id);
      loadOutgoingRequests(id);
    }
  }, []);

  // Live search as user types (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      if (activeTab !== 'search') return;

      if (searchQuery && searchQuery.trim()) {
        searchUsers();
      } else {
        // when there's no query, show all users (except self and existing friends)
        loadAllUsers();
      }
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // When switching to Search tab, ensure we populate users if empty
  useEffect(() => {
    if (activeTab === 'search' && (!searchResults || searchResults.length === 0) && (!searchQuery || !searchQuery.trim())) {
      loadAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadFriends = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/friends/${id}`);
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      console.error("Failed to load friends:", err);
    }
  };

  const loadIncomingRequests = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/friend-requests/${id}`);
      const data = await res.json();
      setIncomingRequests(data);
    } catch (err) {
      console.error("Failed to load incoming requests:", err);
    }
  };

  const loadOutgoingRequests = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/friend-requests-sent/${id}`);
      const data = await res.json();
      setOutgoingRequests(data);
    } catch (err) {
      console.error("Failed to load outgoing requests:", err);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !userId) return;

    try {
      const res = await fetch(`${API_BASE}/users/search/${userId}?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error("Failed to search users:", err);
      setSearchResults([]);
    }
  };

  const loadAllUsers = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();

      // exclude self and existing friends
      const friendIds = (friends || []).map(f => f.id);
      const filtered = (data || []).filter(u => String(u.id) !== String(userId) && !friendIds.includes(u.id));

      setSearchResults(filtered.slice(0, 100));
    } catch (err) {
      console.error('Failed to load users:', err);
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (friendId) => {
    if (!window.confirm("Send friend request to this user?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/friend-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, friendId }),
      });

      if (res.ok) {
        alert("Friend request sent!");
        setSearchResults(searchResults.filter(u => u.id !== friendId));
        loadOutgoingRequests(userId);
      } else {
        const { error } = await res.json();
        alert(`Failed: ${error}`);
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const handleRequest = async (requestId, action) => {
    const actionText = action === 'accept' ? 'accept' : 'decline';
    if (!window.confirm(`Are you sure you want to ${actionText} this friend request?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/friend-request/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        alert(`Friend request ${action === 'accept' ? 'accepted' : 'declined'}!`);
        loadIncomingRequests(userId);
        if (action === 'accept') {
          loadFriends(userId);
        }
      } else {
        alert("Failed to process request");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const removeFriend = async (friendshipId, friendName) => {
    if (!window.confirm(`Are you sure you want to remove ${friendName} from your friends? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Friend removed successfully");
        loadFriends(userId);
      } else {
        alert("Failed to remove friend");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const cancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this friend request?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/friend-request/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'decline' }),
      });

      if (res.ok) {
        alert("Friend request cancelled");
        loadOutgoingRequests(userId);
      } else {
        alert("Failed to cancel request");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--brand-bg)" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 pt-20">
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: "var(--brand-primary)" }}>
          Friend Management
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded ${activeTab === 'friends' ? 'btn' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends ({friends.length})
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded ${activeTab === 'requests' ? 'btn' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests ({incomingRequests.length})
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded ${activeTab === 'search' ? 'btn' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('search')}
          >
            Add Friends
          </button>
        </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Your Friends</h2>
            {friends.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No friends yet. Search for users to add friends!
              </p>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-semibold">{friend.nickname}</div>
                      <div className="text-xs text-gray-500">
                        Friends since {new Date(friend.requestedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      className="btn"
                      style={{ background: "var(--brand-danger)", fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                      onClick={() => removeFriend(friend.friendshipId, friend.nickname)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Friend Requests</h2>
            
            {/* Incoming Requests */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Incoming Requests</h3>
              {incomingRequests.length === 0 ? (
                <p className="text-gray-500 text-sm">No incoming requests</p>
              ) : (
                <div className="space-y-2">
                  {incomingRequests.map((request) => (
                    <div key={request.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-semibold">{request.nickname}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn"
                          style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                          onClick={() => handleRequest(request.friendshipId, 'accept')}
                        >
                          Accept
                        </button>
                        <button
                          className="btn"
                          style={{ background: "var(--brand-gray)", color: "#333", fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                          onClick={() => handleRequest(request.friendshipId, 'decline')}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h3 className="font-semibold mb-2">Sent Requests</h3>
              {outgoingRequests.length === 0 ? (
                <p className="text-gray-500 text-sm">No sent requests</p>
              ) : (
                <div className="space-y-2">
                  {outgoingRequests.map((request) => (
                    <div key={request.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-semibold">{request.nickname}</div>
                        <div className="text-xs text-gray-500">
                          Sent {new Date(request.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        className="btn"
                        style={{ background: "var(--brand-gray)", color: "#333", fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                        onClick={() => cancelRequest(request.friendshipId)}
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Search for Friends</h2>
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by nickname or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  className="flex-1"
                />
                <button className="btn" onClick={searchUsers}>
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="font-semibold">{user.nickname}</div>
                    <button
                      className="btn"
                      style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                      onClick={() => sendFriendRequest(user.id)}
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-gray-500 text-center py-4">
                No users found. Try a different search term.
              </p>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Enter a nickname or username to search for friends.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
