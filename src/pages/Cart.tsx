import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const tax = subtotal * 0.05; // 5% training tax/fee
  const total = subtotal + tax;

  return (
    <div style={styles.container}>
      {/* Header & Continue Shopping */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Your Training Cart</h1>
          <p style={styles.subtitle}>Review your selected courses before proceeding to secure checkout.</p>
        </div>
        <Link to="/courses" style={styles.continueShoppingBtn}>
          ← Continue Shopping
        </Link>
      </div>

      {cart.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>🛒</div>
          <h2 style={styles.emptyTitle}>Your cart is currently empty</h2>
          <p style={styles.emptyText}>Explore our professional aviation courses and add them to your cart to get started.</p>
          <Link to="/courses" style={styles.primaryButton}>
            Browse Courses
          </Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {/* Cart Items List */}
          <div style={styles.itemListContainer}>
            <h2 style={styles.sectionHeading}>Selected Courses ({cart.length})</h2>
            <div style={styles.itemList}>
              {cart.map((item) => (
                <div key={item.id} style={styles.itemCard}>
                  <div style={styles.itemInfo}>
                    <span style={styles.itemCategory}>Online Training Course</span>
                    <h3 style={styles.itemTitle}>{item.title}</h3>
                    <p style={styles.itemDescription}>{item.description}</p>
                  </div>
                  <div style={styles.itemRight}>
                    <span style={styles.itemPrice}>${item.price.toFixed(2)}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={styles.removeButton}
                      title="Remove course"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div style={styles.summaryCard}>
            <h2 style={styles.sectionHeading}>Order Summary</h2>
            
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Subtotal</span>
              <span style={styles.summaryValue}>${subtotal.toFixed(2)}</span>
            </div>
            
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Estimated Taxes & Fees</span>
              <span style={styles.summaryValue}>${tax.toFixed(2)}</span>
            </div>
            
            <hr style={styles.divider} />
            
            <div style={styles.totalRow}>
              <span>Total Due</span>
              <span style={styles.totalPrice}>${total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              style={styles.checkoutButton}
            >
              Proceed to Secure Checkout →
            </button>

            <div style={styles.securityNote}>
              🔒 Secure 256-bit encrypted checkout
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1150px',
    margin: '40px auto',
    padding: '0 20px',
    fontFamily: 'Segoe UI, sans-serif',
    color: '#1e293b',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '35px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '1rem',
    margin: 0,
  },
  continueShoppingBtn: {
    textDecoration: 'none',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    transition: 'all 0.2s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '30px',
    alignItems: 'start',
  },
  itemListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  sectionHeading: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#334155',
    margin: '0 0 15px 0',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
  },
  itemInfo: {
    flex: 1,
  },
  itemCategory: {
    color: '#d95300',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '6px',
  },
  itemTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  itemDescription: {
    color: '#64748b',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    margin: 0,
  },
  itemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '20px',
    minWidth: '100px',
  },
  itemPrice: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    position: 'sticky',
    top: '20px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '12px',
  },
  summaryLabel: {},
  summaryValue: {
    fontWeight: 600,
    color: '#1e293b',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '18px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '24px',
  },
  totalPrice: {
    color: '#d95300',
  },
  checkoutButton: {
    width: '100%',
    backgroundColor: '#d95300',
    color: '#ffffff',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(217, 83, 0, 0.25)',
    transition: 'background-color 0.2s ease, transform 0.2s ease',
  },
  securityNote: {
    textAlign: 'center',
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '16px',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '60px 20px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    maxWidth: '600px',
    margin: '40px auto',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 10px 0',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '1rem',
    lineHeight: 1.5,
    margin: '0 0 24px 0',
  },
  primaryButton: {
    display: 'inline-block',
    backgroundColor: '#d95300',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '1rem',
    boxShadow: '0 4px 12px rgba(217, 83, 0, 0.25)',
  },
};