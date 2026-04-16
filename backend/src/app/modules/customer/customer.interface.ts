export type ICreateCustomer = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
};

export type IUpdateCustomer = Partial<ICreateCustomer>;

export type ICustomerQuery = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
