export const buildClassificationPrompt = (
  query: string,
  categories: { id: string; name: string; description: string }[]
) => {
  const categoryList = categories
    .map((c) => `- ID: ${c.id}, Name: ${c.name}, Description: ${c.description}`)
    .join("\n");

  return `
You are an AI assistant that classifies user queries into specific categories.
Identify the most relevant category for the user's query from the list below.
If no category fits well, use "General".

Categories:
${categoryList}

User Query: "${query}"

Return only the Category ID. If multiple apply, return the best one.
`;
};

export const buildRAGPrompt = (
  query: string,
  context: { q: string; a: string }[]
) => {
  const contextJson = JSON.stringify(context, null, 2);

  return `
You are a helpful support assistant. Answer the user's question based ONLY on the provided Context.
The Context is a list of Q&A pairs in JSON format.
Strictly adhere to the provided information.
If the answer is not in the context, politely say you don't have that information.
Do not hallucinate or use outside knowledge.

Context:
${contextJson}

User Question: "${query}"
`;
};
