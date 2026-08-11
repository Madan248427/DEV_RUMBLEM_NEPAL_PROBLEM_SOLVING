'use client';

import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  List,
  Typography,
  Button,
  Tag,
  Spin,
  message,
} from 'antd';
import {
  NotificationOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axiosInstance from '../../axiosInstance';
import './Notice.css';

const { Content } = Layout;
const { Title, Text } = Typography;

const NoticePage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await axiosInstance.get('/notices/');
      setNotices(res.data.results || res.data);
    } catch (err) {
      message.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (noticeId) => {
    try {
      await axiosInstance.post('/notice-read/', {
        notice: noticeId,
      });

      setNotices((prev) =>
        prev.map((n) =>
          n.id === noticeId ? { ...n, read: true } : n
        )
      );

      message.success('Marked as read');
    } catch (err) {
      message.error('Failed to mark as read');
    }
  };

  return (
    <Layout className="notice-layout">
      <Content className="notice-content">
        <Title level={2} className="notice-title">
          <NotificationOutlined /> Notices
        </Title>

        {loading ? (
          <div className="notice-loading">
            <Spin size="large" />
          </div>
        ) : (
          <List
            dataSource={notices}
            renderItem={(notice) => (
              <Card
                className={`notice-card ${
                  notice.read ? 'read' : 'unread'
                }`}
              >
                <div className="notice-header">
                  <Title level={4}>{notice.title}</Title>

                  {!notice.read ? (
                    <Tag color="blue">New</Tag>
                  ) : (
                    <Tag icon={<CheckCircleOutlined />} color="green">
                      Read
                    </Tag>
                  )}
                </div>

                <Text className="notice-message">
                  {notice.message}
                </Text>

                <div className="notice-footer">
                  <Text type="secondary">
                    {new Date(notice.created_at).toLocaleString()}
                  </Text>

                  {!notice.read && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => markAsRead(notice.id)}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              </Card>
            )}
          />
        )}
      </Content>
    </Layout>
  );
};

export default NoticePage;
