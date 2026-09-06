export type IOrganization = {
  name: string;
  ownerId: number;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  registerNumber?: string;
  gstNumber?: string;
  /** Two-digit GST state code of the supplier. Required for GST-rated invoices. */
  stateCode?: string;
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
};

export type ICreateOrganization = Omit<IOrganization, "ownerId">;

export type IUpdateOrganization = Partial<ICreateOrganization> & {
  nextInvoiceNumber?: number;
};
