import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Camera, MapPin, Send, X, Heart } from 'lucide-react';
import './LocketPost.css';

const LocketPost = ({ isOpen, onClose, onSubmit, position, currentUser }) => {
const [content, setContent] = useState('');
const [category, setCategory] = useState('event');
const [urgency, setUrgency] = useState('normal');
const [images, setImages] = useState([]);
const [loading, setLoading] = useState(false);
const [timeoutProgress, setTimeoutProgress] = useState(0);
const [isAnonymous, setIsAnonymous] = useState(false);
const [filteredContent, setFilteredContent] = useState('');
const fileInputRef = useRef(null);

const categories = [
{ id: 'event', name: 'Event', icon: '🎉', color: '#2d5016' },
{ id: 'traffic', name: 'Traffic', icon: '🚗', color: '#1a365d' },
{ id: 'hazard', name: 'Hazard', icon: '⚠️', color: '#dc2626' },
{ id: 'weather', name: 'Weather', icon: '🌤️', color: '#059669' },
{ id: 'crime', name: 'Crime', icon: '🚨', color: '#ea580c' },
{ id: 'food', name: 'Food', icon: '🍽️', color: '#d97706' },
{ id: 'service', name: 'Service', icon: '🏢', color: '#8b5cf6' },
];

const urgencyLevels = [
{ id: 'low', name: 'Low', color: '#10b981', icon: '🟢' },
{ id: 'normal', name: 'Normal', color: '#f59e0b', icon: '🟡' },
{ id: 'high', name: 'High', color: '#f97316', icon: '🟠' },
{ id: 'critical', name: 'Critical', color: '#ef4444', icon: '🔴' },
];

const handleImageChange = (e) => {
const files = Array.from(e.target.files);
const validFiles = files.filter((file) => {
  if (file.size > 5 * 1024 * 1024) {
    alert(`${file.name} is too large. Please choose files under 5MB.`);
    return false;
  }
  if (!file.type.startsWith('image/')) {
    alert(`${file.name} is not an image file.`);
    return false;
  }
return true;
});

if (validFiles.length === 0) return;

validFiles.forEach((file) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    setImages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        file,
        url: reader.result,
        name: file.name,
      },
    ]);
  };
  reader.readAsDataURL(file);
});


};

const removeImage = (imageId) => {
setImages((prev) => prev.filter((img) => img.id !== imageId));
};

const triggerFileInput = () => {
fileInputRef.current?.click();
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!position || !content.trim()) {
    console.error('Missing position or content');
    return;
  }

  setLoading(true);
  setTimeoutProgress(0);
  
  // Start timeout progress indicator
  const progressInterval = setInterval(() => {
    setTimeoutProgress(prev => {
      if (prev >= 100) {
        clearInterval(progressInterval);
        return 100;
      }
      return prev + 2; // 5 seconds total (100/2 = 50 intervals of 100ms)
    });
  }, 100);
  
  try {
    const postData = {
      title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      category,
      description: content,
      latitude: position.lat,
      longitude: position.lng,
      urgency,
      images: images.map((img) => img.url),
      userId: currentUser?.id,
      userEmail: (isAnonymous && category === 'crime') ? 'Anonymous' : currentUser?.email,
    };

    console.log('LocketPost: Submitting post...', postData);
    await onSubmit(postData);
    
    clearInterval(progressInterval);

    // Reset form only on success
    setContent('');
    setCategory('event');
    setUrgency('normal');
    setImages([]);
    setIsAnonymous(false);
    onClose();
  } catch (error) {
    console.error('LocketPost submission failed:', error);
    clearInterval(progressInterval);
    // Don't close the modal on error so user can retry
    // The error message will be shown by the parent component
  } finally {
    setLoading(false);
    setTimeoutProgress(0);
  }
};

if (!isOpen) return null;

return (
<div className="locket-overlay">
<div className="locket-container">
<div className="locket-header">
<div className="locket-title">
<Heart size={20} className="locket-icon" />
<span>Share Your Pulse</span>
</div>
<button className="locket-close" onClick={onClose}>
<X size={20} />
</button>
</div>

    <form onSubmit={handleSubmit} className="locket-content">
      <div className="locket-user">
        <div className="user-avatar">
          {currentUser?.email
            ? currentUser.email.charAt(0).toUpperCase()
            : 'U'}
        </div>
        <div className="user-info">
          <span className="user-name">
            {currentUser?.email || 'Anonymous'}
          </span>
          <span className="user-location">
            <MapPin size={14} />
            {position
              ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
              : 'Location'}
          </span>
        </div>
      </div>

      <div className="locket-input-section">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening in your area?"
          className="locket-textarea"
          maxLength={500}
        />
        <div className="character-count">{content.length}/500</div>
      </div>

      <div className="locket-categories">
        <span className="category-label">Category:</span>
        <div className="category-buttons">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-btn ${
                category === cat.id ? 'active' : ''
              }`}
              onClick={() => setCategory(cat.id)}
              style={{
                borderColor:
                  category === cat.id ? cat.color : 'transparent',
                backgroundColor:
                  category === cat.id
                    ? `${cat.color}20`
                    : 'transparent',
              }}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="locket-urgency">
        <span className="urgency-label">Urgency:</span>
        <div className="urgency-buttons">
          {urgencyLevels.map((level) => (
            <button
              key={level.id}
              type="button"
              className={`urgency-btn ${
                urgency === level.id ? 'active' : ''
              }`}
              onClick={() => setUrgency(level.id)}
              style={{
                borderColor:
                  urgency === level.id ? level.color : 'transparent',
                backgroundColor:
                  urgency === level.id
                    ? `${level.color}20`
                    : 'transparent',
              }}
            >
              <span className="urgency-icon">{level.icon}</span>
              <span className="urgency-name">{level.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Anonymous posting for crime markers */}
      {category === 'crime' && (
        <div className="locket-anonymous">
          <div className="anonymous-checkbox">
            <input
              type="checkbox"
              id="locket-anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <label htmlFor="locket-anonymous">
              Post anonymously (hide your email for crime reports)
            </label>
          </div>
        </div>
      )}

      <div className="locket-images">
        <button
          type="button"
          onClick={triggerFileInput}
          className="image-upload-btn"
        >
          <Camera size={18} />
          Add Photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />

        {images.length > 0 && (
          <div className="image-preview-grid">
            {images.map((img) => (
              <div key={img.id} className="image-preview-item">
                <img src={img.url} alt={img.name} />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="remove-image-btn"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeout Progress Bar */}
      {loading && timeoutProgress > 0 && (
        <div className="timeout-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${timeoutProgress}%` }}
            />
          </div>
          <div className="progress-text">
            {timeoutProgress < 100 ? 'Uploading...' : 'Request timed out'}
          </div>
        </div>
      )}

      <div className="locket-actions">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="cancel-btn"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !content.trim()}
          className="submit-btn"
        >
          {loading ? (
            <>
              <div className="loading-spinner" />
              Sharing... {timeoutProgress > 0 && `(${Math.round(timeoutProgress)}%)`}
            </>
          ) : (
            <>
              <Send size={18} />
              Share Pulse
            </>
          )}
        </Button>
      </div>
    </form>
  </div>
</div>


);
};

export default LocketPost;