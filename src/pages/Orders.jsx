import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { apiRequest } from '../utils/api';
import '../styles/pages/Orders.css';

export default function Orders() {
  const { role } = useAuth();
  const { orders, updateOrderStatus } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const getStatusBadge = (status) => {
    const statusConfig = {
      processing: { label: 'Processing', color: 'status-processing' },
      shipped: { label: 'Shipped', color: 'status-shipped' },
      delivered: { label: 'Delivered', color: 'status-delivered' },
      cancelled: { label: 'Cancelled', color: 'status-cancelled' },
      pending: { label: 'Pending', color: 'status-processing' },
    };

    const config = statusConfig[status] || { label: status, color: 'status-processing' };
    return <span className={`status-badge ${config.color}`}>{config.label}</span>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
      case 'pending':
        return <Clock className="icon-processing" size={20} />;
      case 'shipped':
        return <Truck className="icon-shipped" size={20} />;
      case 'delivered':
        return <CheckCircle className="icon-delivered" size={20} />;
      default:
        return <Package className="icon-default" size={20} />;
    }
  };

  const processingOrders = orders.filter((o) => o.status === 'processing' || o.status === 'pending');
  const shippedOrders = orders.filter((o) => o.status === 'shipped');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  const OrderCard = ({ order }) => {
    const [paymentStatus, setPaymentStatus] = useState('loading');
    const [deliveryInfo, setDeliveryInfo] = useState(null);

    useEffect(() => {
      const loadOrderDetails = async () => {
        try {
          const payments = await apiRequest(`/api/orders/${order.id}/payments`);
          setPaymentStatus(payments.length > 0 ? payments[0].status : 'pending');

          const deliveries = await apiRequest(`/api/orders/${order.id}/deliveries`);
          setDeliveryInfo(deliveries.length > 0 ? deliveries[0] : null);
        } catch (error) {
          console.error('Error loading order details:', error);
        }
      };

      loadOrderDetails();
    }, [order.id]);

    return (
      <div className="order-card">
        <div className="order-card-content">
          <div className="order-header">
            <div className="order-header-left">
              {getStatusIcon(order.status)}
              <div>
                <h3 className="order-id">Order #{order.id}</h3>
                <p className="order-date">
                  Placed on {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            {getStatusBadge(order.status)}
          </div>

          <div className="order-items-preview">
            <img
              src={order.artwork?.imageUrl || '/placeholder-artwork.png'}
              alt={order.artwork?.title || 'Artwork'}
              className="order-item-img"
              onError={(e) => {
                e.target.src = '/placeholder-artwork.png';
              }}
            />
          </div>

          <div className="order-summary">
            <div>
              <p className="order-item-count">1 item</p>
              <p className="order-total">${(order.artwork?.price || order.total || 0).toFixed(2)}</p>
              <p className="payment-status">
                Payment: <span className={`status-${paymentStatus}`}>{paymentStatus}</span>
              </p>
            </div>
            <button onClick={() => setSelectedOrder(order)} className="view-details-btn">
              <Eye className="mr-2" size={16} />
              View Details
            </button>
          </div>

          {deliveryInfo && (
            <div className="order-delivery">
              <p>
                <Truck className="inline-icon" size={16} /> Delivery Status:{' '}
                <span className={`status-${deliveryInfo.status}`}>{deliveryInfo.status}</span>
              </p>
              {deliveryInfo.tracking_number && (
                <p className="tracking-info">
                  Tracking: <span className="tracking-number">{deliveryInfo.tracking_number}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="orders-container">
      <div className="orders-wrapper">
        <div className="orders-header">
          <h1 className="orders-title">
            {role === 'Artist' ? 'Order Management' : 'My Orders'}
          </h1>
          <p className="orders-subtitle">
            {role === 'Artist'
              ? 'Manage orders for your artworks'
              : 'Track and manage your artwork purchases'
            }
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <Package className="orders-empty-icon" size={64} />
            <p className="orders-empty-text">No orders yet</p>
            <p className="orders-empty-sub">
              {role === 'Artist' ? 'No orders have been placed for your artworks yet.' : 'Start shopping to see your orders here'}
            </p>
          </div>
        ) : (
          <div className="orders-tabs">
            <div className="tabs-list">
              <button className="tab-trigger active">All ({orders.length})</button>
              <button className="tab-trigger">Processing ({processingOrders.length})</button>
              <button className="tab-trigger">Shipped ({shippedOrders.length})</button>
              <button className="tab-trigger">Delivered ({deliveredOrders.length})</button>
            </div>

            <div className="tab-content">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {selectedOrder && (
          <div className="order-dialog-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="order-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h2 className="dialog-title">Order Details - #{selectedOrder.id}</h2>
                <p className="dialog-description">
                  Placed on {new Date(selectedOrder.createdAt || selectedOrder.orderDate).toLocaleDateString()}
                </p>
                <button className="dialog-close" onClick={() => setSelectedOrder(null)}>×</button>
              </div>

              <div className="dialog-content">
                <div className="order-status-section">
                  <div className="order-status-header">
                    <h3>Order Status</h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="payment-status">
                    Payment Status: <span className={`status-${paymentStatus}`}>{paymentStatus}</span>
                  </p>
                  {deliveryInfo && (
                    <div className="delivery-status">
                      <p>Delivery Status: <span className={`status-${deliveryInfo.status}`}>{deliveryInfo.status}</span></p>
                      {deliveryInfo.tracking_number && (
                        <p className="tracking-info">
                          Tracking Number:{' '}
                          <span className="tracking-number">{deliveryInfo.tracking_number}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="section-divider"></div>

                <div>
                  <h3 className="section-title">Items Ordered</h3>
                  <div className="ordered-items">
                    <div className="ordered-item">
                      <img
                        src={selectedOrder.artwork?.imageUrl || '/placeholder-artwork.png'}
                        alt={selectedOrder.artwork?.title || 'Artwork'}
                        className="ordered-item-img"
                        onError={(e) => {
                          e.target.src = '/placeholder-artwork.png';
                        }}
                      />
                      <div className="ordered-item-info">
                        <h4>{selectedOrder.artwork?.title || 'Artwork'}</h4>
                        <div className="ordered-item-details">
                          <span>Qty: 1</span>
                          <span className="price">
                            ${(selectedOrder.artwork?.price || selectedOrder.total || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="section-divider"></div>

                <div>
                  <h3 className="section-title">Order Summary</h3>
                  <div className="summary-box">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>${(selectedOrder.artwork?.price || selectedOrder.total || 0).toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping</span>
                      <span className="free">FREE</span>
                    </div>
                    <div className="section-divider"></div>
                    <div className="summary-row total">
                      <span>Total</span>
                      <span className="total-price">${(selectedOrder.artwork?.price || selectedOrder.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {role === 'Artist' && selectedOrder.status === 'pending' && (
                  <div className="order-actions">
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'processing');
                        setSelectedOrder(null);
                      }}
                      className="btn-secondary"
                    >
                      Accept Order
                    </button>
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'cancelled');
                        setSelectedOrder(null);
                      }}
                      className="btn-danger"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
                {role === 'Artist' && selectedOrder.status === 'processing' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'shipped');
                      setSelectedOrder(null);
                    }}
                    className="btn-primary"
                  >
                    Mark as Shipped
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
