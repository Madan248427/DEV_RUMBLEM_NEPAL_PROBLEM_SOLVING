from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from rest_framework_simplejwt.authentication import JWTAuthentication
from .agent import ask_ai


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])
def chat(request):

    print("USER:", request.user)
    print("AUTH:", request.user.is_authenticated)

    message = request.data.get("message")
    history = request.data.get("history", [])

    if not message:
        return Response(
            {"reply": "Please enter a message."},
            status=400
        )

    answer = ask_ai(
        message=message,
        user=request.user,
        history=history
    )

    return Response({
        "reply": answer
    })