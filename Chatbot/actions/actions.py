"""
Rasa Custom Actions with Secure JWT Authentication

Security Features:
✅ JWT tokens obtained from authenticated backend endpoint
✅ Tokens sent in metadata (never stored)
✅ HTTP-Only cookies prevent XSS attacks
✅ Proper authorization headers for API calls
✅ Comprehensive error logging and handling
✅ 401 errors handled gracefully with user feedback
"""

import requests
import logging
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

# Configure logging
logger = logging.getLogger(__name__)

API_BASE_URL = "http://127.0.0.1:8000/api"


def get_api_headers(jwt_token=None):
    """Create headers for API requests with optional JWT authentication."""
    headers = {
        "Content-Type": "application/json",
    }
    if jwt_token:
        headers["Authorization"] = f"Bearer {jwt_token}"
        logger.info("[Rasa] Authorization header added with JWT token")
    else:
        logger.warning("[Rasa] No JWT token provided, request may be unauthorized")
    
    return headers


def extract_jwt_from_metadata(tracker):
    """
    Extract JWT token from message metadata sent by frontend.
    Frontend fetches JWT from backend /api/accounts/rasa-token/ endpoint
    and sends it in metadata.
    """
    try:
        metadata = tracker.latest_message.get("metadata", {})
        jwt_token = metadata.get("jwt_token")
        
        if jwt_token:
            logger.info("[Rasa] JWT token found in metadata ✓")
            return jwt_token
        else:
            logger.warning("[Rasa] No JWT token in metadata ✗")
            return None
    except Exception as e:
        logger.error(f"[Rasa] Error extracting JWT from metadata: {str(e)}")
        return None




