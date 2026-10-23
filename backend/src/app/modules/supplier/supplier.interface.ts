export type ICreateSupplier = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  stateCode?: string;
  contactPerson?: string;
  notes?: string;
};

export type IUpdateSupplier = Partial<ICreateSupplier> & {
  isActive?: boolean;
};

export type ISupplierQuery = {
  filters?: string | string[];
  search?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
};
