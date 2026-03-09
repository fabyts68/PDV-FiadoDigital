export type ProductType = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type CreateProductTypePayload = {
  name: string;
};

export type UpdateProductTypePayload = Partial<CreateProductTypePayload>;
