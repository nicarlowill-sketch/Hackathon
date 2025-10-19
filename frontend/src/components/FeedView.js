import { Button } from './ui/button';
import './FeedView.css';

const FeedView = ({ markers, onMarkerClick, onDeleteMarker, currentUser }) => {
  const getCategoryIcon = (category) => {
    const icons = {
      event: '🎉',
      traffic: '🚗',
      hazard: '⚠️',
      weather: '🌤️',
      crime: '🚨',
      food: '🍽️',
      service: '🏢',
      object: '📍'
    };
    return icons[category] || '📍';
  };

  const handleDelete = (markerId) => {
    if (window.confirm('Are you sure you want to delete this marker?')) {
      onDeleteMarker(markerId);
    }
  };

  return (
    <div className="feed-container" data-testid="feed-container">
      <div className="feed-header">
        <h2>📋 Island Feed</h2>
        <p>{markers.length} markers on the pulse</p>
      </div>

      <div className="feed-list">
        {markers.length === 0 ? (
          <div className="empty-state" data-testid="empty-feed">
            <p>🌴 No markers yet. Be the first to add one!</p>
          </div>
        ) : (
          markers.map((marker) => (
            <div
              key={marker.id}
              className={`feed-card ${marker.category}`}
              data-testid={`feed-card-${marker.id}`}
            >
              <div className="card-header">
                <div className="card-title-section">
                  <span className="category-icon">{getCategoryIcon(marker.category)}</span>
                  <h3>{marker.title}</h3>
                </div>
                <span className={`category-badge ${marker.category}`}>
                  {marker.category}
                </span>
              </div>

              <p className="card-description">{marker.description}</p>

              {marker.images && marker.images.length > 0 && (
                <div className="card-images">
                  {marker.images.slice(0, 3).map((img, index) => (
                    <img key={index} src={img} alt={`${marker.title} image ${index + 1}`} className="card-image" />
                  ))}
                </div>
              )}

              <div className="card-meta">
                <div className="meta-info">
                  <p className="user-info">👤 {marker.userEmail || marker.user_email || 'Anonymous'}</p>
                  <p className="date-info">
                    📅 {new Date(marker.createdAt || marker.created_at).toLocaleDateString()}
                  </p>
                  <p className="location-info">
                    📍 {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                  </p>
                </div>

                <div className="card-actions">
                  <Button
                    variant="outline"
                    onClick={() => onMarkerClick(marker)}
                    data-testid={`view-on-map-btn-${marker.id}`}
                  >
                    🗺️ View on Map
                  </Button>
                  {currentUser && currentUser.id === marker.user_id && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(marker.id)}
                      data-testid={`delete-marker-btn-${marker.id}`}
                    >
                      🗑️ Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedView;

