export type Brand = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type CreateBrandPayload = {
  name: string;
};

export type UpdateBrandPayload = Partial<CreateBrandPayload>;