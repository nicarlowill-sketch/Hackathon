import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { MapPin, Camera, Upload, X, AlertTriangle } from 'lucide-react';
import './AddMarkerModal.css';

const AddMarkerModal = ({ isOpen, onClose, onSubmit, position, currentUser }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('event');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [images, setImages] = useState([]);
  const [urgency, setUrgency] = useState('normal');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Enhanced image handling with multiple images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

    // Process each valid file
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file: file,
          url: reader.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return;

    setLoading(true);
    try {
      console.log('Submitting marker...', { title, category, description, urgency });
      
      const markerData = {
        title,
        category,
        description,
        latitude: position.lat,
        longitude: position.lng,
        urgency,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        images: images.map(img => img.url),
        userId: currentUser?.id,
        userEmail: currentUser?.email
      };

      await onSubmit(markerData);

      // Reset form only on success
      setTitle('');
      setCategory('event');
      setDescription('');
      setImage('');
      setImages([]);
      setUrgency('normal');
      setTags('');
    } catch (error) {
      console.error('Marker submission failed:', error);
      // Keep form data on error so user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="add-marker-modal" data-testid="add-marker-modal">
        <DialogHeader>
          <DialogTitle className="modal-title">
            📍 Add New Marker
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="marker-form">
          <div className="form-group">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening?"
              required
              data-testid="marker-title-input"
            />
          </div>

          <div className="form-group">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="marker-category-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event" data-testid="category-event">🎉 Events</SelectItem>
                <SelectItem value="traffic" data-testid="category-traffic">🚗 Traffic</SelectItem>
                <SelectItem value="hazards" data-testid="category-hazards">⚠️ Hazards</SelectItem>
                <SelectItem value="weather" data-testid="category-weather">🌤️ Weather</SelectItem>
                <SelectItem value="crime" data-testid="category-crime">🚨 Crime Alerts</SelectItem>
                <SelectItem value="food" data-testid="category-food">🍽️ Food</SelectItem>
                <SelectItem value="services" data-testid="category-services">🏢 Services</SelectItem>
                <SelectItem value="object" data-testid="category-object">📍 Objects</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="form-group">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this marker..."
              required
              rows={4}
              data-testid="marker-description-input"
            />
          </div>

          {/* Urgency Level */}
          <div className="form-group">
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low - General Information</SelectItem>
                <SelectItem value="normal">🟡 Normal - Important Update</SelectItem>
                <SelectItem value="high">🟠 High - Urgent Attention</SelectItem>
                <SelectItem value="critical">🔴 Critical - Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="form-group">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="traffic, accident, roadwork (comma separated)"
              data-testid="marker-tags-input"
            />
            <p className="form-hint">Add relevant tags to help others find your post</p>
          </div>

          {/* Enhanced Image Upload */}
          <div className="form-group">
            <Label>Photos (Optional)</Label>
            <div className="image-upload-section">
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                className="upload-button"
                data-testid="marker-image-input"
              >
                <Camera size={20} />
                Add Photos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <p className="upload-hint">Upload up to 5 photos (5MB each max)</p>
            </div>
            
            {/* Image Preview Grid */}
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
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {position && (
            <div className="location-info">
              <p>📍 Location: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>
            </div>
          )}

          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="cancel-marker-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="submit-marker-btn"
            >
              {loading ? 'Adding...' : 'Add Marker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMarkerModal;

