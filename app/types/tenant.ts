// テナント（利用企業）・設定に関する型定義
import { Timestamp } from "firebase/firestore";

// カテゴリ情報
export interface Category {
  category_id: string;
  category_name: string;
  category_description: string;
}

export type Categories = Category[] | null;

// テナント情報
export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  allowed_domains: string[] | null;
  created_at: Timestamp;
  theme_color: string;
  is_developer: boolean;
}

export type Tenants = Tenant[] | null;
