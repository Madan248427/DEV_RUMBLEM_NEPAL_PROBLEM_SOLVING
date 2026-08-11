"use client"

import React, { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Form, Input, Button, Checkbox, message } from "antd"
import {
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  BookOutlined,
} from "@ant-design/icons"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./Login.css"

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(4, "Password must be at least 4 characters")
        .required("Password is required"),
    }),

    onSubmit: async (values) => {
      setLoading(true)

      try {
        const result = await login(values.email, values.password)

        if (!result.success) {
          message.error(result.error)
          setLoading(false)
          return
        }

        const loggedInUser = result.user

        if (!loggedInUser) {
          message.error("Failed to fetch user data")
          setLoading(false)
          return
        }

        message.success("Login successful!")

        const role = (loggedInUser.role || loggedInUser.Role || "user")
          .toString()
          .toLowerCase()

        if (role === "admin") {
          navigate("/dashboard", { replace: true })
        } else if (role === "employee") {
          navigate("/dashboard", { replace: true })
        } else if (role === "user") {
          navigate("/user-dashboard", { replace: true })
        } else {
          navigate("/", { replace: true })
        }
      } catch (err) {
        console.error(err)
        message.error("Invalid email or password")
      } finally {
        setLoading(false)
      }
    },
  })

  const getFieldStatus = (field) =>
    formik.touched[field] && formik.errors[field] ? "error" : undefined

  return (
    <div className="login-page">
      {/* LEFT PANEL - Form */}
      <div className="login-left">
        <div className="login-form-container">
          {/* Logo / Brand */}
          <div className="login-brand">
            <div className="login-logo">
              <BookOutlined />
            </div>
            <h2 className="login-brand-name">Marvel Nexus</h2>
          </div>

          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">
            Sign in to manage your library account
          </p>

          <Form
            layout="vertical"
            onFinish={formik.handleSubmit}
            className="login-form"
          >
            <Form.Item
              label={<span className="login-label">Email Address</span>}
              validateStatus={getFieldStatus("email")}
              help={formik.touched.email && formik.errors.email}
            >
              <Input
                name="email"
                placeholder="Enter your email"
                prefix={<MailOutlined className="login-input-icon" />}
                size="large"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="login-input"
              />
            </Form.Item>

            <Form.Item
              label={<span className="login-label">Password</span>}
              validateStatus={getFieldStatus("password")}
              help={formik.touched.password && formik.errors.password}
            >
              <Input.Password
                name="password"
                placeholder="Enter your password"
                prefix={<LockOutlined className="login-input-icon" />}
                size="large"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="login-input"
              />
            </Form.Item>

            <Form.Item>
              <div className="login-options">
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-checkbox"
                >
                  Remember me
                </Checkbox>

                <Link to="/forgot-password" className="login-forgot">
                  Forgot Password?
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                className="login-submit-btn"
              >
                Sign In
              </Button>
            </Form.Item>

            <div className="login-signup-link">
              <span>{"Don't have an account? "}</span>
              <Link to="/Signup" className="login-link">
                Sign Up
              </Link>
            </div>
          </Form>
        </div>
      </div>

      {/* RIGHT PANEL - Image */}
      <div className="login-right">
        <div className="login-image-overlay"></div>
        <img
          src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Library interior with warm lighting and bookshelves"
          className="login-hero-image"
        />
        <div className="login-image-content">
          <h2 className="login-image-title">
            Your Gateway to Knowledge
          </h2>
          <p className="login-image-text">
            Discover, borrow, and explore thousands of books in our curated
            collection.
          </p>
          <div className="login-image-stats">
            <div className="login-stat">
              <span className="login-stat-number">50K+</span>
              <span className="login-stat-label">Books</span>
            </div>
            <div className="login-stat-divider"></div>
            <div className="login-stat">
              <span className="login-stat-number">10K+</span>
              <span className="login-stat-label">Members</span>
            </div>
            <div className="login-stat-divider"></div>
            <div className="login-stat">
              <span className="login-stat-number">500+</span>
              <span className="login-stat-label">Authors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
