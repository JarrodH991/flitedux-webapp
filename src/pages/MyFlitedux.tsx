import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function MyFlitedux() {
  const { purchasedCourses } = useCart();

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <h1 style={styles.title}>MyFlitedux Training Dashboard</h1>
        <p style={styles.subtitle}>Access your unlocked ground school courses, training logs, and materials.</p>
      </div>

      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Your Unlocked Courses ({purchasedCourses.length})</h2>
        <Link to="/courses" style={styles.browseButton}>+ Enroll in New Courses</Link>
      </div>

      {purchasedCourses.length === 0 ? (
        <div style={styles.emptyCard}>
          <p style={styles.emptyTitle}>No active course enrollments found.</p>
          <p style={styles.emptySubtitle}>Explore our catalog to start building your aviation expertise today.</p>
          <Link to="/courses" style={styles.primaryButton}>Explore Courses</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {purchasedCourses.map((course) => (
            <div key={course.id} style={styles.courseCard}>
              <div style={styles.badge}>Unlocked</div>
              <h3 style={styles.courseTitle}>{course.title}</h3>
              <p style={styles.courseDesc}>{course.description}</p>
              <div style={styles.cardFooter}>
                <span style={styles.progressText}>Status: Ready to Study</span>
                <button style={styles.startButton} onClick={() => alert(`Launching module: ${course.title}`)}>
                  Start Learning →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: "1200px", margin: "40px auto", padding: "0 20px", fontFamily: "Segoe UI, sans-serif", color: "#1e293b" },
  headerSection: { marginBottom: "35px" },
  title: { fontSize: "30px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" },
  subtitle: { fontSize: "16px", color: "#64748b" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  sectionTitle: { fontSize: "20px", fontWeight: "600", color: "#334155" },
  browseButton: { textDecoration: "none", color: "#0284c7", fontWeight: "600", fontSize: "14px" },
  emptyCard: { backgroundColor: "#ffffff", padding: "50px", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" },
  emptyTitle: { fontSize: "18px", fontWeight: "600", color: "#334155", marginBottom: "8px" },
  emptySubtitle: { fontSize: "14px", color: "#64748b", marginBottom: "20px" },
  primaryButton: { backgroundColor: "#0284c7", color: "#ffffff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" },
  courseCard: { backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", position: "relative" },
  badge: { alignSelf: "flex-start", backgroundColor: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", marginBottom: "12px", textTransform: "uppercase" },
  courseTitle: { fontSize: "18px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" },
  courseDesc: { fontSize: "14px", color: "#64748b", lineHeight: "1.5", flex: 1, marginBottom: "20px" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "15px" },
  progressText: { fontSize: "13px", color: "#64748b", fontWeight: "500" },
  startButton: { backgroundColor: "#0284c7", color: "#ffffff", border: "none", padding: "8px 14px", borderRadius: "6px", fontWeight: "600", fontSize: "13px", cursor: "pointer" },
};