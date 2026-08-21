from langchain_huggingface import (
    HuggingFaceEndpoint,
    ChatHuggingFace,
)


# ============================================================
# HUGGING FACE CONFIGURATION
# ============================================================

# TESTING ONLY:
# Put your working Hugging Face token directly here.


MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
PROVIDER = "featherless-ai"
import os

HF_TOKEN = os.getenv("HF_TOKEN")


# ============================================================
# CREATE HUGGING FACE ENDPOINT
# ============================================================

endpoint = HuggingFaceEndpoint(
    repo_id=MODEL_ID,
    huggingfacehub_api_token=HF_TOKEN,
    provider=PROVIDER,
    temperature=0.2,
    max_new_tokens=512,
)




llm = ChatHuggingFace(
    llm=endpoint
)