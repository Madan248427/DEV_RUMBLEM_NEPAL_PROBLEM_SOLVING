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
  Image,
  Row,
  Col,
  Spin,
  Tabs,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';

import { bookService } from '../../bookService';
import './BookList1.css';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;

const BookList1 = ({ onLogout }) => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [searchField, setSearchField] = useState('title');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await bookService.getAllBooks();
      setBooks(response.results || response);
      setFilteredBooks(response.results || response);
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
      fetchBooks();
    } catch (error) {
      message.error('Failed to delete book');
    }
  };

  const columns = [
    {
      title: 'Cover',
      dataIndex: 'cover_image',
      key: 'cover',
      width: 80,
      render: (text) => (
        text ? (
          <Image
            src={text || "/placeholder.svg"}
            alt="cover"
            width={50}
            height={70}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="no-image">No Image</div>
        )
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'ISBN',
      dataIndex: 'isbn',
      key: 'isbn',
      width: 120,
    },
    {
      title: 'Author',
      dataIndex: 'authors',
      key: 'authors',
      width: 150,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: 'Copies',
      dataIndex: 'number_of_copies',
      key: 'copies',
      width: 80,
      sorter: (a, b) => a.number_of_copies - b.number_of_copies,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = {
          available: '#52c41a',
          issued: '#faad14',
          reserved: '#1890ff',
          lost: '#f5222d',
        };
        return (
          <span style={{ color: colors[status] || '#666' }}>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
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


      <Content className="booklist-content">
        <div className="page-wrapper">
          <h1 className="page-title">Book Library</h1>

          <Card className="filter-card">
            <Row gutter={[16, 16]} className="filter-row">
              <Col xs={24} sm={12} lg={6}>
                <Input
                  placeholder="Search books..."
                  prefix={<SearchOutlined />}
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  size="large"
                />
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Select
                  placeholder="Search by..."
                  value={searchField}
                  onChange={handleSearchFieldChange}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Select.Option value="title">Title</Select.Option>
                  <Select.Option value="isbn">ISBN</Select.Option>
                  <Select.Option value="category">Category</Select.Option>
                  <Select.Option value="authors">Author</Select.Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Select
                  placeholder="Filter by category"
                  value={selectedCategory}
                  onChange={handleCategoryFilter}
                  allowClear
                  style={{ width: '100%' }}
                  size="large"
                >
                  {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.name}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={fetchBooks}
                >
                  Refresh
                </Button>
              </Col>
            </Row>
          </Card>

          {loading ? (
            <div className="loading-spinner">
              <Spin size="large" />
            </div>
          ) : (
            <Card className="books-table-card" style={{ marginTop: '16px' }}>
              <div className="table-result-info">
                Found {filteredBooks.length} book(s)
              </div>
              <Table
                columns={columns}
                dataSource={filteredBooks}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
                className="books-table"
              />
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default BookList1;
