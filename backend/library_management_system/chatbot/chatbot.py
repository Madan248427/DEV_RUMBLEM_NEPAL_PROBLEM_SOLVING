from rest_framework.decorators import api_view
from rest_framework.response import Response

from .llm import ask_ai



@api_view(["POST"])
def chat(request):

    message = request.data.get("message")


    answer = ask_ai(message)


    return Response({
        "reply": answer
    })