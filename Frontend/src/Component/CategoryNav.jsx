import React, { useState, useEffect, useMemo, useRef } from "react";
import { AppstoreOutlined } from "@ant-design/icons";
import axiosInstance from "../axiosInstance";
import "./CategoryNav.css";

const CategoryNav = ({ selectedCategory, onSelectCategory }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navRef = useRef(null);

  // Fetch categories
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get("/categories/");
        if (!cancelled) {
          setCategories(
            Array.isArray(res.data) ? res.data : res.data?.results || []
          );
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // Add "All Books"
  const allCategories = useMemo(() => {
    return [
      { id: "all", name: "All Books" },
      ...categories.map((cat, index) => ({
        id: cat.id ?? `cat-${index}`,
        name: cat.name ?? `Category ${index}`,
        icon_url: cat.icon_url ?? null,
      })),
    ];
  }, [categories]);

  // Auto scroll active category into view
  useEffect(() => {
    const activeBtn = navRef.current?.querySelector(".category-chip.active");
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedCategory]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading categories...</div>;
  }

  return (
    <div className="category-wrapper">
      <div
        className="category-nav"
        ref={navRef}
        role="tablist"
        aria-label="Book categories"
      >
        {allCategories.map((cat) => {
          const isActive =
            cat.id === "all"
              ? !selectedCategory || selectedCategory === "all"
              : selectedCategory === cat.name;

          return (
            <button
              key={cat.id}
              className={`category-chip ${isActive ? "active" : ""}`}
              onClick={() =>
                onSelectCategory(cat.id === "all" ? null : cat.name)
              }
              role="tab"
              aria-selected={isActive}
              aria-label={cat.name}
            >
              {cat.icon_url ? (
                <img
                  className="category-chip-icon"
                  src={cat.icon_url}
                  alt={cat.name}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder.svg";
                  }}
                />
              ) : (
                <AppstoreOutlined />
              )}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryNav;