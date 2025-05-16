import openai
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import ChatMessage
from .serializers import ChatMessageSerializer

import dotenv
import os

dotenv.load_dotenv()  # This loads variables from .env file into environment variables


# Configure OpenAI to use Groq base URL (without the endpoint)
openai.api_base = "https://api.groq.com/openai/v1"
openai.api_key = os.getenv("GROQ_API_KEY")

class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user_msg = request.data.get("message")

        try:
            response = openai.ChatCompletion.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {"role": "user", "content": user_msg}
                ],
                request_timeout=10
            )
            generated = response['choices'][0]['message']['content']
        except Exception as e:
            print(f"Groq API Error: {e}")
            generated = "Sorry, something went wrong."

        # Save chat to the database
        chat = ChatMessage.objects.create(user_message=user_msg, bot_response=generated)
        serializer = ChatMessageSerializer(chat)

        return Response(serializer.data, status=status.HTTP_200_OK)
