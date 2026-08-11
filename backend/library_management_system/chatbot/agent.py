import re

from langchain_classic.agents import (
    create_tool_calling_agent,
    AgentExecutor,
)

from langchain_core.messages import HumanMessage, AIMessage

from .llm import llm
from .prompt import prompt
from .tools import create_tools


# ============================================================
# INTENT DETECTION
# ============================================================

def is_recommendation_request(message, history=None):
    """
    Determine whether the user is asking for book recommendations.

    This is deliberately deterministic.
    We do NOT rely on the LLM to decide this.
    """

    text = message.lower().strip()

    # --------------------------------------------------------
    # Explicit recommendation words
    # --------------------------------------------------------

    recommendation_patterns = [
        r"\brecommend\b",
        r"\brecommendation\b",
        r"\brecommendations\b",
        r"\bsuggest\b",
        r"\bsuggestions\b",
        r"\bwhat should i read\b",
        r"\bwhat can i read\b",
        r"\bwhat do you recommend\b",
        r"\bwhich book should i read\b",
        r"\bwhich books should i read\b",
    ]

    for pattern in recommendation_patterns:
        if re.search(pattern, text):
            return True

    # --------------------------------------------------------
    # Learning / studying intent
    # --------------------------------------------------------

    learning_patterns = [
        r"\bi am learning\b",
        r"\bi'm learning\b",
        r"\bi am studying\b",
        r"\bi'm studying\b",
        r"\bi want to learn\b",
        r"\bi want to study\b",
        r"\bi am interested in\b",
        r"\bi'm interested in\b",
        r"\bi want to read about\b",
        r"\bi would like to learn\b",
    ]

    for pattern in learning_patterns:
        if re.search(pattern, text):
            return True

    # --------------------------------------------------------
    # Topic + book request
    # --------------------------------------------------------

    topic_book_patterns = [
        r"\bbooks?\s+about\b",
        r"\bbooks?\s+on\b",
        r"\bbooks?\s+related\s+to\b",
        r"\bbooks?\s+for\b",
        r"\bbooks?\s+to\s+learn\b",
        r"\bbook\s+about\b",
        r"\bbook\s+on\b",
        r"\bbook\s+related\s+to\b",
        r"\bbook\s+for\b",
    ]

    for pattern in topic_book_patterns:
        if re.search(pattern, text):
            return True

    # --------------------------------------------------------
    # "Do you have any books..." usually means recommendation
    # unless the user gives a specific title.
    # --------------------------------------------------------

    do_you_have_patterns = [
        r"\bdo you have any books\b",
        r"\bdo you have books\b",
        r"\bany good books\b",
        r"\bgive me some books\b",
        r"\bshow me some books\b",
        r"\bfind me some books\b",
    ]

    for pattern in do_you_have_patterns:
        if re.search(pattern, text):
            return True

    # --------------------------------------------------------
    # "something about X"
    # --------------------------------------------------------

    if re.search(r"\bsomething\s+about\b", text):
        return True

    # --------------------------------------------------------
    # MORE recommendations
    #
    # Example:
    # User: Recommend Python books
    # Assistant: ...
    # User: Give me more
    #
    # We need history to understand this.
    # --------------------------------------------------------

    more_patterns = [
        r"^more$",
        r"^more books$",
        r"^give me more$",
        r"^give me more books$",
        r"^show me more$",
        r"^anything else\??$",
        r"^any more\??$",
    ]

    for pattern in more_patterns:
        if re.search(pattern, text):
            if previous_conversation_was_recommendation(history):
                return True

    return False


# ============================================================
# CHECK PREVIOUS CONVERSATION
# ============================================================

def previous_conversation_was_recommendation(history):
    """
    Look through previous messages to determine whether the
    current conversation was about recommendations.
    """

    if not history:
        return False

    # Look at the most recent messages first
    for msg in reversed(history[-6:]):

        content = (
            msg.get("content")
            or msg.get("text")
            or ""
        ).lower().strip()

        if not content:
            continue

        recommendation_words = [
            "recommend",
            "recommendation",
            "suggest",
            "what should i read",
            "books about",
            "books related to",
            "books for",
            "learning",
            "studying",
        ]

        if any(word in content for word in recommendation_words):
            return True

    return False


# ============================================================
# EXTRACT RECOMMENDATION QUERY
# ============================================================

