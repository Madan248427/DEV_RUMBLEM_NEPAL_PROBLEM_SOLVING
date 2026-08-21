from langchain_core.messages import (
    HumanMessage,
    AIMessage,
)

from langchain.agents import create_agent

from .llm import llm
from .prompt import prompt
from .tools import create_tools


def ask_ai(
    message,
    user,
    history=None,
):

    history = history or []

    # ====================================================
    # CURRENT USER
    # ====================================================

    if user and user.is_authenticated:

        username = user.username

        role = getattr(
            user,
            "role",
            "user",
        )

        user_id = user.id

    else:

        username = "Guest"

        role = "guest"

        user_id = None

    # ====================================================
    # CONVERT HISTORY
    # ====================================================

    chat_history = []

    for msg in history:

        if not isinstance(
            msg,
            dict,
        ):
            continue

        role_name = (
            msg.get("role")
            or msg.get("sender")
            or ""
        )

        content = (
            msg.get("content")
            or msg.get("text")
            or ""
        )

        content = str(
            content
        ).strip()

        if not content:
            continue

        role_name = str(
            role_name
        ).lower()

        if role_name in [
            "user",
            "human",
        ]:

            chat_history.append(
                HumanMessage(
                    content=content
                )
            )

        elif role_name in [
            "assistant",
            "bot",
            "ai",
        ]:

            chat_history.append(
                AIMessage(
                    content=content
                )
            )

    # ====================================================
    # CONVERT HISTORY TO TEXT
    # ====================================================
    #
    # We deliberately convert history to text.
    # This means prompt.py does NOT need
    # MessagesPlaceholder.
    #
    # ====================================================

    history_text = ""

    for msg in chat_history:

        if isinstance(
            msg,
            HumanMessage,
        ):

            history_text += (
                "User: "
                + str(msg.content)
                + "\n"
            )

        elif isinstance(
            msg,
            AIMessage,
        ):

            history_text += (
                "Assistant: "
                + str(msg.content)
                + "\n"
            )

    if not history_text:

        history_text = (
            "No previous conversation."
        )

    # ====================================================
    # DEBUG
    # ====================================================

    print(
        "\n======================================"
    )

    print(
        "NEXUS NEPAL AI"
    )

    print(
        "USER MESSAGE:",
        message
    )

    print(
        "USERNAME:",
        username
    )

    print(
        "USER ID:",
        user_id
    )

    print(
        "ROLE:",
        role
    )

    print(
        "HISTORY:",
        history_text
    )

    print(
        "======================================\n"
    )

    # ====================================================
    # FORMAT SYSTEM PROMPT
    # ====================================================

    system_prompt = prompt.format(
        username=username,
        role=role,
        user_id=user_id,
        chat_history=history_text,
        input=message,
    )

    # ====================================================
    # CREATE USER-SPECIFIC TOOLS
    # ====================================================

    tools = create_tools(
        user
    )

    # ====================================================
    # CREATE AGENT
    # ====================================================

    agent = create_agent(
        model=llm,
        tools=tools,
        system_prompt=system_prompt,
    )

    # ====================================================
    # AGENT MESSAGES
    # ====================================================

    messages = []

    messages.extend(
        chat_history
    )

    messages.append(
        HumanMessage(
            content=message
        )
    )

    # ====================================================
    # INVOKE
    # ====================================================

    result = agent.invoke(
        {
            "messages": messages
        }
    )

    # ====================================================
    # RESPONSE
    # ====================================================

    response_messages = result.get(
        "messages",
        []
    )

    for response_message in reversed(
        response_messages
    ):

        if isinstance(
            response_message,
            AIMessage,
        ):

            content = (
                response_message.content
            )

            if isinstance(
                content,
                str,
            ):

                if content.strip():

                    return content

    return (
        "Sorry, I couldn't generate "
        "a response."
    )