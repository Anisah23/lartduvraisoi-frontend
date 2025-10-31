import React, { useContext } from 'react';
import { WishlistContext } from '../context/WishlistContext';
import { Heart, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import '../styles/pages/Wishlist.css';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useContext(WishlistContext);

  const handlePurchase = async (art) => {
    try {
      // Add to cart instead of direct purchase
      await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ artworkId: art.id }),
      });
      toast.success(`${art.title} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="wishlist-container">
      <div className="wishlist-content">
        <div className="wishlist-header">
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-count">
            {wishlist.length}{" "}
            {wishlist.length === 1 ? "item" : "items"} in your wishlist
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <Heart className="empty-icon" size={64} />
            <p className="empty-text">Your wishlist is empty</p>
            <p className="empty-subtext">
              Browse the gallery and add artworks you love!
            </p>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((art) => (
              <div key={art.id} className="wishlist-card">
                <div className="wishlist-image-container">
                  <img src={art.imageUrl} alt={art.title} className="wishlist-image" />
                  <button
                    onClick={() => {
                      removeFromWishlist(art.id);
                      toast.success("Removed from wishlist");
                    }}
                    className="wishlist-remove-btn"
                  >
                    <X size={20} className="remove-icon" />
                  </button>
                  <div className="wishlist-category-overlay">
                    <span className="wishlist-category">{art.category}</span>
                  </div>
                </div>

                <div className="wishlist-card-content">
                  <h3 className="art-title">{art.title}</h3>
                  <p className="art-description">{art.description}</p>
                  <p className="art-artisan">by {art.artist}</p>
                  <div className="wishlist-price-section">
                    <span className="art-price">${art.price}</span>
                  </div>
                  <button
                    className="wishlist-purchase-btn"
                    onClick={() => handlePurchase(art)}
                  >
                    <ShoppingCart size={16} className="purchase-icon" />
                    Purchase Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {wishlist.length > 0 && (
          <div className="wishlist-total-card">
            <div className="wishlist-total-content">
              <div>
                <p className="total-label">Total Wishlist Value</p>
                <p className="total-amount">
                  $
                  {wishlist
                    .reduce((sum, art) => sum + art.price, 0)
                    .toFixed(2)}
                </p>
              </div>
              <button
                className="wishlist-purchase-all-btn"
                onClick={async () => {
                  try {
                    for (const art of wishlist) {
                      await apiRequest('/api/cart', {
                        method: 'POST',
                        body: JSON.stringify({ artworkId: art.id }),
                      });
                    }
                    toast.success("All items added to cart!");
                  } catch (error) {
                    console.error('Error adding items to cart:', error);
                    toast.error('Failed to add some items to cart');
                  }
                }}
              >
                <ShoppingCart className="purchase-icon" size={20} />
                Add All to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;