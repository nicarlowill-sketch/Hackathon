import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { collection, addDoc, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './FeedView.css';

const FeedView = ({ markers, onMarkerClick, onDeleteMarker, currentUser }) => {
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [replyingTo, setReplyingTo] = useState({});

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

  // Load comments for all markers
  useEffect(() => {
    if (!markers.length) return;

    const unsubscribeFunctions = [];

    markers.forEach(marker => {
      const q = query(
        collection(db, 'comments'),
        where('markerId', '==', marker.id),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const markerComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setComments(prev => ({
          ...prev,
          [marker.id]: markerComments
        }));
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [markers]);

  const handleDelete = (markerId) => {
    if (window.confirm('Are you sure you want to delete this marker?')) {
      onDeleteMarker(markerId);
    }
  };

  const handleAddComment = async (markerId, parentId = null) => {
    if (!currentUser) {
      alert('Please login to add comments');
      return;
    }

    const commentText = newComment[markerId]?.trim();
    if (!commentText) return;

    try {
      await addDoc(collection(db, 'comments'), {
        markerId,
        parentId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        text: commentText,
        createdAt: new Date()
      });

      setNewComment(prev => ({
        ...prev,
        [markerId]: ''
      }));
      setReplyingTo(prev => ({
        ...prev,
        [markerId]: null
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleReply = (markerId, parentId) => {
    setReplyingTo(prev => ({
      ...prev,
      [markerId]: parentId
    }));
  };

  const renderComments = (markerId, parentId = null, level = 0) => {
    const markerComments = comments[markerId] || [];
    const threadComments = markerComments.filter(comment => comment.parentId === parentId);

    return threadComments.map(comment => (
      <div key={comment.id} className={`comment ${level > 0 ? 'reply' : ''}`} style={{ marginLeft: level * 20 }}>
        <div className="comment-header">
          <span className="comment-author">{comment.userEmail}</span>
          <span className="comment-date">
            {new Date(comment.createdAt?.toDate?.() || comment.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="comment-text">{comment.text}</div>
        <div className="comment-actions">
          <button 
            className="reply-btn"
            onClick={() => handleReply(markerId, comment.id)}
          >
            Reply
          </button>
        </div>
        
        {/* Render replies */}
        {renderComments(markerId, comment.id, level + 1)}
        
        {/* Reply form */}
        {replyingTo[markerId] === comment.id && (
          <div className="reply-form">
            <Textarea
              placeholder="Write a reply..."
              value={newComment[`${markerId}-${comment.id}`] || ''}
              onChange={(e) => setNewComment(prev => ({
                ...prev,
                [`${markerId}-${comment.id}`]: e.target.value
              }))}
              rows={3}
            />
            <div className="reply-actions">
              <Button
                size="sm"
                onClick={() => handleAddComment(markerId, comment.id)}
                disabled={!newComment[`${markerId}-${comment.id}`]?.trim()}
              >
                Reply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReplyingTo(prev => ({
                  ...prev,
                  [markerId]: null
                }))}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    ));
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

              {/* Comments Section */}
              <div className="comments-section">
                <h4>💬 Comments ({(comments[marker.id] || []).length})</h4>
                
                {/* Existing Comments */}
                <div className="comments-list">
                  {renderComments(marker.id)}
                </div>

                {/* Add Comment Form */}
                {currentUser && (
                  <div className="add-comment">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment[marker.id] || ''}
                      onChange={(e) => setNewComment(prev => ({
                        ...prev,
                        [marker.id]: e.target.value
                      }))}
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(marker.id)}
                      disabled={!newComment[marker.id]?.trim()}
                    >
                      Add Comment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedView;

