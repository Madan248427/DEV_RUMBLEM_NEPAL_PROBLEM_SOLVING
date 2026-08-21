import { Link } from "react-router-dom";
import styles from "./page.module.css";
import {
  StarOutlined,
  BookOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  SafetyOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

export default function LandingPage() {
  return (
    <div className={styles.container}>
      
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.navBrand}>
            <StarOutlined style={{ fontSize: 24, color: "#fbbf24" }} />
            <span className={styles.navBrandText}>Marvel Nexus</span>
          </div>

          <div className={styles.navLinks}>
            <Link to="/reports" className={styles.navLink}>Live Reports</Link>
            <Link to="/about" className={styles.navLink}>About</Link>
            <Link to="/login" className={styles.loginBtn}>Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          
          <div className={styles.badge}>
            <StarOutlined style={{ fontSize: 16 }} />
            <span>Welcome to Hamro Nepal Portal</span>
          </div>

          <h1 className={styles.heroTitle}>
            Discover the Ultimate{" "}
            <span className={styles.heroAccent}>
              Civic Issue Platform
            </span>
          </h1>

          <p className={styles.heroDescription}>
            Empowering citizens, responders, and community leaders to report, track, 
            and resolve civic issues transparently across Nepal.
          </p>

          <div className={styles.ctas}>
            <Link to="/login" className={styles.primaryBtn}>
              Get Started{" "}
              <ArrowRightOutlined style={{ fontSize: 18 }} />
            </Link>

            <Link to="/reports" className={styles.secondaryBtn}>
              View Live Reports
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContent}>
          <h2 className={styles.sectionTitle}>Powerful Features</h2>

          <div className={styles.featureGrid}>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <BookOutlined style={{ fontSize: 24 }} />
              </div>
              <h3 className={styles.featureTitle}>Multi-Category Reports</h3>
              <p className={styles.featureDesc}>
                Report issues spanning road damage, traffic, load shedding, waste, and local commerce.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <ThunderboltOutlined style={{ fontSize: 24 }} />
              </div>
              <h3 className={styles.featureTitle}>Real-time Updates</h3>
              <p className={styles.featureDesc}>
                Track live issue progress from Pending to In Progress and Resolved.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <TeamOutlined style={{ fontSize: 24 }} />
              </div>
              <h3 className={styles.featureTitle}>Community Power</h3>
              <p className={styles.featureDesc}>
                Upvote and verify neighborhood incidents to alert regional authorities faster.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <SafetyOutlined style={{ fontSize: 24 }} />
              </div>
              <h3 className={styles.featureTitle}>Verified Status</h3>
              <p className={styles.featureDesc}>
                Transparent proof and confirmation for solved community problems.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsContent}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>15K+</div>
              <p className={styles.statLabel}>Issues Resolved</p>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statValue}>50K+</div>
              <p className={styles.statLabel}>Active Citizens</p>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statValue}>77</div>
              <p className={styles.statLabel}>Districts Covered</p>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statValue}>24/7</div>
              <p className={styles.statLabel}>Emergency Monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Ready to Transform Your Community?
          </h2>
          <p className={styles.ctaDesc}>
            Join thousands of active citizens making Nepal cleaner, safer, and better organized.
          </p>
          <Link to="/login" className={styles.ctaBtn}>
            Start Exploring Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerGrid}>
            
            <div>
              <div className={styles.footerBrand}>
                <StarOutlined style={{ fontSize: 20, color: "#fbbf24" }} />
                <span>Hamro Nepal</span>
              </div>
              <p className={styles.footerBrandDesc}>
                Empowering active citizenship and municipal collaboration.
              </p>
            </div>

            <div className={styles.footerSection}>
              <div className={styles.footerSectionHeader}>
                <h4>Product</h4>
              </div>
              <ul className={styles.footerLinks}>
                <li><Link to="/about" className={styles.footerLink}>About</Link></li>
                <li><Link to="/reports" className={styles.footerLink}>Live Reports</Link></li>
              </ul>
            </div>

            <div className={styles.footerSection}>
              <div className={styles.footerSectionHeader}>
                <h4>Support</h4>
              </div>
              <ul className={styles.footerLinks}>
                <li><Link to="/" className={styles.footerLink}>Help Center</Link></li>
              </ul>
            </div>

            <div className={styles.footerSection}>
              <div className={styles.footerSectionHeader}>
                <h4>Legal</h4>
              </div>
              <ul className={styles.footerLinks}>
                <li><Link to="/" className={styles.footerLink}>Privacy</Link></li>
              </ul>
            </div>

          </div>

          <div className={styles.footerBottom}>
            <p>&copy; 2026 Hamro Nepal. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}