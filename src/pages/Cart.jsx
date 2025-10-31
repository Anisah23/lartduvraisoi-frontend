import React, { useState, useEffect } from 'react';
import { ShoppingCart as CartIcon, Trash2, Plus, Minus, CreditCard, Truck } from "lucide-react";
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import '../styles/pages/Cart.css';

export default function Cart() {
  const { isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
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

  useEffect(() => {
    if (isLoggedIn) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchCart = async () => {
    try {
      const data = await apiRequest('/api/cart');
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (artworkId, value) => {
    const qty = parseInt(value);
    if (isNaN(qty) || qty < 1) return;

    try {
      await apiRequest(`/api/cart/${artworkId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: qty }),
      });
      await fetchCart(); // Refresh cart
      toast.success('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };


  const removeItem = async (artworkId) => {
    try {
      await apiRequest(`/api/cart/${artworkId}`, {
        method: 'DELETE',
      });
      await fetchCart(); // Refresh cart
      toast.success("Removed from cart");
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.artwork?.price || item.price) * item.quantity, 0);
  const shipping = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        items: cartItems.map(item => ({
          artwork_id: item.artwork_id,
          quantity: item.quantity,
          price: item.artwork.price
        })),
        shipping_details: shippingDetails,
        total_amount: total
      };

      const response = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      console.log("Order placed:", response);
      setShowCheckout(false);
      toast.success("Order placed successfully! You will receive a confirmation email shortly.");
      // Clear cart and refresh
      setCartItems([]);
      // Optionally redirect to orders page
      // navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <p>
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="empty-cart">
              <CartIcon className="cart-icon" size={64} />
              <p>Your cart is empty</p>
              <p className="empty-note">Browse the gallery and add artworks you'd like to purchase!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="cart-grid">
            <div className="cart-items">
              {cartItems.map((item) => (
                <Card key={item.id} className="cart-item">
                  <CardContent className="cart-item-content">
                    <div className="cart-item-wrapper">
                      <img
                        src={item.artwork?.imageUrl || item.image || "/placeholder-artwork.png"}
                        alt={item.artwork?.title || item.name}
                        className="cart-item-img"
                        onError={(e) => {
                          e.target.src = '/placeholder-artwork.png';
                        }}
                      />
                      <div className="cart-item-info">
                        <div className="cart-item-header">
                          <div>
                            <h3>{item.artwork?.title || item.name}</h3>
                            <p>by {item.artwork?.artist || item.artisan}</p>
                            <span className="category-tag">{item.artwork?.category || item.category}</span>
                          </div>
                          <button onClick={() => removeItem(item.artwork_id || item.id)} className="remove-btn">
                            <Trash2 size={20} />
                          </button>
                        </div>
                        <p className="cart-item-desc">{item.artwork?.description || item.description}</p>
                        <div className="cart-item-footer">
                          <div className="quantity-controls">
                            <button onClick={() => updateQuantity(item.artwork_id || item.id, Math.max(1, item.quantity - 1))}>
                              <Minus size={16} />
                            </button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.artwork_id || item.id, item.quantity + 1)}>
                              <Plus size={16} />
                            </button>
                          </div>
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

            <div className="order-summary">
              <Card className="summary-card">
                <CardHeader className="summary-header">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="summary-content">
                  <div className="summary-rows">
                    <div className="row">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="row">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="row">
                      <span>Tax (10%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="total-row">
                      <span>Total</span>
                      <span className="total-amount">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {subtotal < 500 && subtotal > 0 && (
                    <div className="free-shipping">
                      <Truck className="inline-icon" size={16} />
                      Add ${(500 - subtotal).toFixed(2)} more for free shipping!
                    </div>
                  )}

                  <Button className="checkout-btn" onClick={() => setShowCheckout(true)}>
                    <CreditCard className="icon" size={20} />
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="checkout-dialog">
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>Complete your purchase and get your artwork delivered</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCheckout} className="checkout-form">
              <div className="form-grid">
                {Object.keys(shippingDetails).map((field) => (
                  <div key={field} className="form-group">
                    <Label htmlFor={field}>{field.replace(/([A-Z])/g, " $1")}</Label>
                    <Input
                      id={field}
                      type={field === "email" ? "email" : "text"}
                      value={shippingDetails[field]}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, [field]: e.target.value })}
                      required
                    />
                  </div>
                ))}
              </div>
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