// Import React library for component creation
import React from 'react';
// Import Lucide React icons for UI elements
import { Heart, ShoppingCart, Package } from 'lucide-react';
// Import authentication context to get user information
import { useAuth } from '../context/AuthContext';
// Import wishlist context to get wishlist count
import { useWishlist } from '../context/WishlistContext';
// Import CSS styles for collector dashboard
import '../styles/pages/CollectorDashboard.css';

// Main CollectorDashboard component - displays collector's dashboard with statistics and activity
export default function CustomerDashboard() {
  // Get current user information from authentication context
  const { user } = useAuth();
  // Get wishlist count from wishlist context
  const { wishlistCount } = useWishlist();

  // Render the collector dashboard UI
  return (
    <div className="collector-dashboard"> {/* Main container with collector-dashboard CSS class */}
      <div className="dashboard-container"> {/* Inner container for max-width and centering */}
        {/* Dashboard header section */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Collector Dashboard</h1> {/* Page title */}
          {/* Welcome message with user's name or fallback */}
          <p className="dashboard-subtitle">Welcome back, {user?.fullName || 'art enthusiast'}!</p>
        </div>

        {/* Statistics cards section - displays key metrics */}
        <div className="dashboard-stats">
          {/* Wishlist items card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Wishlist Items</h3> {/* Card title */}
              <Heart className="card-icon" size={20} /> {/* Heart icon for wishlist */}
            </div>
            <div className="card-content">
              <div className="card-value">{wishlistCount}</div> {/* Display wishlist count */}
              <p className="card-description">Items you're interested in</p> {/* Description */}
            </div>
          </div>

          {/* Total purchases card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Total Purchases</h3> {/* Card title */}
              <ShoppingCart className="card-icon" size={20} /> {/* Shopping cart icon */}
            </div>
            <div className="card-content">
              <div className="card-value">0</div> {/* Hardcoded value - not implemented */}
              <p className="card-description">Artworks purchased</p> {/* Description */}
            </div>
          </div>

          {/* Active orders card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Active Orders</h3> {/* Card title */}
              <Package className="card-icon" size={20} /> {/* Package icon for orders */}
            </div>
            <div className="card-content">
              <div className="card-value">0</div> {/* Hardcoded value - not implemented */}
              <p className="card-description">In transit to you</p> {/* Description */}
            </div>
          </div>
        </div>

        {/* Lower section with additional information cards */}
        <div className="dashboard-lower">
          {/* Recent activity card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3> {/* Card title */}
            </div>
            <div className="card-content">
              {/* Empty state message - no activity tracking implemented */}
              <p className="empty-text">No recent activity</p>
            </div>
          </div>

          {/* Recommendations card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Recommended for You</h3> {/* Card title */}
            </div>
            <div className="card-content">
              {/* Empty state message - recommendations not implemented */}
              <p className="empty-text">
                Browse the gallery to get personalized recommendations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}