import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

// Stripe Checkout Form Component
const CheckoutForm = ({ cartItems, shippingInfo, totalAmount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await apiRequest('/api/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'usd',
          description: `Art purchase - ${cartItems.length} items`
        })
      });

      setClientSecret(response.client_secret);
    } catch (error) {
      onError('Failed to initialize payment');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: shippingInfo.fullName,
            email: 'customer@example.com', // Would come from auth context
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              postal_code: shippingInfo.postalCode,
              country: shippingInfo.country
            }
          }
        }
      });

      if (error) {
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment succeeded, now create the order
        await createOrder();
      }
    } catch (error) {
      onError('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const createOrder = async () => {
    try {
      const orderData = {
        items: cartItems.map(item => ({
          artwork_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_details: shippingInfo,
        total_amount: totalAmount
      };

      const response = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      onSuccess(response);
    } catch (error) {
      onError('Failed to create order');
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-grid">
        {/* Shipping Information */}
        <div className="checkout-section">
          <h2 className="section-title">Shipping Information</h2>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={shippingInfo.fullName}
              onChange={(e) => shippingInfo.onChange('fullName', e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              name="address"
              value={shippingInfo.address}
              onChange={(e) => shippingInfo.onChange('address', e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                value={shippingInfo.city}
                onChange={(e) => shippingInfo.onChange('city', e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={shippingInfo.postalCode}
                onChange={(e) => shippingInfo.onChange('postalCode', e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="country"
              value={shippingInfo.country}
              onChange={(e) => shippingInfo.onChange('country', e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Payment Information */}
        <div className="checkout-section">
          <h2 className="section-title">Payment Information</h2>
          <div className="form-group">
            <label className="form-label">Card Details</label>
            <div className="card-element-container">
              <CardElement options={cardElementOptions} />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-section">
          <h2 className="section-title">Order Summary</h2>
          <div className="order-items">
            {cartItems.map(item => (
              <div key={item.id} className="order-item">
                <div className="order-item-info">
                  <h4 className="order-item-title">{item.title}</h4>
                  <p className="order-item-artist">{item.artist}</p>
                  <p className="order-item-quantity">Quantity: {item.quantity}</p>
                </div>
                <p className="order-item-price">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="order-total">
            <span>Total: ${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="checkout-actions">
        <button
          type="submit"
          className="btn-primary"
          disabled={!stripe || processing}
        >
          {processing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

export default function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShippingChange = (field, value) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePaymentSuccess = (order) => {
    navigate('/orders', { state: { newOrder: order } });
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="loading">Loading checkout...</div>
      </div>
    );
  }

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

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="loading">Loading checkout...</div>
      </div>
    );
  }

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

  return (
    <div className="checkout-page page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1 className="checkout-title">Checkout</h1>
        </div>

        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <Elements stripe={stripePromise}>
          <CheckoutForm
            cartItems={cartItems}
            shippingInfo={{ ...shippingInfo, onChange: handleShippingChange }}
            totalAmount={getTotalPrice()}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>
      </div>
    </div>
  );
}