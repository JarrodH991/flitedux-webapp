import { Link } from "react-router-dom";

export default function CheckoutSuccess() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconWrapper}>✈️</div>
        <h1 style={styles.title}>Payment Successful!</h1>
        <p style={styles.subtitle}>
          Your transaction has been approved. Your selected flight training modules have been permanently unlocked and added to your dashboard.
        </p>

        <div style={styles.buttonGroup}>
          <Link to="/dashboard" style={styles.primaryButton}>
            Go to My Dashboard (myFlitedux)
          </Link>
          <Link to="/courses" style={styles.secondaryButton}>
            Browse More Courses
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh", padding: "20px", fontFamily: "Segoe UI, sans-serif" },
  card: { backgroundColor: "#ffffff", padding: "50px 40px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", textAlign: "center", maxWidth: "550px", width: "100%" },
  iconWrapper: { fontSize: "48px", marginBottom: "20px" },
  title: { fontSize: "26px", fontWeight: "700", color: "#0f172a", marginBottom: "12px" },
  subtitle: { fontSize: "15px", color: "#64748b", lineHeight: "1.6", marginBottom: "30px" },
  buttonGroup: { display: "flex", flexDirection: "column", gap: "12px" },
  primaryButton: { backgroundColor: "#0284c7", color: "#ffffff", padding: "14px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "15px", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.2)" },
  secondaryButton: { backgroundColor: "#f1f5f9", color: "#334155", padding: "12px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px" },
};