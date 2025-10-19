import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import './ParishDomain.css';

const ParishDomain = ({ 
  parishName, 
  markers, 
  onMarkerClick, 
  onDeleteMarker, 
  currentUser,
  onSwitchParish 
}) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Parish-specific data
  const parishStats = {
    totalMarkers: markers.length,
    activeUsers: Math.floor(Math.random() * 50) + 10, // Mock data
    recentActivity: markers.filter(m => 
      new Date(m.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length,
    trending: markers.filter(m => m.category === 'event').length
  };

  // Enhanced categories for parish-specific content
  const parishCategories = [
    { id: 'all', name: 'All', icon: '🏠', color: '#2d5016' },
    { id: 'traffic', name: 'Traffic', icon: '🚗', color: '#1a365d' },
    { id: 'events', name: 'Events', icon: '🎉', color: '#2d5016' },
    { id: 'hazards', name: 'Hazards', icon: '⚠️', color: '#dc2626' },
    { id: 'weather', name: 'Weather', icon: '🌤️', color: '#059669' },
    { id: 'crime', name: 'Crime Alerts', icon: '🚨', color: '#ea580c' },
    { id: 'food', name: 'Food', icon: '🍽️', color: '#d97706' },
    { id: 'services', name: 'Services', icon: '🏢', color: '#8b5cf6' }
  ];

  const getFilteredMarkers = () => {
    let filtered = markers;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(marker => marker.category === filterCategory);
    }

    // Sort by selected criteria
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'trending':
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'distance':
        // Sort by distance from parish center (mock implementation)
        filtered.sort((a, b) => Math.random() - 0.5);
        break;
    }

    return filtered;
  };

  const getCategoryIcon = (category) => {
    const categoryData = parishCategories.find(cat => cat.id === category);
    return categoryData ? categoryData.icon : '📍';
  };

  const getCategoryColor = (category) => {
    const categoryData = parishCategories.find(cat => cat.id === category);
    return categoryData ? categoryData.color : '#059669';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderFeedCard = (marker) => (
    <Card key={marker.id} className="parish-feed-card">
      <CardHeader className="parish-card-header">
        <div className="card-meta">
          <div className="user-info">
            <div className="user-avatar">
              {marker.userEmail ? marker.userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{marker.userEmail || 'Anonymous'}</span>
              <span className="post-time">{formatTimeAgo(marker.createdAt)}</span>
            </div>
          </div>
          <Badge 
            className="category-badge"
            style={{ backgroundColor: getCategoryColor(marker.category) }}
          >
            {getCategoryIcon(marker.category)} {marker.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="parish-card-content">
        <h3 className="card-title">{marker.title}</h3>
        <p className="card-description">{marker.description}</p>
        
        {marker.image && (
          <div className="card-image-container">
            <img 
              src={marker.image} 
              alt={marker.title}
              className="card-image"
            />
          </div>
        )}
        
        <div className="card-location">
          <MapPin size={16} />
          <span>{marker.latitude?.toFixed(4)}, {marker.longitude?.toFixed(4)}</span>
        </div>
        
        <div className="card-actions">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onMarkerClick(marker)}
          >
            View on Map
          </Button>
          {currentUser && marker.userId === currentUser.id && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDeleteMarker(marker.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="parish-domain">
      {/* Parish Header */}
      <div className="parish-header">
        <div className="parish-info">
          <h1 className="parish-title">{parishName} Parish</h1>
          <p className="parish-subtitle">Your local community pulse</p>
        </div>
        
        <div className="parish-stats">
          <div className="stat-item">
            <Users size={20} />
            <span>{parishStats.activeUsers} active</span>
          </div>
          <div className="stat-item">
            <TrendingUp size={20} />
            <span>{parishStats.recentActivity} today</span>
          </div>
          <div className="stat-item">
            <MapPin size={20} />
            <span>{parishStats.totalMarkers} markers</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="parish-tabs">
        <button 
          className={`tab-button ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          📋 Feed
        </button>
        <button 
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Alerts
        </button>
        <button 
          className={`tab-button ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          🚗 Traffic
        </button>
        <button 
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          🎉 Events
        </button>
      </div>

      {/* Category Filters */}
      <div className="category-filters">
        {parishCategories.map(category => (
          <button
            key={category.id}
            className={`category-filter ${filterCategory === category.id ? 'active' : ''}`}
            onClick={() => setFilterCategory(category.id)}
            style={{ 
              borderColor: filterCategory === category.id ? category.color : 'transparent',
              backgroundColor: filterCategory === category.id ? `${category.color}20` : 'transparent'
            }}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="sort-options">
        <span>Sort by:</span>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="recent">Most Recent</option>
          <option value="trending">Most Popular</option>
          <option value="distance">Nearest</option>
        </select>
      </div>

      {/* Content Area */}
      <div className="parish-content">
        {activeTab === 'feed' && (
          <div className="feed-grid">
            {getFilteredMarkers().length === 0 ? (
              <div className="empty-state">
                <p>🌴 No posts in {parishName} yet. Be the first to share!</p>
              </div>
            ) : (
              getFilteredMarkers().map(renderFeedCard)
            )}
          </div>
        )}
        
        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <div className="alert-banner">
              <AlertTriangle size={24} />
              <div>
                <h3>Emergency Alerts</h3>
                <p>Stay informed about critical information in {parishName}</p>
              </div>
            </div>
            <div className="feed-grid">
              {getFilteredMarkers()
                .filter(marker => marker.category === 'alert' || marker.category === 'hazards')
                .map(renderFeedCard)}
            </div>
          </div>
        )}
        
        {activeTab === 'traffic' && (
          <div className="traffic-section">
            <div className="traffic-banner">
              <h3>🚗 Traffic Updates</h3>
              <p>Real-time traffic information for {parishName}</p>
            </div>
            <div className="feed-grid">
              {getFilteredMarkers()
                .filter(marker => marker.category === 'traffic')
                .map(renderFeedCard)}
            </div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className="events-section">
            <div className="events-banner">
              <h3>🎉 Local Events</h3>
              <p>What's happening in {parishName}</p>
            </div>
            <div className="feed-grid">
              {getFilteredMarkers()
                .filter(marker => marker.category === 'event')
                .map(renderFeedCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParishDomain;
