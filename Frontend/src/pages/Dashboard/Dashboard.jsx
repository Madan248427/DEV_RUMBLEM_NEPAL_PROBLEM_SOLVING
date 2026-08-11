'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Row, Col, Card, Statistic, Spin, message } from 'antd';
import {
  BookOutlined,
  SwapOutlined,
  TeamOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import apiClient from '../../axiosInstance';
import './Dashboard.css';

const { Content } = Layout;

const Dashboard = ({ onLogout }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const booksRes = await apiClient.get('/books/');
      const transRes = await apiClient.get('/transactions/');
      const categoriesRes = await apiClient.get('/categories/');

      setStats({
        totalBooks: booksRes.data.count || 0,
        totalTransactions: transRes.data.count || 0,
        totalCategories: categoriesRes.data.count || 0,
        recentBooks: booksRes.data.results?.slice(0, 5) || [],
      });
    } catch (error) {
      message.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
  

      <Content className="dashboard-content">
        <div className="page-wrapper">
          <h1 className="page-title">Dashboard</h1>

          {loading ? (
            <div className="loading-spinner">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Row gutter={[16, 16]} className="stats-row">
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Total Books"
                      value={stats?.totalBooks || 0}
                      prefix={<BookOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Transactions"
                      value={stats?.totalTransactions || 0}
                      prefix={<SwapOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Categories"
                      value={stats?.totalCategories || 0}
                      prefix={<BgColorsOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Available Books"
                      value={stats?.totalBooks || 0}
                      prefix={<TeamOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col xs={24}>
                  <Card title="Quick Actions" className="quick-actions">
                    <div className="action-buttons">
                      <a href="/add-book" className="action-link">
                        + Add New Book
                      </a>
                      <a href="/books" className="action-link">
                        View All Books
                      </a>
                      <a href="/transaction" className="action-link">
                        Manage Transactions
                      </a>
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;
