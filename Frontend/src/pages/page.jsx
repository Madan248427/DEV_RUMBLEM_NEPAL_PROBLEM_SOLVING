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

export default function Home() {
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
            <span>Welcome to the Future of Libraries</span>
          </div>

          <h1 className={styles.heroTitle}>
            Discover the Ultimate{" "}
            <span className={styles.heroAccent}>
              Library Experience
            </span>
          </h1>

          <p className={styles.heroDescription}>
            Marvel Nexus is a next-generation library management platform
            that empowers students, educators, and library managers to
            access knowledge seamlessly and manage resources efficiently.
          </p>

          <div className={styles.ctas}>
            <Link to="/login" className={styles.primaryBtn}>
              Get Started{" "}
              <ArrowRightOutlined style={{ fontSize: 18 }} />
            </Link>

            <Link to="/about" className={styles.secondaryBtn}>
              Learn More
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
              <h3 className={styles.featureTitle}>Vast Collection</h3>
              <p className={styles.featureDesc}>
                Access thousands of books across multiple categories and genres.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <ThunderboltOutlined style={{ fontSize: 24 }} />
              </div>
              <h3 className={styles.featureTitle}>Instant Access</h3>
              <p className={styles.featureDesc}>
                Reserve and issue books instantly with our streamlined system.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <TeamOutlined style={{ fontSize: 24 }} />
              </div>
              <h3 className={styles.featureTitle}>Community</h3>
              <p className={styles.featureDesc}>
                Connect with fellow readers and share reading recommendations.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <SafetyOutlined style={{ fontSize: 24 }} />
              </div>
              <h3 className={styles.featureTitle}>Secure & Private</h3>
              <p className={styles.featureDesc}>
                Your reading data is protected with enterprise-grade security.
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
              <div className={styles.statValue}>50K+</div>
              <p className={styles.statLabel}>Books Available</p>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statValue}>10K+</div>
              <p className={styles.statLabel}>Active Users</p>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statValue}>100%</div>
              <p className={styles.statLabel}>Uptime Guarantee</p>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statValue}>24/7</div>
              <p className={styles.statLabel}>Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Ready to Transform Your Library Experience?
          </h2>
          <p className={styles.ctaDesc}>
            Join thousands of students and educators who have already discovered
            the power of Marvel Nexus.
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
                <span>Marvel Nexus</span>
              </div>
              <p className={styles.footerBrandDesc}>
                Revolutionizing library management for the modern age.
              </p>
            </div>

            <div className={styles.footerSection}>
              <h4>Product</h4>
              <ul className={styles.footerLinks}>
                <li><Link to="/about" className={styles.footerLink}>About</Link></li>
              </ul>
            </div>

            <div className={styles.footerSection}>
              <h4>Support</h4>
              <ul className={styles.footerLinks}>
                <li><Link to="/" className={styles.footerLink}>Help Center</Link></li>
              </ul>
            </div>

            <div className={styles.footerSection}>
              <h4>Legal</h4>
              <ul className={styles.footerLinks}>
                <li><Link to="/" className={styles.footerLink}>Privacy</Link></li>
              </ul>
            </div>

          </div>

          <div className={styles.footerBottom}>
            <p>&copy; 2026 Marvel Nexus. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}