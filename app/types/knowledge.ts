// Q&A・カテゴリに関する型定義

// 知識ベース情報
export interface Knowledge {
  knowledge_id: string;
  knowledge_question: string;
  knowledge_answer: string;
}

export type Knowledge_base = Knowledge[] | null;
