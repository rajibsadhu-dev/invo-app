export type ICreateCustomer = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  /** Two-digit GST state code — determines intra- vs inter-state supply. */
  stateCode?: string;
};

export type IUpdateCustomer = Partial<ICreateCustomer>;

export type ICustomerQuery = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
