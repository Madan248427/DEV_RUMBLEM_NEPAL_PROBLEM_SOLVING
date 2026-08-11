import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, message, Avatar, Spin } from "antd";
import fetchApi from "../../axiosInstance";
import { useAuth } from "../../context/AuthContext";
import "./BookDetail.css";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [authorDetails, setAuthorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [canReserve, setCanReserve] = useState(false);

  const hasFetched = useRef(false);

  /* =========================
     Fetch data
     ========================= */
  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        const bookRes = await fetchApi.get(`/books/${id}/`);
        const bookData = bookRes.data;
        setBook(bookData);

        const available =
          bookData.additional_details?.no_of_available_book || 0;

        const txRes = await fetchApi.get("/transactions/");
        const transactions = Array.isArray(txRes.data) ? txRes.data : [];
        const now = new Date();

        const activeReservation = transactions.find((t) => {
          const expiresAt = t.expires_at ? new Date(t.expires_at) : null;
          return (
            t.book.id === bookData.id &&
            t.transaction_type === "reserved" &&
            !t.returned_at &&
            (!expiresAt || expiresAt > now)
          );
        });

        if (activeReservation) {
          setIsReserved(true);
          setCanReserve(false);
        } else {
          setCanReserve(available > 0);
        }

        if (bookData.authors) {
          const authorRes = await fetchApi.get(
            `/authors/?search=${bookData.authors}`
          );
          const authors = Array.isArray(authorRes.data)
            ? authorRes.data
            : [];
          setAuthorDetails(
            authors.find((a) => a.name === bookData.authors) || null
          );
        }
      } catch (err) {
        message.error("Failed to load book details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  /* =========================
     Reserve book
     ========================= */
  const handleReserve = useCallback(async () => {
    if (!user || !book) return;

    setReserving(true);
    try {
      await fetchApi.post("/transactions/", {
        book_input: book.id,
        transaction_type: "reserved",
      });

      message.success("Book reserved successfully");
      setIsReserved(true);
      setCanReserve(false);
    } catch (err) {
      message.error(err.response?.data?.detail || "Reservation failed");
    } finally {
      setReserving(false);
    }
  }, [user, book]);

  /* =========================
     Availability
     ========================= */
  const availability = useMemo(() => {
    if (!book?.additional_details) return null;
    return [
      { label: "Total", value: book.number_of_copies },
      {
        label: "Available",
        value: book.additional_details.no_of_available_book,
      },
      {
        label: "Issued",
        value: book.additional_details.no_of_issued_book,
      },
      {
        label: "Reserved",
        value: book.additional_details.no_of_reserved_book,
      },
    ];
  }, [book]);

  if (loading) {
    return (
      <div className="center-loader">
        <Spin size="large" />
      </div>
    );
  }

  if (!book) return <div>Book not found</div>;

  return (
    <div className="bookdetail-page">
      <button className="bookdetail-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="bookdetail-content">
        {/* LEFT: Cover & Action */}
        <div className="bookdetail-cover-section">
          {book.cover_image_url ? (
            <img
              src={`http://127.0.0.1:8000${book.cover_image_url}`}
              alt={book.title}
              className="bookdetail-cover"
            />
          ) : (
            <div className="bookdetail-cover-placeholder">
              {book.title?.charAt(0)}
            </div>
          )}

          <Button
            type="primary"
            block
            loading={reserving}
            disabled={!canReserve || isReserved}
            onClick={handleReserve}
          >
            {isReserved ? "Already Reserved" : "Reserve Book"}
          </Button>
        </div>

        {/* RIGHT: Info */}
        <div className="bookdetail-info">
          <h1>{book.title}</h1>

          <div className="bookdetail-meta">
            <Meta label="Author" value={book.authors} />
            <Meta label="ISBN" value={book.isbn} />
            <Meta label="Publisher" value={book.publisher} />
            <Meta label="Year" value={book.year_of_publication} />
            <Meta label="Edition" value={book.edition} />
            <Meta label="Language" value={book.language} />
            <Meta label="Shelf" value={book.shelf_location} />
            <Meta label="Category" value={book.category} />
          </div>

          <section className="bookdetail-description">
            <h3>Description</h3>
            <p>{book.description || "No description available."}</p>
          </section>

          {authorDetails && (
            <section className="bookdetail-author">
              <h3>Author Details</h3>
              <div className="author-info">
                {authorDetails.image ? (
                  <img
                    src={authorDetails.image}
                    alt={authorDetails.name}
                    className="author-image"
                  />
                ) : (
                  <Avatar size={96}>
                    {authorDetails.name?.charAt(0)}
                  </Avatar>
                )}
                <div className="author-text">
                  <strong>{authorDetails.name}</strong>
                  <p>{authorDetails.bio || "No bio available."}</p>
                </div>
              </div>
            </section>
          )}

          {availability && (
            <section className="bookdetail-availability">
              <h3>Availability</h3>
              <div className="availability-grid">
                {availability.map((item) => (
                  <div key={item.label} className="availability-item">
                    <h4>{item.value}</h4>
                    <p>{item.label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

/* Small reusable meta component */
const Meta = ({ label, value }) => (
  <div className="bookdetail-meta-item">
    <span className="bookdetail-meta-label">{label}</span>
    <span className="bookdetail-meta-value">{value || "—"}</span>
  </div>
);

export default BookDetail;
