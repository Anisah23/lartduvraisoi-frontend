import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import "../styles/pages/ArtistDashboard.css";

export default function ArtistDashboard() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const data = await apiRequest('/api/artist/artworks');
      setArtworks(data || []);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const myArtworks = artworks;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/api/artist/artworks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          category,
          image_url: image
        })
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setImage("");
      setIsDialogOpen(false);

      // Refresh artworks
      fetchArtworks();
    } catch (error) {
      console.error('Error adding artwork:', error);
    }
  };

  const handleDeleteArt = async (id) => {
    try {
      await apiRequest(`/api/artist/artworks/${id}`, {
        method: 'DELETE'
      });
      fetchArtworks();
    } catch (error) {
      console.error('Error deleting artwork:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Artist Dashboard</h1>
          <p className="dashboard-subtitle">Manage your art collection</p>
        </div>
        <button
          className="add-art-btn"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="icon" size={20} />
          Add New Artwork
        </button>
      </div>

      {isDialogOpen && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2 className="dialog-title">Add New Artwork</h2>
            <p className="dialog-description">
              Share your latest creation with collectors worldwide
            </p>
            <form onSubmit={handleSubmit} className="dialog-form">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter artwork title"
                required
              />

              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your artwork"
                rows="4"
                required
              ></textarea>

              <div className="form-row">
                <div>
                  <label>Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="painting">Painting</option>
                    <option value="sculpture">Sculpture</option>
                    <option value="photography">Photography</option>
                    <option value="digital">Digital Art</option>
                    <option value="mixed-media">Mixed Media</option>
                    <option value="textile">Textile Art</option>
                  </select>
                </div>
              </div>

              <label>Image URL</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Enter image URL"
                required
              />

              <button type="submit" className="submit-btn">
                Add Artwork
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="stats-card">
        <h3>Your Statistics</h3>
        <div className="stats">
          <div>
            <p className="highlight">{myArtworks.length}</p>
            <span>Total Artworks</span>
          </div>
          <div>
            <p className="highlight">0</p>
            <span>Sales This Month</span>
          </div>
          <div>
            <p className="highlight">
              ${myArtworks.reduce((sum, art) => sum + art.price, 0).toFixed(2)}
            </p>
            <span>Total Value</span>
          </div>
        </div>
      </div>

      <h2 className="section-title">Your Artworks</h2>
      {myArtworks.length === 0 ? (
        <div className="empty-state">
          <p>You haven't added any artworks yet</p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="add-art-btn"
          >
            Add Your First Artwork
          </button>
        </div>
      ) : (
        <div className="art-grid">
          {myArtworks.map((art) => (
            <div key={art.id} className="art-card">
              <img src={art.image} alt={art.title} className="art-image" />
              <div className="art-content">
                <h3>{art.title}</h3>
                <p className="description">{art.description}</p>
                <div className="art-meta">
                  <span className="price">${art.price}</span>
                  <span className="category">{art.category}</span>
                </div>
                <div className="art-actions">
                  <button className="edit-btn">
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteArt(art.id)}
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