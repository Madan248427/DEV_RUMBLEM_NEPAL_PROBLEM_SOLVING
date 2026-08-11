import React, { useEffect, useState, useMemo, useRef } from "react"
import { Spin, Tabs, Empty, Tag, Avatar } from "antd"
import fetchApi from "../../axiosInstance"
import { useAuth } from "../../context/AuthContext"
import "./IssuedBooks.css"

const { TabPane } = Tabs

const IssuedBooks = () => {
  const { user, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    if (hasFetched.current) return
    hasFetched.current = true

    const fetchTransactions = async () => {
      try {
        const res = await fetchApi.get("/transactions/")
        setTransactions(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error("Transaction load failed", err)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user, authLoading])

  // 🔥 STATUS DERIVATION
  const now = new Date()
  const withStatus = useMemo(() => {
    return transactions.map((t) => {
      const expiresAt = t.expires_at ? new Date(t.expires_at) : null

      if (t.transaction_type === "reserved") {
        if (t.returned_at) return { ...t, status: "expired" }
        if (expiresAt && expiresAt < now) return { ...t, status: "expired" }
        return { ...t, status: "reserved" }
      }

      if (t.transaction_type === "issued") {
        if (t.returned_at) return { ...t, status: "returned" }
        return { ...t, status: "issued" }
      }

      return { ...t, status: t.transaction_type }
    })
  }, [transactions])

  const issuedBooks = withStatus.filter((t) => t.status === "issued")
  const reservedBooks = withStatus.filter((t) => t.status === "reserved")
  const returnedBooks = withStatus.filter(
    (t) => t.status === "returned" || t.status === "expired"
  )

  const renderList = (list, emptyText) => {
    if (list.length === 0) return <Empty description={emptyText} />

    return (
      <div className="issued-books-list">
        {list.map((item) => {
const imageUrl = item.book?.cover_image_url
  ? `http://127.0.0.1:8000${item.book.cover_image_url}`
  : null


          return (
            <div key={item.id} className="issued-book-card">
              {/* IMAGE OR AVATAR */}
              {imageUrl ? (
                <img
                  className="book-cover"
                  src={imageUrl}
                  alt={item.book?.title || "Book"}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.style.display = "none"
                  }}
                />
              ) : (
                <Avatar
                  size={100}
                  style={{ backgroundColor: "#87d068" }}
                  gap={4}
                >
                  {item.book?.title?.charAt(0)?.toUpperCase() || "B"}
                </Avatar>
              )}

              <div className="issued-book-content">
                <div className="issued-book-header">
                  <h4>{item.book?.title || "Unknown Book"}</h4>
                  <Tag
                    color={
                      item.status === "issued"
                        ? "blue"
                        : item.status === "reserved"
                        ? "orange"
                        : item.status === "expired"
                        ? "red"
                        : "green"
                    }
                  >
                    {item.status.toUpperCase()}
                  </Tag>
                </div>

                {item.expires_at && item.status === "reserved" && (
                  <p>
                    ⏳ Expires at:{" "}
                    {new Date(item.expires_at).toLocaleString()}
                  </p>
                )}

                {item.returned_at && (
                  <p>
                    ✅ Closed on:{" "}
                    {new Date(item.returned_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="center-loader">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="issued-books-page">
      <h2>My Books</h2>

      <Tabs defaultActiveKey="issued">
        <TabPane tab={`Issued (${issuedBooks.length})`} key="issued">
          {renderList(issuedBooks, "No issued books")}
        </TabPane>

        <TabPane tab={`Reserved (${reservedBooks.length})`} key="reserved">
          {renderList(reservedBooks, "No active reservations")}
        </TabPane>

        <TabPane
          tab={`Returned / Expired (${returnedBooks.length})`}
          key="returned"
        >
          {renderList(returnedBooks, "No returned or expired books")}
        </TabPane>
      </Tabs>
    </div>
  )
}

export default IssuedBooks
