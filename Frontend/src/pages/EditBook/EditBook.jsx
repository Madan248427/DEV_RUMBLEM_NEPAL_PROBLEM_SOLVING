'use client';

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Form,
  Input,
  Button,
  Upload,
  Select,
  message,
  Card,
  Row,
  Col,
  Spin,
} from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

import { bookService } from '../../bookService';
import './EditBook.css';

const { Content } = Layout;

const EditBook = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [book, setBook] = useState(null);

  useEffect(() => {
    fetchBook();
    fetchCategories();
  }, [id]);

  const fetchBook = async () => {
    try {
      setFetching(true);
      const response = await bookService.getBookById(id);
      setBook(response);

      form.setFieldsValue({
        title: response.title,
        authors: response.authors,
        isbn: response.isbn,
        publisher: response.publisher,
        year_of_publication: response.year_of_publication,
        edition: response.edition,
        language: response.language,
        category: response.category,
        number_of_copies: response.number_of_copies,
        description: response.description,
        shelf_location: response.shelf_location,
      });

      if (response.cover_image_url) {
        setFileList([
          {
            uid: '-1',
            name: 'cover_image',
            status: 'done',
            url: response.cover_image_url,
          },
        ]);
      }
    } catch (error) {
      message.error('Failed to load book details');
      navigate('/books');
    } finally {
      setFetching(false);
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

  const validationSchema = Yup.object({
    title: Yup.string().required('Book title is required'),
    authors: Yup.string().required('Author is required'),
    number_of_copies: Yup.number().required('Number of copies is required'),
  });

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await validationSchema.validate(values);

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('authors', values.authors);
      formData.append('isbn', values.isbn || '');
      formData.append('publisher', values.publisher || '');
      formData.append('year_of_publication', values.year_of_publication || '');
      formData.append('edition', values.edition || '');
      formData.append('language', values.language || '');
      formData.append('category', values.category || '');
      formData.append('number_of_copies', values.number_of_copies);
      formData.append('description', values.description || '');
      formData.append('shelf_location', values.shelf_location || '');

      // Only add cover image if new file is selected
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('cover_image', fileList[0].originFileObj);
      }

      await bookService.updateBook(id, formData);
      message.success('Book updated successfully!');
      navigate('/books');
    } catch (error) {
      if (error.response?.data) {
        message.error(
          error.response.data.detail || 'Failed to update book'
        );
      } else {
        message.error(error.message || 'Failed to update book');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  if (fetching) {
    return (
      <Layout style={{ minHeight: '100vh' }}>

        <Content className="edit-book-content">
          <div className="page-wrapper">
            <div className="loading-spinner">
              <Spin size="large" />
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>


      <Content className="edit-book-content">
        <div className="page-wrapper">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/books')}
            className="back-button"
          >
            Back to Books
          </Button>

          <h1 className="page-title">Edit Book</h1>

          <Card className="edit-book-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Book Title"
                    name="title"
                    rules={[
                      {
                        required: true,
                        message: 'Please input book title!',
                      },
                    ]}
                  >
                    <Input placeholder="Enter book title" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Author(s)"
                    name="authors"
                    rules={[
                      {
                        required: true,
                        message: 'Please input author name!',
                      },
                    ]}
                  >
                    <Input placeholder="Enter author name" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="ISBN" name="isbn">
                    <Input placeholder="Enter ISBN" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Publisher" name="publisher">
                    <Input placeholder="Enter publisher name" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Year of Publication"
                    name="year_of_publication"
                  >
                    <Input
                      type="number"
                      placeholder="Enter year"
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Edition" name="edition">
                    <Input placeholder="Enter edition" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Language" name="language">
                    <Input placeholder="Enter language" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Category" name="category">
                    <Select placeholder="Select category">
                      {categories.map((cat) => (
                        <Select.Option key={cat.id} value={cat.name}>
                          {cat.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Number of Copies"
                    name="number_of_copies"
                    rules={[
                      {
                        required: true,
                        message: 'Please input number of copies!',
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      placeholder="Enter number of copies"
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Shelf Location" name="shelf_location">
                    <Input placeholder="Enter shelf location" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item label="Description" name="description">
                    <Input.TextArea
                      placeholder="Enter book description"
                      rows={4}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item label="Cover Image" name="cover_image">
                    <Upload
                      fileList={fileList}
                      onChange={handleUpload}
                      beforeUpload={() => false}
                      maxCount={1}
                      accept="image/*"
                    >
                      <Button icon={<UploadOutlined />}>
                        Click to Upload Cover Image
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      style={{ marginRight: '8px' }}
                    >
                      {loading ? 'Updating Book...' : 'Update Book'}
                    </Button>
                    <Button
                      size="large"
                      onClick={() => navigate('/books')}
                    >
                      Cancel
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default EditBook;
