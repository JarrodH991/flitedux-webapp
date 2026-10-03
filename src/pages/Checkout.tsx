import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/authHooks";
import * as api from "../services/api";

export default function Checkout() {
  const { cart, clearCart, completeCheckout } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const tax = subtotal * 0.05; // 5% training tax/fee
  const total = subtotal + tax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Checkout requires a signed-in user so we can attach the purchase
    // to their account and show it on their dashboard.
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setSubmitting(true);
    setError(null);

    // ─────────────────────────────────────────────────────────────────────
    // 🔌 AWS: In production this is where you'd hand off to Stripe (or
    //         your payment provider) and wait for confirmation. The
    //         enrolments should be written by a server-side webhook AFTER
    //         payment succeeds — never by the client.
    //
    //         For dev, we simulate a successful payment and immediately
    //         write the enrolments to localStorage.
    // ─────────────────────────────────────────────────────────────────────

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 800));

    // Build the items to enrol
    const items = cart.map((item) => ({
      courseSlug: item.id,
      courseTitle: item.title,
      price: item.price,
    }));

    // Write the enrolments
    const result = await api.createEnrolments({
      userId: user.id,
      items,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(
        'Payment went through but we couldn\'t unlock your courses. Please contact support with your receipt.',
      );
      return;
    }

    // Clear the cart and complete the flow
    clearCart();
    completeCheckout();

    setSubmitting(false);
    navigate("/checkout-success");
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Secure Flight Training Checkout</h1>
        <Link to="/courses" style={styles.backButton}>
          ← Continue Shopping
        </Link>
      </div>

      {/* Sign-in prompt for logged-out users */}
      {!user && (
        <div style={styles.signInBanner}>
          <div>
            <strong>Please sign in to complete your purchase.</strong>
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>
              Your courses need to be tied to your account so you can access
              them on your dashboard.
            </div>
          </div>
          <Link
            to="/login"
            state={{ from: '/checkout' }}
            style={styles.signInBtn}
          >
            Sign in →
          </Link>
        </div>
      )}

      {error && (
        <div style={styles.errorBanner} role="alert">
          ⚠ {error}
        </div>
      )}

      <div style={styles.grid}>
        {/* Order Summary Column */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Order Summary ({cart.length} courses)
          </h2>
          {cart.length === 0 ? (
            <p style={styles.emptyText}>Your cart is currently empty.</p>
          ) : (
            <div style={styles.itemList}>
              {cart.map((item) => (
                <div key={item.id} style={styles.itemRow}>
                  <span>{item.title}</span>
                  <span style={styles.itemPrice}>
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}
              <hr style={styles.divider} />
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Estimated Taxes & Fees</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <hr style={styles.divider} />
              <div style={styles.totalRow}>
                <span>Total Due</span>
                <span style={styles.totalPrice}>${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Form Column */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Billing & Payment Details</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="Captain John Doe"
                value={formData.fullName}
                onChange={handleChange}
                style={styles.input}
                disabled={submitting}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Email Address (for receipt & records)
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="pilot@flitedux.com"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                disabled={submitting}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Card Number</label>
              <input
                type="text"
                name="cardNumber"
                required
                placeholder="4000 1234 5678 9010"
                maxLength={19}
                value={formData.cardNumber}
                onChange={handleChange}
                style={styles.input}
                disabled={submitting}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Expiry Date</label>
                <input
                  type="text"
                  name="expiry"
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                  value={formData.expiry}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={submitting}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>CVC / CVV</label>
                <input
                  type="password"
                  name="cvc"
                  required
                  placeholder="123"
                  maxLength={4}
                  value={formData.cvc}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={submitting}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity:
                  cart.length === 0 || submitting || !user ? 0.6 : 1,
                cursor:
                  cart.length === 0 || submitting || !user
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={cart.length === 0 || submitting || !user}
            >
              {submitting
                ? 'Processing payment…'
                : !user
                  ? 'Sign in to complete purchase'
                  : 'Complete Purchase & Unlock Courses'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "0 20px",
    fontFamily: "Segoe UI, sans-serif",
    color: "#1e293b",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  title: { fontSize: "28px", fontWeight: "700", color: "#0f172a" },
  backButton: {
    textDecoration: "none",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    transition: "background 0.2s",
  },
  signInBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: "14px 18px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 12,
    marginBottom: 24,
    fontSize: 14,
    color: "#7c2d12",
    flexWrap: "wrap",
  },
  signInBtn: {
    background: "#d95300",
    color: "#ffffff",
    padding: "10px 18px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  errorBanner: {
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 20,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "30px" },
  card: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#334155",
  },
  emptyText: { color: "#64748b", fontStyle: "italic" },
  itemList: { display: "flex", flexDirection: "column", gap: "12px" },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "15px",
    color: "#475569",
  },
  itemPrice: { fontWeight: "600", color: "#0f172a" },
  divider: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: "15px 0",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#64748b",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },
  totalPrice: { color: "#0284c7" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  input: {
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  row: { display: "flex", gap: "15px" },
  submitButton: {
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    marginTop: "10px",
    transition: "background 0.2s",
  },
};