// Import React hooks for state management and context creation
import React, { createContext, useContext, useState, useEffect } from 'react';
// Import authentication context to check if user is logged in
import { useAuth } from './AuthContext';
// Import API utility function for making HTTP requests
import { apiRequest } from '../utils/api';
// Import toast notifications for user feedback
import { toast } from 'sonner';

// Create a new React context for cart functionality
const CartContext = createContext();

// Custom hook to access cart context - ensures component is wrapped in CartProvider
export const useCart = () => {
  // Get the cart context value
  const context = useContext(CartContext);
  // Throw error if hook is used outside of CartProvider
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  // Return the context value (cart state and functions)
  return context;
};

// CartProvider component that wraps the app and provides cart functionality
export const CartProvider = ({ children }) => {
  // State to store the entire cart object (includes items array)
  const [cart, setCart] = useState(null);
  // State to track loading status during API calls
  const [loading, setLoading] = useState(false);
  // Get login status from authentication context
  const { isLoggedIn } = useAuth();

  // Effect that runs when login status changes
  useEffect(() => {
    // If user is logged in, fetch their cart from the server
    if (isLoggedIn) {
      fetchCart();
    } else {
      // If user logs out, clear the cart
      setCart(null);
    }
  }, [isLoggedIn]); // Dependency array - effect runs when isLoggedIn changes

  // Function to fetch cart data from the backend API
  const fetchCart = async () => {
    try {
      // Set loading to true to show loading indicators
      setLoading(true);
      // Make API request to get cart data
      const data = await apiRequest('/api/cart/');
      // Update cart state with fetched data
      setCart(data);
    } catch (error) {
      // Log error to console for debugging
      console.error('Error fetching cart:', error);
      // If cart doesn't exist on server, create empty cart structure locally
      setCart({ items: [] });
    } finally {
      // Always set loading to false when request completes (success or error)
      setLoading(false);
    }
  };

  // Function to add an artwork to the cart
  const addToCart = async (artworkId, quantity = 1) => {
    try {
      // Make POST request to add item to cart
      const data = await apiRequest('/api/cart/', {
        method: 'POST', // HTTP method for creating new resources
        body: JSON.stringify({ artworkId, quantity }), // Convert data to JSON string
      });
      // Update local cart state with response from server
      setCart(data);
      // Show success message to user
      toast.success('Added to cart');
      // Return success status for calling component
      return { success: true };
    } catch (error) {
      // Show error message to user
      toast.error('Failed to add to cart');
      // Return error status and message for calling component
      return { success: false, error: error.message };
    }
  };

  // Function to update the quantity of an item in the cart
  const updateQuantity = async (artworkId, quantity) => {
    try {
      // Make PATCH request to update specific cart item
      const data = await apiRequest(`/api/cart/${artworkId}`, {
        method: 'PATCH', // HTTP method for partial updates
        body: JSON.stringify({ quantity }), // Send new quantity
      });
      // Update local cart state with server response
      setCart(data);
      // Show appropriate message based on quantity
      if (quantity === 0) {
        toast.success('Removed from cart'); // If quantity is 0, item is removed
      } else {
        toast.success('Cart updated'); // Otherwise, quantity was updated
      }
    } catch (error) {
      // Show error message if update fails
      toast.error('Failed to update cart');
    }
  };

  // Function to completely remove an item from the cart
  const removeFromCart = async (artworkId) => {
    try {
      // Make DELETE request to remove item from cart
      const data = await apiRequest(`/api/cart/${artworkId}`, {
        method: 'DELETE', // HTTP method for deleting resources
      });
      // Update local cart state with server response
      setCart(data);
      // Show success message to user
      toast.success('Removed from cart');
    } catch (error) {
      // Show error message if removal fails
      toast.error('Failed to remove from cart');
    }
  };

  // Function to remove all items from the cart
  const clearCart = async () => {
    try {
      // Check if cart has items to remove
      if (cart?.items) {
        // Loop through each item and remove it individually
        for (const item of cart.items) {
          await removeFromCart(item.artwork_id);
        }
      }
      // Set cart to empty state locally
      setCart({ items: [] });
      // Show success message to user
      toast.success('Cart cleared');
    } catch (error) {
      // Show error message if clearing fails
      toast.error('Failed to clear cart');
    }
  };

  // Calculate total number of items in cart (sum of all quantities)
  const cartCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  // Calculate total price of all items in cart
  const cartTotal = cart?.items?.reduce((total, item) => total + (item.artwork?.price * item.quantity), 0) || 0;
  // Get array of cart items (empty array if no cart)
  const cartItems = cart?.items || [];

  // Object containing all cart state and functions to be provided to components
  const value = {
    cart, // Full cart object
    loading, // Loading state for UI indicators
    cartCount, // Total number of items
    cartTotal, // Total price
    cartItems, // Array of cart items
    addToCart, // Function to add items
    updateQuantity, // Function to update item quantities
    removeFromCart, // Function to remove items
    clearCart, // Function to clear entire cart
    refreshCart: fetchCart, // Function to refresh cart from server
  };

  // Provide the cart context value to all child components
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};