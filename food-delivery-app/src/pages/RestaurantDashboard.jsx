import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, Edit2, Trash2, Save, X, Upload, Store, Package, Clock, CheckCircle, XCircle, Bell } from 'lucide-react';
import api from '../api';
import '../styles/RestaurantDashboard.css';

export default function RestaurantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restaurantForm, setRestaurantForm] = useState({ name: '', location: '', contact: '', image: '' });
  const [menuItemForm, setMenuItemForm] = useState({ name: '', quantity: '', category: 'Main Course', expiryTime: '', image: null });
  const [backendData, setBackendData] = useState(null); // State for your backend fetch
  const categories = ['Main Course', 'Rice', 'Bread', 'Dessert', 'Snacks', 'Beverages', 'Side Dish'];

  useEffect(() => {
    if (!user || user.role !== 'restaurant') {
      navigate('/login');
      return;
    }

    const loadDataInsideEffect = async () => {
      try {
        setLoading(true);

        // Fetch restaurant
        let currentRestaurant = restaurant;
        try {
          const res = await api.get('/restaurants/my-restaurant');
          currentRestaurant = res.data;
          setRestaurant(currentRestaurant);
        } catch (err) {
          if (err.response?.status === 404) {
            setShowRestaurantForm(true);
            currentRestaurant = null;
          }
        }

        // Fetch menu items
        if (currentRestaurant) {
          try {
            const itemsRes = await api.get('/menu-items/my-items');
            setMenuItems(itemsRes.data);
          } catch (err) {
            console.error('Error loading menu items:', err);
          }

          // Fetch pickup requests
          try {
            const pickupsRes = await api.get('/pickups/my-restaurant');
            setPickupRequests(pickupsRes.data || []);
          } catch (err) {
            console.error('Error loading pickup requests:', err);
          }
        }

        // Fetch generic backend data
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/data`);
          const data = await response.json();
          setBackendData(data); // fix from setYourState
        } catch (err) {
          console.error('Error fetching backend data:', err);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDataInsideEffect();
  }, [user, navigate]);

  // --- Restaurant Handlers ---
  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (restaurant) {
        res = await api.put('/restaurants/my-restaurant', restaurantForm);
      } else {
        res = await api.post('/restaurants', restaurantForm);
      }
      setRestaurant(res.data);
      setShowRestaurantForm(false);
      alert('Restaurant profile saved successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save restaurant profile');
    }
  };

  // --- Menu Item Handlers ---
  const handleMenuItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', menuItemForm.name);
      formData.append('quantity', menuItemForm.quantity);
      formData.append('category', menuItemForm.category);
      formData.append('expiryTime', menuItemForm.expiryTime);

      if (menuItemForm.image) {
        if (menuItemForm.image instanceof File) {
          formData.append('image', menuItemForm.image);
        } else if (typeof menuItemForm.image === 'string' && menuItemForm.image.trim()) {
          formData.append('image', menuItemForm.image);
        }
      }

      if (editingItem) {
        await api.put(`/menu-items/${editingItem._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Menu item updated successfully!');
      } else {
        await api.post('/menu-items', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Menu item added successfully!');
      }

      setShowMenuItemForm(false);
      setEditingItem(null);
      setMenuItemForm({ name: '', quantity: '', category: 'Main Course', expiryTime: '', image: null });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/menu-items/${id}`);
      alert('Menu item deleted successfully!');
      setMenuItems(menuItems.filter(item => item._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete menu item');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setMenuItemForm({ name: item.name, quantity: item.quantity, category: item.category, expiryTime: item.expiryTime, image: null });
    setShowMenuItemForm(true);
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || '';
    return `${backendUrl}${image}`;
  };

  if (loading) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="restaurant-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>🍽️ Restaurant Dashboard</h1>
          <p>Welcome, {user?.name}</p>
        </div>
        <div className="header-actions">
          <button onClick={logout} className="btn-secondary">Logout</button>
        </div>
      </div>

      {/* Restaurant Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <Store size={24} />
          <h2>Restaurant Profile</h2>
          {restaurant && !showRestaurantForm && (
            <button onClick={() => {
              setRestaurantForm({ name: restaurant.name || '', location: restaurant.location || '', contact: restaurant.contact || '', image: restaurant.image || '' });
              setShowRestaurantForm(true);
            }} className="btn-edit">Edit Profile</button>
          )}
        </div>

        {showRestaurantForm ? (
          <form onSubmit={handleRestaurantSubmit} className="restaurant-form">
            <div className="form-row">
              <div className="form-group">
                <label>Restaurant Name *</label>
                <input type="text" value={restaurantForm.name} onChange={e => setRestaurantForm({ ...restaurantForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input type="text" value={restaurantForm.location} onChange={e => setRestaurantForm({ ...restaurantForm, location: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contact</label>
                <input type="text" value={restaurantForm.contact} onChange={e => setRestaurantForm({ ...restaurantForm, contact: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input type="url" value={restaurantForm.image} onChange={e => setRestaurantForm({ ...restaurantForm, image: e.target.value })} placeholder="https://example.com/image.jpg" />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Save Profile</button>
              {restaurant && <button type="button" onClick={() => setShowRestaurantForm(false)} className="btn-cancel">Cancel</button>}
            </div>
          </form>
        ) : restaurant ? (
          <div className="restaurant-info">
            <div className="info-card">
              <h3>{restaurant.name}</h3>
              <p><strong>Location:</strong> {restaurant.location}</p>
              {restaurant.contact && <p><strong>Contact:</strong> {restaurant.contact}</p>}
            </div>
          </div>
        ) : null}
      </div>

      {/* Menu Items Section */}
      {restaurant && (
        <div className="dashboard-section">
          <div className="section-header">
            <Package size={24} />
            <h2>Menu Items</h2>
            <button onClick={() => { setEditingItem(null); setMenuItemForm({ name: '', quantity: '', category: 'Main Course', expiryTime: '', image: null }); setShowMenuItemForm(true); }} className="btn-primary"><Plus size={18} /> Add Menu Item</button>
          </div>

          {/* Menu Form */}
          {showMenuItemForm && (
            <form onSubmit={handleMenuItemSubmit} className="menu-item-form" encType="multipart/form-data">
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input type="text" value={menuItemForm.name} onChange={e => setMenuItemForm({ ...menuItemForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" min="1" value={menuItemForm.quantity} onChange={e => setMenuItemForm({ ...menuItemForm, quantity: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select value={menuItemForm.category} onChange={e => setMenuItemForm({ ...menuItemForm, category: e.target.value })} required>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                </div>
                <div className="form-group">
                  <label>Expiry Time</label>
                  <input type="datetime-local" value={menuItemForm.expiryTime} onChange={e => setMenuItemForm({ ...menuItemForm, expiryTime: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Item Image</label>
                <div className="file-upload-wrapper">
                  <input type="file" accept="image/*" onChange={e => { const file = e.target.files[0]; if (file) { setMenuItemForm({ ...menuItemForm, image: file }); const urlInput = document.getElementById('imageUrlInput'); if (urlInput) urlInput.value = ''; } }} className="file-input" />
                  <label className="file-label"><Upload size={18} /> {menuItemForm.image instanceof File ? menuItemForm.image.name : 'Choose Image File'}</label>
                </div>
                <small className="form-hint">Or provide an image URL</small>
                <input id="imageUrlInput" type="url" placeholder="Image URL (optional)" defaultValue={typeof menuItemForm.image === 'string' ? menuItemForm.image : ''} onChange={e => { if (e.target.value) setMenuItemForm({ ...menuItemForm, image: e.target.value }); }} style={{ marginTop: '0.5rem' }} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">{editingItem ? <><Save size={18} /> Update Item</> : <><Plus size={18} /> Add Item</>}</button>
                <button type="button" onClick={() => { setShowMenuItemForm(false); setEditingItem(null); setMenuItemForm({ name: '', quantity: '', category: 'Main Course', expiryTime: '', image: null }); }} className="btn-cancel"><X size={18} /> Cancel</button>
              </div>
            </form>
          )}

          {/* Menu Items Grid */}
          <div className="menu-items-grid">
            {menuItems.length === 0 ? <div className="empty-state"><Package size={48} /><p>No menu items yet. Add your first item!</p></div> :
              menuItems.map(item => {
                const imageUrl = getImageUrl(item.image);
                return (
                  <div key={item._id} className="menu-item-card">
                    <div className="item-image" style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#fef3c7' }}>
                      {!imageUrl && '🍛'}
                    </div>
                    <div className="item-details">
                      <h3>{item.name}</h3>
                      <div className="item-meta">
                        <span className="badge">{item.category}</span>
                        <span><Package size={14} /> {item.quantity} available</span>
                        {item.expiryTime && <span><Clock size={14} /> {new Date(item.expiryTime).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="item-actions">
                      <button onClick={() => handleEditItem(item)} className="btn-edit-small"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteItem(item._id)} className="btn-delete-small"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Pickup Requests Section */}
      {restaurant && (
        <div className="dashboard-section">
          <div className="section-header">
            <Bell size={24} />
            <h2>Pickup Requests</h2>
            {pickupRequests.length > 0 && <span className="pickup-badge">{pickupRequests.length}</span>}
          </div>

          {pickupRequests.length === 0 ? <div className="empty-state"><Bell size={48} /><p>No pickup requests yet</p></div> :
            <div className="pickup-requests-list">
              {pickupRequests.map(request => {
                const myItems = request.items.filter(item => item.restaurant?._id === restaurant._id || item.restaurant?.toString() === restaurant._id.toString());
                if (myItems.length === 0) return null;

                return (
                  <div key={request._id} className="pickup-request-card">
                    <div className="pickup-header">
                      <div>
                        <h3>Request from {request.requestedBy?.name || request.requesterName}</h3>
                        <p className="pickup-meta">{new Date(request.createdAt).toLocaleString()} • Payment: {request.paymentStatus} ({request.paymentMethod})</p>
                      </div>
                      <span className={`status-badge status-${request.status}`}>{request.status}</span>
                    </div>

                    <div className="pickup-items">
                      <h4>Items from your restaurant:</h4>
                      {myItems.map((item, idx) => <div key={idx} className="pickup-item"><span>{item.itemName || item.menuItem?.name} × {item.quantity}</span><span>₹{item.itemPrice * item.quantity}</span></div>)}
                    </div>

                    <div className="pickup-total"><strong>Total: ₹{myItems.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0)}</strong></div>

                    {request.status === 'pending' && (
                      <div className="pickup-actions">
                        <button onClick={async () => { try { await api.put(`/pickups/${request._id}/status`, { status: 'accepted' }); setPickupRequests(pickupRequests.map(r => r._id === request._id ? { ...r, status: 'accepted' } : r)); } catch { alert('Failed to update request status'); } }} className="btn-accept"><CheckCircle size={18} /> Accept</button>
                        <button onClick={async () => { try { await api.put(`/pickups/${request._id}/status`, { status: 'rejected' }); setPickupRequests(pickupRequests.map(r => r._id === request._id ? { ...r, status: 'rejected' } : r)); } catch { alert('Failed to update request status'); } }} className="btn-reject"><XCircle size={18} /> Reject</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          }
        </div>
      )}
    </div>
  );
}


