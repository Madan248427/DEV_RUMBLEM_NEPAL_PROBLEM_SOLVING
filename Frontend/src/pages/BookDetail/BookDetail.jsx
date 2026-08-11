'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Spin,
  message,
  Row,
  Col,
  Descriptions,
  Image,
  Space,
  Tag,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

import { bookService } from '../../bookService';
import './BookDetail.css';

const { Content } = Layout;

const BookDetail = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const response = await bookService.getBookById(id);
      setBook(response);
    } catch (error) {
      message.error('Failed to load book details');
      navigate('/books');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await bookService.deleteBook(id);
      message.success('Book deleted successfully!');
      navigate('/books');
    } catch (error) {
      message.error('Failed to delete book');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'green',
      issued: 'orange',
      reserved: 'blue',
      lost: 'red',
    };
    return colors[status] || 'default';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
 

      <Content className="book-detail-content">
        <div className="page-wrapper">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/books')}
            className="back-button"
          >
            Back to Books
          </Button>

          {loading ? (
            <div className="loading-spinner">
              <Spin size="large" />
            </div>
          ) : book ? (
            <Row gutter={[24, 24]} className="book-detail-row">
              <Col xs={24} sm={8} className="book-cover-col">
                <Card className="cover-card">
                  {book.cover_image_url ? (
                    <Image
                      src={book.cover_image_url || "/placeholder.svg"}
                      alt={book.title}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div className="no-cover">No Cover Image</div>
                  )}
                </Card>
              </Col>

              <Col xs={24} sm={16}>
                <Card className="book-info-card">
                  <h1 className="book-title">{book.title}</h1>

                  <Space style={{ marginBottom: '16px' }}>
                    <Tag color={getStatusColor(book.status)}>
                      {book.status?.toUpperCase()}
                    </Tag>
                  </Space>

                  <Descriptions bordered column={1} className="book-descriptions">
                    <Descriptions.Item label="ISBN">
                      {book.isbn || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Authors">
                      {book.authors || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Publisher">
                      {book.publisher || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Year of Publication">
                      {book.year_of_publication || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Edition">
                      {book.edition || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Language">
                      {book.language || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Category">
                      {book.category || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Number of Copies">
                      {book.number_of_copies}
                    </Descriptions.Item>
                    <Descriptions.Item label="Shelf Location">
                      {book.shelf_location || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>

                  {book.description && (
                    <div className="book-description">
                      <h3>Description</h3>
                      <p>{book.description}</p>
                    </div>
                  )}

                  {book.additional_details && (
                    <div className="book-stats">
                      <h3>Availability</h3>
                      <Row gutter={[16, 16]}>
                        <Col xs={12} sm={6}>
                          <div className="stat-box">
                            <div className="stat-value">
                              {book.additional_details.no_of_available_book}
                            </div>
                            <div className="stat-label">Available</div>
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div className="stat-box">
                            <div className="stat-value">
                              {book.additional_details.no_of_issued_book}
                            </div>
                            <div className="stat-label">Issued</div>
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div className="stat-box">
                            <div className="stat-value">
                              {book.additional_details.no_of_reserved_book}
                            </div>
                            <div className="stat-label">Reserved</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                  <div className="action-buttons">
                    <Button
                      type="primary"
                      icon={<SwapOutlined />}
                      size="large"
                      onClick={() =>
                        navigate('/transaction', {
                          state: { selectedBookId: id },
                        })
                      }
                    >
                      Create Transaction
                    </Button>
                    <Button
                      icon={<EditOutlined />}
                      size="large"
                      onClick={() => navigate(`/edit-book/${id}`)}
                    >
                      Edit Book
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      size="large"
                      onClick={handleDelete}
                    >
                      Delete Book
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>
          ) : null}
        </div>
      </Content>
    </Layout>
  );
};

export default BookDetail;
