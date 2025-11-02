// Import React hooks for state management and lifecycle
import React, { useState, useEffect } from "react";
// Import Lucide React icons for UI elements
import { Plus, Edit, Trash2 } from "lucide-react";
// Import authentication context to get user information
import { useAuth } from '../context/AuthContext';
// Import API utility for making HTTP requests
import { apiRequest } from '../utils/api';
// Import CSS styles for artist dashboard
import "../styles/pages/ArtistDashboard.css";

// Main ArtistDashboard component - allows artists to manage their artwork portfolio
export default function ArtistDashboard() {
  // Get current user information from authentication context
  const { user } = useAuth();
  // State to control the visibility of the add artwork dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // State for artwork title input field
  const [title, setTitle] = useState("");
  // State for artwork description input field
  const [description, setDescription] = useState("");
  // State for artwork price input field
  const [price, setPrice] = useState("");
  // State for artwork category selection
  const [category, setCategory] = useState("");
  // State for artwork image URL input field
  const [image, setImage] = useState("");
  // State to store array of artist's artworks
  const [artworks, setArtworks] = useState([]);
  // State to track loading status during API calls
  const [loading, setLoading] = useState(true);
  
  // Effect that runs when component mounts to fetch artworks
  useEffect(() => {
    fetchArtworks();
  }, []); // Empty dependency array means this runs once on mount

  // Function to fetch artist's artworks from the backend
  const fetchArtworks = async () => {
    try {
      // Make API request to get artist's artworks
      const data = await apiRequest('/api/artist/artworks');
      // Update artworks state (use empty array if no data)
      setArtworks(data || []);
    } catch (error) {
      // Log error for debugging
      console.error('Error fetching artworks:', error);
    } finally {
      // Always set loading to false when request completes
      setLoading(false);
    }
  };

  // Create alias for artworks array (could be used for filtering/sorting later)
  const myArtworks = artworks;

  // Function to handle form submission for adding new artwork
  const handleSubmit = async (e) => {
    // Prevent default form submission behavior
    e.preventDefault();
    try {
      // Make POST request to create new artwork
      await apiRequest('/api/artist/artworks', {
        method: 'POST', // HTTP method for creating resources
        body: JSON.stringify({
          title, // Artwork title
          description, // Artwork description
          price: parseFloat(price), // Convert price string to number
          category, // Artwork category
          image_url: image // Image URL
        })
      });

      // Reset all form fields to empty strings
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setImage("");
      // Close the dialog
      setIsDialogOpen(false);

      // Refresh artworks list to show new artwork
      fetchArtworks();
    } catch (error) {
      // Log error for debugging
      console.error('Error adding artwork:', error);
    }
  };

  // Function to delete an artwork
  const handleDeleteArt = async (id) => {
    try {
      // Make DELETE request to remove artwork
      await apiRequest(`/api/artist/artworks/${id}`, {
        method: 'DELETE' // HTTP method for deleting resources
      });
      // Refresh artworks list to remove deleted item
      fetchArtworks();
    } catch (error) {
      // Log error for debugging
      console.error('Error deleting artwork:', error);
    }
  };

  // Render the artist dashboard UI
  return (
    <div className="dashboard-container"> {/* Main container with dashboard-container CSS class */}
      {/* Dashboard header section */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Artist Dashboard</h1> {/* Page title */}
          <p className="dashboard-subtitle">Manage your art collection</p> {/* Subtitle */}
        </div>
        {/* Add new artwork button */}
        <button
          className="add-art-btn"
          onClick={() => setIsDialogOpen(true)} // Open dialog when clicked
        >
          <Plus className="icon" size={20} /> {/* Plus icon */}
          Add New Artwork
        </button>
      </div>

      {/* Conditional rendering of add artwork dialog */}
      {isDialogOpen && (
        <div className="dialog-overlay"> {/* Dark overlay background */}
          <div className="dialog"> {/* Dialog container */}
            <h2 className="dialog-title">Add New Artwork</h2> {/* Dialog title */}
            <p className="dialog-description">
              Share your latest creation with collectors worldwide
            </p>
            {/* Form for adding new artwork */}
            <form onSubmit={handleSubmit} className="dialog-form">
              {/* Title input field */}
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)} // Update title state
                placeholder="Enter artwork title"
                required // Make field required
              />

              {/* Description textarea field */}
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)} // Update description state
                placeholder="Describe your artwork"
                rows="4" // Set textarea height
                required // Make field required
              ></textarea>

              {/* Price and category row */}
              <div className="form-row">
                {/* Price input field */}
                <div>
                  <label>Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)} // Update price state
                    placeholder="0.00"
                    step="0.01" // Allow decimal values
                    required // Make field required
                  />
                </div>
                {/* Category selection dropdown */}
                <div>
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)} // Update category state
                    required // Make field required
                  >
                    <option value="">Select category</option> {/* Default empty option */}
                    <option value="painting">Painting</option>
                    <option value="sculpture">Sculpture</option>
                    <option value="photography">Photography</option>
                    <option value="digital">Digital Art</option>
                    <option value="mixed-media">Mixed Media</option>
                    <option value="textile">Textile Art</option>
                  </select>
                </div>
              </div>

              {/* Image URL input field */}
              <label>Image URL</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)} // Update image state
                placeholder="Enter image URL"
                required // Make field required
              />

              {/* Form action buttons */}
              <button type="submit" className="submit-btn">
                Add Artwork
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setIsDialogOpen(false)} // Close dialog without saving
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Statistics card showing artist's performance metrics */}
      <div className="stats-card">
        <h3>Your Statistics</h3>
        <div className="stats">
          {/* Total artworks count */}
          <div>
            <p className="highlight">{myArtworks.length}</p>
            <span>Total Artworks</span>
          </div>
          {/* Sales this month (placeholder - not implemented) */}
          <div>
            <p className="highlight">0</p>
            <span>Sales This Month</span>
          </div>
          {/* Total value of all artworks */}
          <div>
            <p className="highlight">
              ${myArtworks.reduce((sum, art) => sum + art.price, 0).toFixed(2)}
            </p>
            <span>Total Value</span>
          </div>
        </div>
      </div>

      {/* Section title for artworks list */}
      <h2 className="section-title">Your Artworks</h2>
      {/* Conditional rendering based on whether artist has artworks */}
      {myArtworks.length === 0 ? (
        // Empty state when no artworks exist
        <div className="empty-state">
          <p>You haven't added any artworks yet</p>
          <button
            onClick={() => setIsDialogOpen(true)} // Open dialog to add first artwork
            className="add-art-btn"
          >
            Add Your First Artwork
          </button>
        </div>
      ) : (
        // Grid of artwork cards when artworks exist
        <div className="art-grid">
          {/* Map through each artwork and render a card */}
          {myArtworks.map((art) => (
            <div key={art.id} className="art-card"> {/* Individual artwork card */}
              {/* Artwork image */}
              <img src={art.image} alt={art.title} className="art-image" />
              {/* Artwork content section */}
              <div className="art-content">
                <h3>{art.title}</h3> {/* Artwork title */}
                <p className="description">{art.description}</p> {/* Artwork description */}
                {/* Artwork metadata (price and category) */}
                <div className="art-meta">
                  <span className="price">${art.price}</span> {/* Price display */}
                  <span className="category">{art.category}</span> {/* Category tag */}
                </div>
                {/* Action buttons for artwork */}
                <div className="art-actions">
                  {/* Edit button (functionality not implemented) */}
                  <button className="edit-btn">
                    <Edit size={16} />
                    Edit
                  </button>
                  {/* Delete button */}
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteArt(art.id)} // Delete artwork when clicked
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}