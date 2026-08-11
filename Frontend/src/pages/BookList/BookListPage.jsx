import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Spin, Input, Select } from "antd";
import { BookOutlined, SearchOutlined } from "@ant-design/icons";
import axiosInstance from "../../axiosInstance";
import CategoryNav from "../../Component/CategoryNav";
import "./BookList.css";

const statusColors = {
  available: "green",
  issued: "blue",
  reserved: "orange",
  lost: "red",
};

const BookListPage = () => {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [loading, setLoading] = useState(true);

  const booksCache = useRef(null);       // 🔹 cache books
  const categoriesCache = useRef(null);  // 🔹 cache categories

  // Fetch books and categories from API with cache
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        // Use cached books if available
        if (booksCache.current) {
          setBooks(booksCache.current);
        } else {
          const booksRes = await axiosInstance.get("/books/");
          if (!cancelled) {
            booksCache.current = Array.isArray(booksRes.data)
              ? booksRes.data
              : booksRes.data?.results || [];
            setBooks(booksCache.current);
          }
        }

        // Use cached categories if available
        if (categoriesCache.current) {
          setCategories(categoriesCache.current);
        } else {
          const categoriesRes = await axiosInstance.get("/categories/");
          if (!cancelled) {
            categoriesCache.current = Array.isArray(categoriesRes.data)
              ? categoriesRes.data
              : categoriesRes.data?.results || [];
            setCategories(categoriesCache.current);
          }
        }
      } catch (err) {
        console.error("Error fetching books or categories:", err);
        if (!cancelled) {
          setBooks([]);
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, []);

  // Filtered and sorted books (memoized)
  const filteredBooks = useMemo(() => {
    if (!books || books.length === 0) return [];

    let result = [...books];

    if (selectedCategory) {
      result = result.filter(
        (b) => b.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          (b.title && b.title.toLowerCase().includes(query)) ||
          (b.authors && b.authors.toLowerCase().includes(query)) ||
          (b.isbn && b.isbn.toLowerCase().includes(query))
      );
    }

    result.sort((a, b) => {
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "year") return (b.year_of_publication || 0) - (a.year_of_publication || 0);
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      return 0;
    });

    return result;
  }, [books, selectedCategory, searchTerm, sortBy]);

  const handleSelectCategory = useCallback((cat) => {
    setSelectedCategory(cat);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="booklist-page">
      {/* Category navigation */}
      <CategoryNav
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Toolbar */}
      <div className="booklist-toolbar">
        <div className="booklist-toolbar-left">
          <Input
            prefix={<SearchOutlined style={{ color: "#8a94a6" }} />}
            placeholder="Search by title, author, ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 280, borderRadius: 10 }}
            allowClear
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 140 }}
            options={[
              { value: "title", label: "Sort by Title" },
              { value: "year", label: "Sort by Year" },
              { value: "status", label: "Sort by Status" },
            ]}
          />
        </div>
        <span className="booklist-count">
          {filteredBooks.length} book{filteredBooks.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Book grid */}
      {filteredBooks.length === 0 ? (
        <div className="booklist-empty">
          <BookOutlined style={{ fontSize: 48, color: "#8a94a6" }} />
          <h3>No books found</h3>
          <p>Try adjusting your search or category filter</p>
        </div>
      ) : (
        <div className="booklist-grid">
          {filteredBooks.map((book) => {
            const coverUrl = book.cover_image_url || book.cover_image;
            const finalCoverUrl = coverUrl
              ? coverUrl.startsWith("http")
                ? coverUrl
                : `http://127.0.0.1:8000${coverUrl}`
              : null;

            return (
              <div
                key={book.id}
                className="book-card"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                {finalCoverUrl ? (
                  <img
                    className="book-card-cover"
                    src={finalCoverUrl}
                    alt={book.title}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="book-card-cover-placeholder">
                    <BookOutlined style={{ fontSize: 48, color: "#8a94a6" }} />
                  </div>
                )}
                <div className="book-card-body">
                  <h3 className="book-card-title">{book.title}</h3>
                  <p className="book-card-author">{book.authors}</p>
                  <div className="book-card-footer">
                    {book.category && (
                      <span className="book-card-category">{book.category}</span>
                    )}
                    <Tag color={statusColors[book.status] || "default"} style={{ margin: 0 }}>
                      {book.status}
                    </Tag>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookListPage;
