import { Link } from "react-router-dom";
import styles from "./about.module.css";
import {
  ArrowLeftOutlined,
  AimOutlined,
  BulbOutlined,
  HeartOutlined,
} from "@ant-design/icons";

export default function About() {
  return (
    <div className={styles.container}>
      
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          
          <Link to="/" className={styles.backLink}>
            <ArrowLeftOutlined
              style={{ fontSize: 18 }}
              className={styles.backIcon}
            />
            <span>Back to Home</span>
          </Link>

          <Link to="/login" className={styles.loginBtn}>
            Login
          </Link>

        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            About <span className={styles.heroAccent}>Marvel Nexus</span>
          </h1>
          <p className={styles.heroDesc}>
            Reimagining library management for the digital age through
            innovation, accessibility, and community engagement.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.missionGrid}>

            <div className={styles.missionText}>
              <h2>Our Mission</h2>
              <p>
                Marvel Nexus exists to democratize access to knowledge and
                transform how libraries operate in the modern world.
              </p>
              <p>
                Our platform combines cutting-edge technology with intuitive
                design to create an experience that's both powerful and
                accessible to everyone.
              </p>
            </div>

            <div className={styles.visionCard}>
              <div className={styles.visionIcon}>
                <AimOutlined style={{ fontSize: 32 }} />
              </div>
              <h3 className={styles.visionTitle}>Our Vision</h3>
              <p className={styles.visionText}>
                To build a world where knowledge is instantly accessible,
                library management is effortless, and every reader can
                discover their next favorite book.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>Our Core Values</h2>

          <div className={styles.valuesGrid}>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <BulbOutlined style={{ fontSize: 26 }} />
              </div>
              <h3 className={styles.valueTitle}>Innovation</h3>
              <p className={styles.valueDesc}>
                We push the boundaries of what's possible in library
                management through modern technology.
              </p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <HeartOutlined style={{ fontSize: 26 }} />
              </div>
              <h3 className={styles.valueTitle}>Accessibility</h3>
              <p className={styles.valueDesc}>
                Knowledge should be available to everyone. We design for
                inclusivity and diverse user needs.
              </p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <AimOutlined style={{ fontSize: 26 }} />
              </div>
              <h3 className={styles.valueTitle}>Excellence</h3>
              <p className={styles.valueDesc}>
                We deliver high-quality service and continuously improve
                based on user feedback.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>What Sets Us Apart</h2>

          <div className={styles.featuresList}>

            <div className={styles.featureItem}>
              <h3 className={styles.featureItemTitle}>
                Intelligent Recommendations
              </h3>
              <p className={styles.featureItemDesc}>
                AI-powered suggestions based on your reading preferences.
              </p>
            </div>

            <div className={styles.featureItem}>
              <h3 className={styles.featureItemTitle}>
                Real-Time Availability
              </h3>
              <p className={styles.featureItemDesc}>
                Instantly see availability and reserve books in one click.
              </p>
            </div>

            <div className={styles.featureItem}>
              <h3 className={styles.featureItemTitle}>
                Community Engagement
              </h3>
              <p className={styles.featureItemDesc}>
                Connect, review, share, and participate in book clubs.
              </p>
            </div>

            <div className={styles.featureItem}>
              <h3 className={styles.featureItemTitle}>
                Advanced Management Tools
              </h3>
              <p className={styles.featureItemDesc}>
                Analytics, automation, and smart workflows for libraries.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>2026</div>
              <p className={styles.statLabel}>Founded</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>50+</div>
              <p className={styles.statLabel}>Libraries</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>100K+</div>
              <p className={styles.statLabel}>Books</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>25K+</div>
              <p className={styles.statLabel}>Users</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Join the Marvel Nexus Community
          </h2>
          <p className={styles.ctaDesc}>
            Experience the future of library management today.
          </p>

          <Link to="/login" className={styles.ctaBtn}>
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; 2026 Marvel Nexus. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}