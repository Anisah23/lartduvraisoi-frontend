// Import React hooks for state management and lifecycle
import React, { useState, useEffect } from 'react';
// Import Lucide React icons for UI elements
import { ShoppingCart as CartIcon, Trash2, Plus, Minus, CreditCard, Truck } from "lucide-react";
// Import authentication context to check user login status
import { useAuth } from '../context/AuthContext';
// Import API utility for making HTTP requests
import { apiRequest } from '../utils/api';
// Import custom UI components
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
// Import toast notifications for user feedback
import { toast } from "sonner";
// Import CSS styles for cart page
import '../styles/pages/Cart.css';

// Main Cart component - displays shopping cart with items and checkout functionality
export default function Cart() {
  // Get user authentication status
  const { isLoggedIn } = useAuth();
  // State to store array of cart items
  const [cartItems, setCartItems] = useState([]);
  // State to track loading status during API calls
  const [loading, setLoading] = useState(true);
  // State to control checkout dialog visibility
  const [showCheckout, setShowCheckout] = useState(false);
  // State to store shipping form data
  const [shippingDetails, setShippingDetails] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });

  // Effect that runs when component mounts or login status changes
  useEffect(() => {
    // Only fetch cart if user is logged in
    if (isLoggedIn) {
      fetchCart();
    } else {
      // If not logged in, stop loading
      setLoading(false);
    }
  }, [isLoggedIn]); // Dependency array - runs when isLoggedIn changes

  // Function to fetch cart items from the backend
  const fetchCart = async () => {
    try {
      // Make API request to get cart data
      const data = await apiRequest('/api/cart');
      // Update cart items state (use empty array if no items)
      setCartItems(data.items || []);
    } catch (error) {
      // Log error for debugging
      console.error('Error fetching cart:', error);
      // Show error message to user
      toast.error('Failed to load cart');
    } finally {
      // Always set loading to false when request completes
      setLoading(false);
    }
  };

  // Function to update quantity of a specific cart item
  const updateQuantity = async (artworkId, value) => {
    // Convert string input to integer
    const qty = parseInt(value);
    // Validate quantity (must be a number and at least 1)
    if (isNaN(qty) || qty < 1) return;

    try {
      // Make PATCH request to update item quantity
      await apiRequest(`/api/cart/${artworkId}`, {
        method: 'PATCH', // HTTP method for partial updates
        body: JSON.stringify({ quantity: qty }), // Send new quantity as JSON
      });
      // Refresh cart data from server
      await fetchCart();
      // Show success message to user
      toast.success('Quantity updated');
    } catch (error) {
      // Log error for debugging
      console.error('Error updating quantity:', error);
      // Show error message to user
      toast.error('Failed to update quantity');
    }
  };

  // Function to remove an item completely from the cart
  const removeItem = async (artworkId) => {
    try {
      // Make DELETE request to remove item
      await apiRequest(`/api/cart/${artworkId}`, {
        method: 'DELETE', // HTTP method for deleting resources
      });
      // Refresh cart data from server
      await fetchCart();
      // Show success message to user
      toast.success("Removed from cart");
    } catch (error) {
      // Log error for debugging
      console.error('Error removing item:', error);
      // Show error message to user
      toast.error('Failed to remove item');
    }
  };

  // Calculate subtotal by summing price * quantity for all items
  const subtotal = cartItems.reduce((sum, item) => sum + (item.artwork?.price || item.price) * item.quantity, 0);
  // Calculate shipping cost (free if over $500, otherwise $50, $0 if cart empty)
  const shipping = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0;
  // Calculate tax as 10% of subtotal
  const tax = subtotal * 0.1;
  // Calculate total cost (subtotal + shipping + tax)
  const total = subtotal + shipping + tax;

  // Function to handle checkout form submission
  const handleCheckout = async (e) => {
    // Prevent default form submission behavior
    e.preventDefault();
    try {
      // Prepare order data for API request
      const orderData = {
        // Map cart items to order format
        items: cartItems.map(item => ({
          artwork_id: item.artwork_id,
          quantity: item.quantity,
          price: item.artwork.price
        })),
        shipping_details: shippingDetails, // Include shipping information
        total_amount: total // Include calculated total
      };

      // Make POST request to create new order
      const response = await apiRequest('/api/orders', {
        method: 'POST', // HTTP method for creating resources
        body: JSON.stringify(orderData), // Send order data as JSON
      });

      // Log successful order creation
      console.log("Order placed:", response);
      // Close checkout dialog
      setShowCheckout(false);
      // Show success message to user
      toast.success("Order placed successfully! You will receive a confirmation email shortly.");
      // Clear cart items locally
      setCartItems([]);
      // Note: Could redirect to orders page here
      // navigate('/orders');
    } catch (error) {
      // Log error for debugging
      console.error('Error placing order:', error);
      // Show error message to user
      toast.error('Failed to place order. Please try again.');
    }
  };

  // Render the cart page UI
  return (
    <div className="cart-page"> {/* Main container with cart-page CSS class */}
      <div className="cart-container"> {/* Inner container for max-width and centering */}
        {/* Cart header section */}
        <div className="cart-header">
          <h1>Shopping Cart</h1> {/* Page title */}
          <p>
            {/* Display item count with proper singular/plural */}
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {/* Conditional rendering based on cart contents */}
        {cartItems.length === 0 ? (
          // Empty cart state
          <Card>
            <CardContent className="empty-cart">
              <CartIcon className="cart-icon" size={64} /> {/* Large cart icon */}
              <p>Your cart is empty</p> {/* Empty message */}
              <p className="empty-note">Browse the gallery and add artworks you'd like to purchase!</p>
            </CardContent>
          </Card>
        ) : (
          // Cart with items - two column layout
          <div className="cart-grid">
            {/* Left column - cart items list */}
            <div className="cart-items">
              {/* Map through each cart item and render */}
              {cartItems.map((item) => (
                <Card key={item.id} className="cart-item"> {/* Individual item card */}
                  <CardContent className="cart-item-content">
                    <div className="cart-item-wrapper">
                      {/* Item image with fallback */}
                      <img
                        src={item.artwork?.imageUrl || item.image || "/placeholder-artwork.png"}
                        alt={item.artwork?.title || item.name}
                        className="cart-item-img"
                        onError={(e) => {
                          // Set fallback image if original fails to load
                          e.target.src = '/placeholder-artwork.png';
                        }}
                      />
                      {/* Item information section */}
                      <div className="cart-item-info">
                        {/* Item header with title, artist, and remove button */}
                        <div className="cart-item-header">
                          <div>
                            <h3>{item.artwork?.title || item.name}</h3> {/* Item title */}
                            <p>by {item.artwork?.artist || item.artisan}</p> {/* Artist name */}
                            <span className="category-tag">{item.artwork?.category || item.category}</span>
                          </div>
                          {/* Remove item button */}
                          <button onClick={() => removeItem(item.artwork_id || item.id)} className="remove-btn">
                            <Trash2 size={20} /> {/* Trash icon */}
                          </button>
                        </div>
                        {/* Item description */}
                        <p className="cart-item-desc">{item.artwork?.description || item.description}</p>
                        {/* Item footer with quantity controls and price */}
                        <div className="cart-item-footer">
                          {/* Quantity adjustment controls */}
                          <div className="quantity-controls">
                            {/* Decrease quantity button */}
                            <button onClick={() => updateQuantity(item.artwork_id || item.id, Math.max(1, item.quantity - 1))}>
                              <Minus size={16} />
                            </button>
                            {/* Current quantity display */}
                            <span>{item.quantity}</span>
                            {/* Increase quantity button */}
                            <button onClick={() => updateQuantity(item.artwork_id || item.id, item.quantity + 1)}>
                              <Plus size={16} />
                            </button>
                          </div>
                          {/* Price information */}
                          <div className="price">
                            <p>Price per item</p>
                            <p className="price-amount">${(item.artwork?.price || item.price).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Right column - order summary */}
            <div className="order-summary">
              <Card className="summary-card">
                <CardHeader className="summary-header">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="summary-content">
                  {/* Price breakdown rows */}
                  <div className="summary-rows">
                    {/* Subtotal row */}
                    <div className="row">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {/* Shipping row */}
                    <div className="row">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    {/* Tax row */}
                    <div className="row">
                      <span>Tax (10%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator /> {/* Visual separator line */}
                    {/* Total row */}
                    <div className="total-row">
                      <span>Total</span>
                      <span className="total-amount">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Free shipping promotion message */}
                  {subtotal < 500 && subtotal > 0 && (
                    <div className="free-shipping">
                      <Truck className="inline-icon" size={16} />
                      Add ${(500 - subtotal).toFixed(2)} more for free shipping!
                    </div>
                  )}

                  {/* Checkout button */}
                  <Button className="checkout-btn" onClick={() => setShowCheckout(true)}>
                    <CreditCard className="icon" size={20} />
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Checkout dialog modal */}
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="checkout-dialog">
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>Complete your purchase and get your artwork delivered</DialogDescription>
            </DialogHeader>
            {/* Checkout form */}
            <form onSubmit={handleCheckout} className="checkout-form">
              {/* Form grid for shipping details */}
              <div className="form-grid">
                {/* Generate form fields for each shipping detail */}
                {Object.keys(shippingDetails).map((field) => (
                  <div key={field} className="form-group">
                    {/* Convert camelCase field names to readable labels */}
                    <Label htmlFor={field}>{field.replace(/([A-Z])/g, " $1")}</Label>
                    <Input
                      id={field}
                      type={field === "email" ? "email" : "text"} // Use email type for email field
                      value={shippingDetails[field]}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, [field]: e.target.value })}
                      required // Make all fields required
                    />
                  </div>
                ))}
              </div>
              {/* Place order button */}
              <Button type="submit" className="place-order-btn">
                <CreditCard className="icon" size={20} />
                Place Order (${total.toFixed(2)})
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}