from langchain_huggingface import (
    HuggingFaceEndpoint,
    ChatHuggingFace
)


endpoint = HuggingFaceEndpoint(
    repo_id="Qwen/Qwen2.5-7B-Instruct",
    huggingfacehub_api_token="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",
    # huggingfacehub_api_token="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",
    temperature=0.2,
    max_new_tokens=512,
)


llm = ChatHuggingFace(
    llm=endpoint
)