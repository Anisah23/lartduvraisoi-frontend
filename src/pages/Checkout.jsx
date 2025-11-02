// Import React hooks for state management and lifecycle
import React, { useState, useEffect } from 'react';
// Import React Router hook for navigation
import { useNavigate } from 'react-router-dom';
// Import Stripe payment processing library
import { loadStripe } from '@stripe/stripe-js';
// Import Stripe React components for payment forms
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// Import authentication context to get user information
import { useAuth } from '../context/AuthContext';
// Import API utility for making HTTP requests
import { apiRequest } from '../utils/api';

// Initialize Stripe with publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

// Stripe Checkout Form Component - handles payment processing
const CheckoutForm = ({ cartItems, shippingInfo, totalAmount, onSuccess, onError }) => {
  // Get Stripe instance from Stripe context
  const stripe = useStripe();
  // Get Elements instance from Stripe context
  const elements = useElements();
  // State to track payment processing status
  const [processing, setProcessing] = useState(false);
  // State to store client secret for payment intent
  const [clientSecret, setClientSecret] = useState('');

  // Effect that runs when component mounts to create payment intent
  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    createPaymentIntent();
  }, []); // Empty dependency array means this runs once on mount

  // Function to create payment intent on the server
  const createPaymentIntent = async () => {
    try {
      // Make API request to create payment intent
      const response = await apiRequest('/api/payments/create-intent', {
        method: 'POST', // HTTP method for creating resources
        body: JSON.stringify({
          amount: totalAmount, // Payment amount
          currency: 'usd', // Currency code
          description: `Art purchase - ${cartItems.length} items` // Payment description
        })
      });

      // Store client secret for confirming payment
      setClientSecret(response.client_secret);
    } catch (error) {
      // Call error handler if payment intent creation fails
      onError('Failed to initialize payment');
    }
  };

  // Function to handle form submission and process payment
  const handleSubmit = async (event) => {
    // Prevent default form submission behavior
    event.preventDefault();

    // Check if Stripe and Elements are loaded
    if (!stripe || !elements) {
      return;
    }

    // Set processing state to show loading indicators
    setProcessing(true);

    try {
      // Confirm card payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement), // Get card element
          billing_details: {
            name: shippingInfo.fullName, // Billing name
            email: 'customer@example.com', // Would come from auth context
            address: {
              line1: shippingInfo.address, // Billing address
              city: shippingInfo.city, // Billing city
              postal_code: shippingInfo.postalCode, // Billing postal code
              country: shippingInfo.country // Billing country
            }
          }
        }
      });

      // Handle payment result
      if (error) {
        // Call error handler if payment fails
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment succeeded, now create the order
        await createOrder();
      }
    } catch (error) {
      // Call error handler for any other errors
      onError('Payment failed');
    } finally {
      // Always set processing to false when payment completes
      setProcessing(false);
    }
  };

  // Function to create order after successful payment
  const createOrder = async () => {
    try {
      // Prepare order data
      const orderData = {
        // Map cart items to order format
        items: cartItems.map(item => ({
          artwork_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_details: shippingInfo, // Include shipping information
        total_amount: totalAmount // Include total amount
      };

      // Make API request to create order
      const response = await apiRequest('/api/orders', {
        method: 'POST', // HTTP method for creating resources
        body: JSON.stringify(orderData) // Send order data as JSON
      });

      // Call success handler with order response
      onSuccess(response);
    } catch (error) {
      // Call error handler if order creation fails
      onError('Failed to create order');
    }
  };

  // Styling options for Stripe card element
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px', // Font size
        color: '#424770', // Text color
        '::placeholder': {
          color: '#aab7c4', // Placeholder color
        },
      },
      invalid: {
        color: '#9e2146', // Error text color
      },
    },
  };

  // Render the checkout form UI
  return (
    <form onSubmit={handleSubmit} className="checkout-form"> {/* Form with checkout-form CSS class */}
      <div className="checkout-grid"> {/* Grid layout for form sections */}
        {/* Shipping Information Section */}
        <div className="checkout-section">
          <h2 className="section-title">Shipping Information</h2>
          {/* Full name input */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={shippingInfo.fullName}
              onChange={(e) => shippingInfo.onChange('fullName', e.target.value)} // Update shipping info
              className="form-input"
              required // Make field required
            />
          </div>
          {/* Address input */}
          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              name="address"
              value={shippingInfo.address}
              onChange={(e) => shippingInfo.onChange('address', e.target.value)} // Update shipping info
              className="form-input"
              required // Make field required
            />
          </div>
          {/* City and postal code row */}
          <div className="form-row">
            {/* City input */}
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                value={shippingInfo.city}
                onChange={(e) => shippingInfo.onChange('city', e.target.value)} // Update shipping info
                className="form-input"
                required // Make field required
              />
            </div>
            {/* Postal code input */}
            <div className="form-group">
              <label className="form-label">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={shippingInfo.postalCode}
                onChange={(e) => shippingInfo.onChange('postalCode', e.target.value)} // Update shipping info
                className="form-input"
                required // Make field required
              />
            </div>
          </div>
          {/* Country input */}
          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="country"
              value={shippingInfo.country}
              onChange={(e) => shippingInfo.onChange('country', e.target.value)} // Update shipping info
              className="form-input"
              required // Make field required
            />
          </div>
        </div>

        {/* Payment Information Section */}
        <div className="checkout-section">
          <h2 className="section-title">Payment Information</h2>
          <div className="form-group">
            <label className="form-label">Card Details</label>
            {/* Stripe card element container */}
            <div className="card-element-container">
              <CardElement options={cardElementOptions} /> {/* Stripe card input */}
            </div>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="checkout-section">
          <h2 className="section-title">Order Summary</h2>
          {/* List of order items */}
          <div className="order-items">
            {/* Map through cart items and display each */}
            {cartItems.map(item => (
              <div key={item.id} className="order-item"> {/* Individual order item */}
                <div className="order-item-info">
                  <h4 className="order-item-title">{item.title}</h4> {/* Item title */}
                  <p className="order-item-artist">{item.artist}</p> {/* Item artist */}
                  <p className="order-item-quantity">Quantity: {item.quantity}</p> {/* Item quantity */}
                </div>
                {/* Item total price */}
                <p className="order-item-price">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          {/* Order total */}
          <div className="order-total">
            <span>Total: ${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout actions section */}
      <div className="checkout-actions">
        {/* Pay button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={!stripe || processing} // Disable if Stripe not loaded or processing
        >
          {/* Dynamic button text based on processing state */}
          {processing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

// Main Checkout component - manages checkout flow and state
export default function Checkout() {
  // State to store cart items
  const [cartItems, setCartItems] = useState([]);
  // State to store shipping information
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });
  // State to track loading status
  const [loading, setLoading] = useState(true);
  // State to store error messages
  const [error, setError] = useState('');
  // Hook for programmatic navigation
  const navigate = useNavigate();
  // Get current user from authentication context
  const { user } = useAuth();

  // Effect that runs when component mounts to fetch cart
  useEffect(() => {
    fetchCart();
  }, []); // Empty dependency array means this runs once on mount

  // Function to fetch cart items from the backend
  const fetchCart = async () => {
    try {
      // Make API request to get cart data
      const response = await fetch('/api/cart');
      if (response.ok) {
        // Parse response and update cart items
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      // Log error for debugging
      console.error('Error fetching cart:', error);
    } finally {
      // Always set loading to false when request completes
      setLoading(false);
    }
  };

  // Function to handle shipping information changes
  const handleShippingChange = (field, value) => {
    // Update specific field in shipping info state
    setShippingInfo(prev => ({
      ...prev, // Spread existing values
      [field]: value // Update specific field
    }));
  };

  // Function to calculate total price of all cart items
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Function to handle successful payment
  const handlePaymentSuccess = (order) => {
    // Navigate to orders page with new order data
    navigate('/orders', { state: { newOrder: order } });
  };

  // Function to handle payment errors
  const handlePaymentError = (errorMessage) => {
    // Set error message to display to user
    setError(errorMessage);
  };

  // Show loading state while fetching cart
  if (loading) {
    return (
      <div className="checkout-page">
        <div className="loading">Loading checkout...</div>
      </div>
    );
  }

  // Show empty cart state if no items
  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-checkout">
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-text">Add some items to your cart before checking out.</p>
          {/* Button to navigate to gallery */}
          <button onClick={() => navigate('/gallery')} className="btn-primary">
            Browse Gallery
          </button>
        </div>
      </div>
    );
  }

  // Duplicate loading check (this code is unreachable due to earlier return)
  if (loading) {
    return (
      <div className="checkout-page">
        <div className="loading">Loading checkout...</div>
      </div>
    );
  }

  // Duplicate empty cart check (this code is unreachable due to earlier return)
  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-checkout">
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-text">Add some items to your cart before checking out.</p>
          <button onClick={() => navigate('/gallery')} className="btn-primary">
            Browse Gallery
          </button>
        </div>
      </div>
    );
  }

  // Render the main checkout page
  return (
    <div className="checkout-page page"> {/* Main container with checkout-page CSS class */}
      <div className="checkout-container"> {/* Inner container for max-width and centering */}
        {/* Checkout header */}
        <div className="checkout-header">
          <h1 className="checkout-title">Checkout</h1> {/* Page title */}
        </div>

        {/* Error message display */}
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Stripe Elements provider wrapping the checkout form */}
        <Elements stripe={stripePromise}>
          <CheckoutForm
            cartItems={cartItems} // Pass cart items to form
            shippingInfo={{ ...shippingInfo, onChange: handleShippingChange }} // Pass shipping info with change handler
            totalAmount={getTotalPrice()} // Pass calculated total
            onSuccess={handlePaymentSuccess} // Pass success handler
            onError={handlePaymentError} // Pass error handler
          />
        </Elements>
      </div>
    </div>
  );
}