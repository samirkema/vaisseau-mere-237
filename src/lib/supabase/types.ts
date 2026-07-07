// Types générés à partir du schéma Supabase.
// TODO: remplacer par `supabase gen types typescript` une fois le projet Supabase créé.

export type Role = 'user' | 'admin' | 'superadmin';
export type SubscriptionTier = 'free' | 'subscriber' | 'nft';
export type MangaKind = 'manga' | 'webtoon' | 'bd' | 'artbook';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface DisplayConfig {
  theme?:           'dark' | 'light' | 'sepia';
  backgroundColor?: string;
  accentColor?:     string;
  pageGap?:         'compact' | 'normal' | 'spacious';
  maxWidth?:        'narrow' | 'medium' | 'wide';
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          pseudo: string;
          avatar_url: string | null;
          role: Role;
          subscription_tier: SubscriptionTier;
          subscription_expires_at: string | null;
          wallet_address: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; pseudo: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      manga_works: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          kind: MangaKind;
          language: string;
          display_config: DisplayConfig | null;
          published: boolean;
          views_count: number;
          search_vector: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['manga_works']['Row'], 'id' | 'created_at' | 'views_count' | 'search_vector'>;
        Update: Partial<Database['public']['Tables']['manga_works']['Row']>;
      };
      manga_pages: {
        Row: {
          id: string;
          work_id: string;
          page_number: number;
          image_url: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['manga_pages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['manga_pages']['Row']>;
      };
      manga_display_permissions: {
        Row: {
          id: string;
          work_id: string;
          user_id: string;
          granted_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['manga_display_permissions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['manga_display_permissions']['Row']>;
      };
      tableaux: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          artist: string | null;
          main_image: string;
          thumbnail: string;
          price_eur: number | null;
          price_btc: number | null;
          available: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tableaux']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tableaux']['Row']>;
      };
      remixes: {
        Row: {
          id: string;
          user_id: string;
          photo_id: string;
          image_path: string;
          votes_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['remixes']['Row'], 'id' | 'created_at' | 'votes_count'>;
        Update: Partial<Database['public']['Tables']['remixes']['Row']>;
      };
      votes: {
        Row: {
          id: string;
          voter_id: string;
          remix_id: string;
          photo_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['votes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['votes']['Row']>;
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          method: string;
          status: PaymentStatus;
          provider_ref: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
      };
      reading_progress: {
        Row: {
          user_id: string;
          work_id: string;
          page_number: number;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['reading_progress']['Row'];
        Update: Partial<Database['public']['Tables']['reading_progress']['Row']>;
      };
      wallets: {
        Row: {
          user_id: string;
          otaku_coin_balance: number;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['wallets']['Row'];
        Update: Partial<Database['public']['Tables']['wallets']['Row']>;
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          reason: string;
          payment_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['wallet_transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['wallet_transactions']['Row']>;
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string;
          pseudo: string;
          avatar_url: string | null;
        };
      };
    };
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean };
      is_subscriber: { Args: Record<never, never>; Returns: boolean };
      is_nft_holder: { Args: Record<never, never>; Returns: boolean };
      increment_views_count: { Args: { work_id: string }; Returns: void };
    };
  };
};
