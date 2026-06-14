from django.conf import settings
from google import genai

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def generate_embedding(text):
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    return response.embeddings[0].values