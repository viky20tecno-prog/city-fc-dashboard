// Shared Supabase mock — used by any test that imports from lib/supabase
export const supabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    signOut:    vi.fn().mockResolvedValue({}),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
  storage: {
    from: vi.fn(() => ({
      upload:       vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.example/photo.jpg' } }),
    })),
  },
};