class ActionSearchBook(Action):
    """Search for books in the catalog."""

    def name(self) -> Text:
        return "action_search_book"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        try:
            jwt_token = extract_jwt_from_metadata(tracker)
            headers = get_api_headers(jwt_token)
            book_title = tracker.get_slot("book_title") 
            author_name = tracker.get_slot("author_name")
            category = tracker.get_slot("category")
            if book_title:
                logger.info(f"[Rasa] Searching for book: {book_title}")
                response = requests.get(
                    f"{API_BASE_URL}/books/",
                    params={"title": book_title},
                    headers=headers,
                    timeout=10
                )

                if response.status_code == 200:
                    books = response.json()
                    if not books:
                        dispatcher.utter_message(text=f" Sorry sir , no books found with title '{book_title}'.we will try to get that soon")
                        return []

                    # Take up to 5 books
                    message = "📚 Here are the books I found:\n\n"
                    for book in books[:5]:
                        book_id = book.get("id")
                        author = book.get("authors", "Unknown")
                        description=book.get("description","no description")
                        # Fetch additional details
                        details_response = requests.get(
                            f"{API_BASE_URL}/book-additional-details/{book_id}/",
                            headers=headers,
                            timeout=10
                        )

                        if details_response.status_code == 200:
                            details = details_response.json()
                            title = details.get("book_title", "N/A")
                            image_url=details.get("cover_image",None)

                            available = details.get("no_of_available_book", 0)
                            issued = details.get("no_of_issued_book", 0)
                            reserved = details.get("no_of_reserved_book", 0)

                            if available > 0:
                                status = f"✅ Available ({available} copies)"
                            elif issued > 0:
                                status = "⚠️ we have this book but Currently issued"
                            elif reserved > 0:
                                status = "⚠️ we have thisbook but Currently reserved"
                            else:
                                status = "❌ Not available"

                            message += f"• {title} by {author} — {status}\n{description}"
                            
                            
                        else:
                            message += f"• Could not fetch details for book ID {book_id}\n"

                    dispatcher.utter_message(text=message)
                    if image_url and image_url != "N/A":
                        dispatcher.utter_message(image=image_url)

                elif response.status_code == 401:
                    dispatcher.utter_message(text="you have to login first to see all this details so, Please login again thankyou.")
                else:
                    dispatcher.utter_message(text=" Error searching for books. Please try again later.")

            elif author_name:
                logger.info(f"[Rasa] Searching books by author: {author_name}")
                response = requests.get(
                    f"{API_BASE_URL}/books/",
                    params={"author": author_name},
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    books = response.json()
                    if not books:
                        dispatcher.utter_message(text=f"❌ Sorry, no books found by author '{author_name}'.")
                        return []

                    message = f"📚 Books by {author_name}:\n"
                    for book in books[:5]:
                        title = book.get("title", "N/A")
                        author = book.get("authors", "Unknown")
                        message += f"• {title} by {author}\n"
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message(text="❌ Error searching for author books. Please try again.")

            elif category:
                logger.info(f"[Rasa] Searching books in category: {category}")
                response = requests.get(
                    f"{API_BASE_URL}/books/",
                    params={"category": category},
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    books = response.json()
                    if not books:
                        dispatcher.utter_message(text=f"❌ Sorry, no books found in category '{category}'.")
                        return []

                    message = f"📚 Books in category '{category}':\n"
                    for book in books[:5]:
                        title = book.get("title", "N/A")
                        author = book.get("authors", "Unknown")
                        message += f"• {title} by {author}\n"
                    dispatcher.utter_message(text=message)
                else:
                    dispatcher.utter_message(text="❌ Error searching for category books. Please try again.")

            else:
                dispatcher.utter_message(text="Please provide a book title, author name, or category to search.")

        except requests.exceptions.Timeout:
            dispatcher.utter_message(text="❌ Request timed out. Please try again.")
        except requests.exceptions.RequestException as req_error:
            dispatcher.utter_message(text=f"❌ Error connecting to server: {str(req_error)}")
        except Exception as e:
            logger.error(f"[Rasa] Unexpected error in ActionSearchBook: {str(e)}")
            dispatcher.utter_message(text="❌ An unexpected error occurred. Please try again.")

        return []



# class ActionIssueBook(Action):
#     """Issue a book to the user."""
    
#     def name(self) -> Text:
#         return "action_issue_book"

#     def run(
#         self,
#         dispatcher: CollectingDispatcher,
#         tracker: Tracker,
#         domain: Dict[Text, Any],
#     ) -> List[Dict[Text, Any]]:

#         try:
#             # Extract JWT token from metadata
#             jwt_token = extract_jwt_from_metadata(tracker)
#             headers = get_api_headers(jwt_token)

#             book_id = tracker.get_slot("book_id")
#             logger.info(f"[Rasa] Issuing book_id: {book_id}")

#             if not book_id:
#                 dispatcher.utter_message(text="Please provide the book ID.")
#                 return []

#             # Make API request
#             try:
#                 response = requests.post(
#                     f"{API_BASE_URL}/transactions/",
#                     json={"book": book_id},
#                     headers=headers,
#                     timeout=10
#                 )

#                 logger.info(f"[Rasa] API Response Status: {response.status_code}")

#                 if response.status_code == 201:
#                     dispatcher.utter_message(text="📘 Book issued successfully!")

#                 elif response.status_code == 400:
#                     data = response.json()
#                     error_msg = data.get('detail', 'Cannot issue this book.')
#                     dispatcher.utter_message(text=f"⚠️ {error_msg}")

#                 elif response.status_code == 401:
#                     logger.error("[Rasa] 401 Unauthorized")
#                     dispatcher.utter_message(
#                         text=" you have to login first to see all this details so, Please login again thankyou."
#                     )

#                 else:
#                     logger.error(f"[Rasa] API Error {response.status_code}")
#                     dispatcher.utter_message(text="❌ Failed to issue book. Please try again.")

#             except requests.exceptions.Timeout:
#                 logger.error("[Rasa] Request timeout")
#                 dispatcher.utter_message(text="❌ Request timed out. Please try again.")
#             except requests.exceptions.RequestException as req_error:
#                 logger.error(f"[Rasa] Request error: {str(req_error)}")
#                 dispatcher.utter_message(text="❌ Error connecting to server. Please try again.")

#         except Exception as e:
#             logger.error(f"[Rasa] Unexpected error in ActionIssueBook: {str(e)}")
#             dispatcher.utter_message(text="❌ An unexpected error occurred. Please try again.")

#         return []
    
class ActionViewHistory(Action):
    """Fetch the user's book transaction history."""

    def name(self) -> Text:
        return "action_view_history"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        try:
            # Get JWT token and prepare headers
            jwt_token = extract_jwt_from_metadata(tracker)
            headers = get_api_headers(jwt_token)

            if not jwt_token:
                dispatcher.utter_message(text="you have to login first to see all this details so, Please login again thankyou..")
                return []

            logger.info("[Rasa] Fetching user transaction history")

            # API request to fetch transactions
            response = requests.get(
                f"{API_BASE_URL}/transactions/",
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                transactions = response.json()

                if not transactions:
                    dispatcher.utter_message(text="📚 You have no transaction history yet.")
                    return []

                message = "📚 Here is your recent book activity:\n\n"
                for tx in transactions[:10]:  # Limit to last 10 transactions
                    book_title = tx.get("book", {}).get("title", "N/A")
                    tx_type = tx.get("transaction_type", "N/A").capitalize()
                    issued_at = tx.get("issued_at", "N/A").split("T")[0]  # Only date
                    due_at = tx.get("due_at", "N/A").split("T")[0] if tx.get("due_at") else "N/A"
                    returned_at = tx.get("returned_at", None)
                    status = f"Returned on {returned_at.split('T')[0]}" if returned_at else "Not returned yet"

                    message += f"• '{book_title}' | {tx_type}\n  Issued: {issued_at} | Due: {due_at} | {status}\n\n"

                dispatcher.utter_message(text=message)

            elif response.status_code == 401:
                logger.error("[Rasa] 401 Unauthorized - Invalid JWT")
                dispatcher.utter_message(text="you have to login first to see all this details so, Please login again thankyou.")

            else:
                logger.error(f"[Rasa] API Error {response.status_code}: {response.text}")
                dispatcher.utter_message(text="Error fetching transaction history. Please try again later.")

        except requests.exceptions.Timeout:
            dispatcher.utter_message(text=" Request timed out. Please try again.")
        except requests.exceptions.RequestException as req_error:
            logger.error(f"[Rasa] Request error: {str(req_error)}")
            dispatcher.utter_message(text=f" Error connecting to server: {str(req_error)}")
        except Exception as e:
            logger.error(f"[Rasa] Unexpected error in ActionViewHistory: {str(e)}")
            dispatcher.utter_message(text="An unexpected error occurred. Please try again.")

        return []    

class ActionRecommendation(Action):
    """Fetch recommended books for the logged-in user."""

    def name(self) -> Text:
        return "action_recommendation"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        try:
            jwt_token = extract_jwt_from_metadata(tracker)
            headers = get_api_headers(jwt_token)

            if not jwt_token:
                dispatcher.utter_message(
                    text="You need to login first to see your recommendations."
                )
                return []

            logger.info("[Rasa] Fetching book recommendations")

            response = requests.get(
                f"{API_BASE_URL}/recomandation/",
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                books = response.json()

                if not books:
                    dispatcher.utter_message(
                        text="📚 No recommendations found at the moment."
                    )
                    return []

                message = "✨ Here are some books you might like:\n\n"

                for book in books[:5]:
                    title = book.get("title", "N/A")
                    author = book.get("authors", "Unknown")
                    category = book.get("category", "N/A")
                    status = book.get("status", "N/A")
                    image_url = book.get("cover_image_url", None)

                    message += f"• {title} by {author}\n"
                    message += f"  📂 Category: {category} | 📌 Status: {status}\n\n"

                    # Send image separately (if exists)
                    if image_url:
                        dispatcher.utter_message(image=image_url)

                dispatcher.utter_message(text=message)

            elif response.status_code == 401:
                dispatcher.utter_message(
                    text="Your session expired. Please login again."
                )

            else:
                logger.error(f"[Rasa] Recommendation API Error {response.status_code}")
                dispatcher.utter_message(
                    text="❌ Unable to fetch recommendations. Please try again later."
                )

        except requests.exceptions.Timeout:
            dispatcher.utter_message(
                text="❌ Request timed out. Please try again."
            )

        except requests.exceptions.RequestException as req_error:
            logger.error(f"[Rasa] Connection error: {str(req_error)}")
            dispatcher.utter_message(
                text=" Error connecting to server."
            )

        except Exception as e:
            logger.error(f"[Rasa] Unexpected error in ActionRecommendation: {str(e)}")
            dispatcher.utter_message(
                text="Something went wrong."
            )

        return []

class ActionReserveBook(Action):
    """Reserve a book for the logged-in user using book title."""

    def name(self) -> Text:
        return "action_reserve_book"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        try:
            # -------------------------------
            # Step 0: Get user and JWT
            # -------------------------------
            jwt_token = extract_jwt_from_metadata(tracker)
            headers = get_api_headers(jwt_token)

            if not jwt_token:
                dispatcher.utter_message(
                    text="You need to login first to reserve a book."
                )
                return []

            book_title = tracker.get_slot("book_title")  # use book title slot
            user_id = tracker.get_slot("user_id")  # make sure you have this slot

            if not book_title:
                dispatcher.utter_message(
                    text="Please provide the book title you want to reserve."
                )
                return []

            logger.info(f"[Rasa] Attempting to reserve book: {book_title}")

            # -------------------------------
            # Step 1: Check for existing active reservation
            # -------------------------------
            query_title = book_title.replace(" ", "%20")  # URL encode spaces
            url = f"{API_BASE_URL}/transactions/?title={query_title}&transaction_type=reserved"
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 200:
                transactions = response.json()
                # Filter for current user
                user_reserved = [
                    tx for tx in transactions if tx['user']['id'] == user_id
                ]
                if user_reserved:
                    dispatcher.utter_message(
                        text="⚠️ You already have an active reservation for this book."
                    )
                    return []
            else:
                logger.warning(f"[Rasa] Could not fetch reservations: {response.status_code}")

            # -------------------------------
            # Step 2: Create new reservation
            # -------------------------------
            # First, get the book ID from the title
            books_resp = requests.get(f"{API_BASE_URL}/books/?title={query_title}", headers=headers, timeout=10)
            if books_resp.status_code != 200 or not books_resp.json():
                dispatcher.utter_message(
                    text=f"❌ Could not find a book with title '{book_title}'."
                )
                return []

            book_id = books_resp.json()[0]['id']

            # Create reservation
            post_resp = requests.post(
                f"{API_BASE_URL}/transactions/",
                json={
                    "book_input": book_id,
                    "transaction_type": "reserved"
                },
                headers=headers,
                timeout=10
            )

            if post_resp.status_code == 201:
                dispatcher.utter_message(
                    text=f"📚 Book '{book_title}' reserved successfully!"
                )
            elif post_resp.status_code == 400:
                dispatcher.utter_message(
                    text=f"⚠️ Could not reserve book: {post_resp.json()}"
                )
            elif post_resp.status_code == 401:
                dispatcher.utter_message(
                    text="Your session expired. Please login again."
                )
            else:
                dispatcher.utter_message(
                    text=f"❌ Failed to reserve book. Status code: {post_resp.status_code}"
                )

        except Exception as e:
            logger.error(f"[Rasa] Error in ActionReserveBook: {e}")
            dispatcher.utter_message(
                text="❌ Something went wrong while reserving the book."
            )

        return []
