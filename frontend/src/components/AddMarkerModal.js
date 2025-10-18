import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import './AddMarkerModal.css';

const AddMarkerModal = ({ isOpen, onClose, onSubmit, position }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('event');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limit file size to 1MB for MVP
      if (file.size > 1024 * 1024) {
        alert('Image size should be less than 1MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position) return;

    setLoading(true);
    try {
      await onSubmit({
        title,
        category,
        description,
        latitude: position.lat,
        longitude: position.lng,
        image: image || null
      });

      // Reset form
      setTitle('');
      setCategory('event');
      setDescription('');
      setImage('');
    } catch (error) {
      // Error handled by parent
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
                <SelectItem value="event" data-testid="category-event">🎉 Event</SelectItem>
                <SelectItem value="obstacle" data-testid="category-obstacle">⚠️ Obstacle</SelectItem>
                <SelectItem value="object" data-testid="category-object">📍 Object</SelectItem>
                <SelectItem value="alert" data-testid="category-alert">🚨 Alert</SelectItem>
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

          <div className="form-group">
            <Label htmlFor="image">Image (Optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              data-testid="marker-image-input"
            />
            {image && (
              <div className="image-preview">
                <img src={image} alt="Preview" />
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