def extract_recommendation_query(message, history=None):
    """
    Extract a useful topic for recommend_books.

    Examples:

    "Recommend me books about history"
        -> "history"

    "I'm learning Python"
        -> "Python"

    "Do you have any books related to machine learning?"
        -> "machine learning"
    """

    text = message.strip()

    patterns = [
        r"(?:recommend|suggest).*?(?:books?|something)\s+(?:about|on|related to|for)\s+(.+)",
        r"(?:books?|book)\s+(?:about|on|related to|for)\s+(.+)",
        r"(?:do you have)(?: any)? books\s+(?:about|on|related to|for)\s+(.+)",
        r"(?:i am learning|i'm learning|i am studying|i'm studying)\s+(.+)",
        r"(?:i want to learn|i want to study)\s+(.+)",
        r"(?:i am interested in|i'm interested in)\s+(.+)",
        r"(?:i want to read about)\s+(.+)",
        r"(?:something about)\s+(.+)",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:
            query = match.group(1).strip()

            # Remove question marks
            query = query.rstrip("?.!")

            if query:
                return query

    # --------------------------------------------------------
    # If user says "more", use previous recommendation topic
    # --------------------------------------------------------

    if text.lower() in [
        "more",
        "more books",
        "give me more",
        "give me more books",
        "show me more",
        "anything else?",
        "any more?",
    ]:

        if history:

            for msg in reversed(history):

                content = (
                    msg.get("content")
                    or msg.get("text")
                    or ""
                ).strip()

                if not content:
                    continue

                # Try to recover topic from previous user message
                previous_query = extract_recommendation_query(
                    content,
                    None
                )

                if previous_query:
                    return previous_query

    # --------------------------------------------------------
    # Last fallback
    # --------------------------------------------------------

    return text


# ============================================================
# FORMAT RECOMMENDATIONS
# ============================================================

def format_recommendations(result):

    if not result:
        return None

    # Some tools return a list directly
    if isinstance(result, list):
        books = result

    # Some tools may return {"books": [...]}
    elif isinstance(result, dict):
        books = (
            result.get("books")
            or result.get("results")
            or []
        )

    else:
        return str(result)

    if not books:
        return None

    response = "Here are some books I found:\n\n"

    for index, book in enumerate(books[:5], start=1):

        title = book.get("title", "Unknown title")
        authors = book.get("authors", "")

        response += f"{index}. **{title}**"

        if authors:
            response += f" by {authors}"

        response += "\n"

        if book.get("description"):
            response += f"   - {book['description']}\n"

        if book.get("year"):
            response += f"   - Year: {book['year']}\n"

        if book.get("isbn"):
            response += f"   - ISBN: {book['isbn']}\n"

        response += "\n"

    return response


# ============================================================
# ASK AI
# ============================================================

def ask_ai(message, user, history=None):

    history = history or []

    # --------------------------------------------------------
    # CREATE USER-SPECIFIC TOOLS
    # --------------------------------------------------------

    tools = create_tools(user)

    # --------------------------------------------------------
    # USER INFORMATION
    # --------------------------------------------------------

    username = "Guest"
    role = "guest"

    if user.is_authenticated:
        username = user.username
        role = getattr(user, "role", "user")

    # --------------------------------------------------------
    # CONVERT FRONTEND HISTORY
    # --------------------------------------------------------

    chat_history = []

    for msg in history:

        role_name = (
            msg.get("role")
            or msg.get("sender")
        )

        content = (
            msg.get("content")
            or msg.get("text")
            or ""
        ).strip()

        if not content:
            continue

        if role_name in ["user", "human"]:
            chat_history.append(
                HumanMessage(content=content)
            )

        elif role_name in ["assistant", "bot", "ai"]:
            chat_history.append(
                AIMessage(content=content)
            )

    # ========================================================
    # RECOMMENDATION ROUTER
    # ========================================================

    if is_recommendation_request(
        message,
        history
    ):

        print("\n======================================")
        print("RECOMMENDATION INTENT DETECTED")
        print("USER MESSAGE:", message)
        print("======================================\n")

        recommend_tool = next(
            (
                tool
                for tool in tools
                if tool.name == "recommend_books"
            ),
            None
        )

        if recommend_tool is None:

            print("ERROR: recommend_books tool not found")

            return (
                "Sorry, the recommendation service is "
                "currently unavailable."
            )

        query = extract_recommendation_query(
            message,
            history
        )

        print("RECOMMENDATION QUERY:", query)

        # ----------------------------------------------------
        # CALL recommend_books DIRECTLY
        # ----------------------------------------------------

        result = recommend_tool.invoke({
            "query": query
        })

        print("RECOMMENDATION RESULT:")
        print(result)

        formatted = format_recommendations(result)

        # ----------------------------------------------------
        # FALLBACK TO SEARCH
        # ----------------------------------------------------

        if not formatted:

            print(
                "recommend_books returned no results."
            )

            search_tool = next(
                (
                    tool
                    for tool in tools
                    if tool.name == "search_book"
                ),
                None
            )

            if search_tool:

                print(
                    "FALLBACK: calling search_book"
                )

                search_result = search_tool.invoke({
                    "query": query
                })

                formatted = format_recommendations(
                    search_result
                )

        if formatted:
            return formatted

        return (
            f"I couldn't find any books related to "
            f"'{query}' in the library."
        )

    # ========================================================
    # NORMAL AGENT
    # ========================================================

    print("\n======================================")
    print("NORMAL AGENT")
    print("USER MESSAGE:", message)
    print("======================================\n")

    agent = create_tool_calling_agent(
        llm,
        tools,
        prompt
    )

    executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
    )

    result = executor.invoke({
        "input": message,
        "chat_history": chat_history,
        "username": username,
        "role": role,
    })

    return result["output"]