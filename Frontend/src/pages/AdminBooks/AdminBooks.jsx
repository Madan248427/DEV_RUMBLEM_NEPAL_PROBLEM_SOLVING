'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Card,
  Input,
  Select,
  Button,
  Space,
  message,
  Row,
  Col,
  Spin,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  BookOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';

import { bookService } from '../../bookService';
import './AdminBooks.css';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [additionalDetails, setAdditionalDetails] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [searchField, setSearchField] = useState('title');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [booksRes, detailsRes] = await Promise.all([
        bookService.getAllBooks(),
        bookService.getbook_additional_details(),
      ]);

      const booksData = booksRes.results || booksRes;
      const detailsData = detailsRes.results || detailsRes;

      setAdditionalDetails(detailsData);

      // 🔥 Merge books with additional details
      const mergedBooks = booksData.map((book) => {
        const detail = detailsData.find(
          (d) => d.book === book.id
        );

        return {
          ...book,
          no_of_available_book: detail?.no_of_available_book || 0,
          no_of_issued_book: detail?.no_of_issued_book || 0,
          no_of_reserved_book: detail?.no_of_reserved_book || 0,
        };
      });

      setBooks(mergedBooks);
      setFilteredBooks(mergedBooks);
    } catch (error) {
      message.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await bookService.getCategories();
      setCategories(response.results || response);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (value) => {
    setSearchValue(value);
    filterBooks(value, searchField, selectedCategory);
  };

  const handleSearchFieldChange = (field) => {
    setSearchField(field);
    filterBooks(searchValue, field, selectedCategory);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    filterBooks(searchValue, searchField, category);
  };

  const filterBooks = (search, field, category) => {
    let filtered = books;

    if (search) {
      filtered = filtered.filter((book) => {
        const fieldValue = book[field]?.toString().toLowerCase() || '';
        return fieldValue.includes(search.toLowerCase());
      });
    }

    if (category) {
      filtered = filtered.filter((book) => book.category === category);
    }

    setFilteredBooks(filtered);
  };

  const handleDelete = async (id) => {
    try {
      await bookService.deleteBook(id);
      message.success('Book deleted successfully!');
      fetchAllData();
    } catch (error) {
      message.error('Failed to delete book');
    }
  };

  // ✅ Stats calculated from merged data
  const stats = {
    totalBooks: books.length,
    totalAvailable: books.reduce(
      (sum, book) => sum + book.no_of_available_book,
      0
    ),
    totalIssued: books.reduce(
      (sum, book) => sum + book.no_of_issued_book,
      0
    ),
    totalReserved: books.reduce(
      (sum, book) => sum + book.no_of_reserved_book,
      0
    ),
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'ISBN',
      dataIndex: 'isbn',
      key: 'isbn',
      width: 120,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: 'Total',
      dataIndex: 'number_of_copies',
      key: 'total',
      width: 80,
    },
    {
      title: 'Available',
      dataIndex: 'no_of_available_book',
      key: 'available',
      width: 100,
    },
    {
      title: 'Issued',
      dataIndex: 'no_of_issued_book',
      key: 'issued',
      width: 80,
    },
    {
      title: 'Reserved',
      dataIndex: 'no_of_reserved_book',
      key: 'reserved',
      width: 90,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/book/${record.id}`)}
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/edit-book/${record.id}`)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content className="admin-books-content">
        <div className="page-wrapper">
          <h1 className="page-title">Admin - Book Management</h1>

          {/* Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Books"
                  value={stats.totalBooks}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Available"
                  value={stats.totalAvailable}
                  prefix={<UnlockOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Issued"
                  value={stats.totalIssued}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Reserved"
                  value={stats.totalReserved}
                  prefix={<LockOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {loading ? (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Card style={{ marginTop: 20 }}>
              <Table
                columns={columns}
                dataSource={filteredBooks}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default AdminBooks;
