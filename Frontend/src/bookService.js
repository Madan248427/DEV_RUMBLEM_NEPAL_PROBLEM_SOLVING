import apiClient from "./axiosInstance.js";

/* =======================
   API ENDPOINTS
======================= */
const BOOKS_ENDPOINT = "/books/";
const TRANSACTIONS_ENDPOINT = "/transactions/";
const CATEGORIES_ENDPOINT = "/categories/";
const book_additional_details = "/book-additional-details/";

const USERS_ENDPOINT = "/accounts/users/";

/* =======================
   BOOK SERVICE
======================= */
export const bookService = {
  getAllBooks: async (params = {}) => {
    const response = await apiClient.get(BOOKS_ENDPOINT, { params });
    return response.data;
  },
  getbook_additional_details: async (params = {}) => {
    const response = await apiClient.get(book_additional_details, { params });
    return response.data;
  },


  getBookById: async (id) => {
    const response = await apiClient.get(`${BOOKS_ENDPOINT}${id}/`);
    return response.data;
  },

  createBook: async (formData) => {
    const response = await apiClient.post(BOOKS_ENDPOINT, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateBook: async (id, formData) => {
    const response = await apiClient.put(`${BOOKS_ENDPOINT}${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteBook: async (id) => {
    await apiClient.delete(`${BOOKS_ENDPOINT}${id}/`);
    return true;
  },

  getCategories: async () => {
    const response = await apiClient.get(CATEGORIES_ENDPOINT);
    return response.data;
  },

  searchBooks: async (query, field) => {
    const response = await apiClient.get(BOOKS_ENDPOINT, {
      params: { search: query, field },
    });
    return response.data;
  },
};

/* =======================
   TRANSACTION SERVICE
======================= */
export const transactionService = {
  getAllTransactions: async (params = {}) => {
    const response = await apiClient.get(TRANSACTIONS_ENDPOINT, { params });
    return response.data;
  },

  getTransactionById: async (id) => {
    const response = await apiClient.get(`${TRANSACTIONS_ENDPOINT}${id}/`);
    return response.data;
  },

  createTransaction: async (transactionData) => {
    const response = await apiClient.post(
      TRANSACTIONS_ENDPOINT,
      transactionData
    );
    return response.data;
  },

  // ✅ Use PATCH instead of PUT for partial updates
  updateTransaction: async (id, transactionData) => {
    const response = await apiClient.patch(
      `${TRANSACTIONS_ENDPOINT}${id}/`,
      transactionData
    );
    return response.data;
  },
};

/* =======================
   USER SERVICE ✅
======================= */
export const userService = {
  getAllUsers: async (params = {}) => {
    const response = await apiClient.get(USERS_ENDPOINT, { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`${USERS_ENDPOINT}${id}/`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post(USERS_ENDPOINT, userData);
    return response.data;
  },

  // ✅ Use PATCH instead of PUT for partial updates
  updateUser: async (id, userData) => {
    const response = await apiClient.patch(`${USERS_ENDPOINT}${id}/`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    await apiClient.delete(`${USERS_ENDPOINT}${id}/`);
    return true;
  },
};
