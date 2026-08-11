'use client'; // Only if using Next.js or client-side rendering

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Form,
  Button,
  Select,
  message,
  Card,
  Row,
  Col,
  Table,
  Spin,
  Modal,
  DatePicker,
  Input,
  Tabs,
} from 'antd';
import { SwapOutlined, EditOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import { bookService, transactionService, userService } from '../../bookService';
import './Transaction.css';

const { Content } = Layout;

const Transaction = ({ onLogout }) => {
  const location = useLocation();
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [bookSearch, setBookSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // FILTER STATES
  const [filterBook, setFilterBook] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterISBN, setFilterISBN] = useState('');
  const [filterType, setFilterType] = useState('');

  /* ------------------------------ FETCH ------------------------------ */
  useEffect(() => {
    Promise.all([fetchBooks(), fetchUsers(), fetchTransactions()]).finally(() =>
      setFetching(false)
    );

    if (location.state?.selectedBookId) {
      form.setFieldsValue({
        book_input: location.state.selectedBookId,
      });
    }
  }, []);

  const fetchBooks = async () => {
    const res = await bookService.getAllBooks();
    setBooks(res.results || res);
  };

  const fetchUsers = async () => {
    const res = await userService.getAllUsers();
    setUsers(res.results || res);
  };

  const fetchTransactions = async () => {
    const res = await transactionService.getAllTransactions();
    setTransactions(res.results || res);
  };

  /* ---------------------------- VALIDATION ---------------------------- */
  const validationSchema = Yup.object({
    book_input: Yup.number().required(),
    user: Yup.number().required(),
    transaction_type: Yup.string().required(),
  });

  /* ------------------------------ SUBMIT ------------------------------ */
  const onFinish = async (values) => {
    try {
      setLoading(true);
      await validationSchema.validate(values);

      const payload = {
        book_input: values.book_input,
        user_id: values.user || null,
        transaction_type: values.transaction_type,
        due_at: values.due_at ? values.due_at.format('YYYY-MM-DD') : null,
      };

      await transactionService.createTransaction(payload);

      message.success('Transaction created successfully!');
      form.resetFields();
      fetchTransactions();
    } catch (error) {
      message.error(
        error.response?.data?.detail || error.message || 'Failed to create transaction'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ EDIT ------------------------------ */
  const handleEditTransaction = (record) => {
    setEditingId(record.id);
    updateForm.setFieldsValue({
      transaction_type: record.transaction_type,
      due_at: record.due_at ? dayjs(record.due_at) : null,
    });
    setIsModalVisible(true);
  };

  const handleUpdateTransaction = async (values) => {
    try {
      setUpdateLoading(true);

      const payload = {
        transaction_type: values.transaction_type,
        due_at: values.due_at ? values.due_at.format('YYYY-MM-DD') : null,
      };

      await transactionService.updateTransaction(editingId, payload);

      message.success('Transaction updated successfully!');
      setIsModalVisible(false);
      updateForm.resetFields();
      setEditingId(null);
      fetchTransactions();
    } catch (error) {
      message.error(
        error.response?.data?.detail || error.message || 'Failed to update transaction'
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  /* ------------------------------ TABLE ------------------------------ */
  const showDate = (date) => (date ? dayjs(date).format('DD-MMM-YYYY') : '---');

  // FILTERED TRANSACTIONS
  const filteredTransactions = transactions.filter((t) => {
    const matchesBook = t.book?.title?.toLowerCase().includes(filterBook.toLowerCase());
    const matchesUser = t.user?.username?.toLowerCase().includes(filterUser.toLowerCase());
    const matchesISBN = t.book?.isbn?.toLowerCase().includes(filterISBN.toLowerCase());
    const matchesType = filterType ? t.transaction_type === filterType : true;
    return matchesBook && matchesUser && matchesISBN && matchesType;
  });

  const transactionColumns = [
    { title: 'Book', dataIndex: ['book', 'title'] },
    { title: 'ISBN', dataIndex: ['book', 'isbn'] },
    {
      title: 'User',
      render: (_, r) => (r.user ? `${r.user.username} (${r.user.email})` : '---'),
    },
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      render: (t) => t?.toUpperCase(),
    },
    { title: 'Issued At', dataIndex: 'issued_at', render: showDate },
    { title: 'Due At', dataIndex: 'due_at', render: showDate },
    { title: 'Expires At', dataIndex: 'expires_at', render: showDate },
    { title: 'Returned At', dataIndex: 'returned_at', render: showDate },
    {
      title: 'Extra Payment',
      dataIndex: 'extra_payment',
      render: (v) => (v !== null ? v : '---'),
    },
    { title: 'Created At', dataIndex: 'created_at', render: showDate },
    {
      title: 'Actions',
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditTransaction(r)}
        >
          Update
        </Button>
      ),
    },
  ];

  /* ------------------------------ RENDER ------------------------------ */
  return (
    <Layout style={{ minHeight: '100vh' }}>
     

      <Modal
        title="Update Transaction"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          updateForm.resetFields();
          setEditingId(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              updateForm.resetFields();
              setEditingId(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={updateLoading}
            onClick={() => updateForm.submit()}
          >
            Update
          </Button>,
        ]}
      >
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateTransaction}>
          <Form.Item
            label="Transaction Type"
            name="transaction_type"
            rules={[{ required: true, message: 'Please select transaction type!' }]}
          >
            <Select placeholder="Select transaction type">
              <Select.Option value="issued">Issued</Select.Option>
              <Select.Option value="reserved">Reserved</Select.Option>
              <Select.Option value="returned">Returned</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Due Date (Optional)" name="due_at">
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Select due date"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Content className="transaction-content">
        {fetching ? (
          <Spin size="large" />
        ) : (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: 'Create Transaction',
                children: (
                  <Card>
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item label="Book" name="book_input" rules={[{ required: true }]}>
                            <Select showSearch onSearch={setBookSearch} filterOption={false}>
                              {books
                                .filter(
                                  (b) =>
                                    b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
                                    b.isbn.toLowerCase().includes(bookSearch.toLowerCase())
                                )
                                .map((b) => (
                                  <Select.Option key={b.id} value={b.id}>
                                    {b.title} ({b.isbn})
                                  </Select.Option>
                                ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col span={8}>
                          <Form.Item label="User" name="user" rules={[{ required: true }]}>
                            <Select showSearch onSearch={setUserSearch} filterOption={false}>
                              {users
                                .filter(
                                  (u) =>
                                    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                                    u.email.toLowerCase().includes(userSearch.toLowerCase())
                                )
                                .map((u) => (
                                  <Select.Option key={u.id} value={u.id}>
                                    {u.username} ({u.email})
                                  </Select.Option>
                                ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col span={8}>
                          <Form.Item
                            label="Transaction Type"
                            name="transaction_type"
                            rules={[{ required: true }]}
                          >
                            <Select>
                              <Select.Option value="issued">Issued</Select.Option>
                              <Select.Option value="reserved">Reserved</Select.Option>
                              <Select.Option value="returned">Returned</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col span={8}>
                          <Form.Item label="Due Date" name="due_at">
                            <DatePicker style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>

                        <Col span={24}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<SwapOutlined />}
                          >
                            Create Transaction
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card>
                ),
              },
              {
                key: '2',
                label: 'Transaction History',
                children: (
                  <Card>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={6}>
                        <Input
                          placeholder="Search Book"
                          value={filterBook}
                          onChange={(e) => setFilterBook(e.target.value)}
                        />
                      </Col>
                      <Col span={6}>
                        <Input
                          placeholder="Search User"
                          value={filterUser}
                          onChange={(e) => setFilterUser(e.target.value)}
                        />
                      </Col>
                      <Col span={6}>
                        <Input
                          placeholder="Search ISBN"
                          value={filterISBN}
                          onChange={(e) => setFilterISBN(e.target.value)}
                        />
                      </Col>
                      <Col span={6}>
                        <Select
                          placeholder="Filter Type"
                          value={filterType || undefined}
                          onChange={(v) => setFilterType(v)}
                          allowClear
                        >
                          <Select.Option value="issued">Issued</Select.Option>
                          <Select.Option value="reserved">Reserved</Select.Option>
                          <Select.Option value="returned">Returned</Select.Option>
                        </Select>
                      </Col>
                    </Row>

                    <Table
                      rowKey="id"
                      columns={transactionColumns}
                      dataSource={filteredTransactions}
                      pagination={{ pageSize: 10 }}
                    />
                  </Card>
                ),
              },
            ]}
          />
        )}
      </Content>
    </Layout>
  );
};

export default Transaction;
