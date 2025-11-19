GENRE_NORMALIZATION_PROMPT = """
You are a music genre classification expert. Your task: map Spotify micro-genres 
to one of the following simplified master genres:

{master_genres}

RULES:
- Return valid JSON only.
- If a micro-genre fits multiple, choose the MOST COMMON association.
- If unknown, assign to the closest match based on typical music taxonomy.
- DO NOT invent new master genres.

Micro-genres to classify:
{micro_genres}

Return a dictionary where each micro-genre maps to exactly ONE master genre.
"""
