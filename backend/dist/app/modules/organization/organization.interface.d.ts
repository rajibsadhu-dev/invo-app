export type IOrganization = {
    name: string;
    ownerId: number;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    registerNumber?: string;
    gstNumber?: string;
    invoicePrefix?: string;
    nextInvoiceNumber?: number;
};
export type ICreateOrganization = Omit<IOrganization, "ownerId">;
export type IUpdateOrganization = Partial<ICreateOrganization> & {
    nextInvoiceNumber?: number;
};
//# sourceMappingURL=organization.interface.d.ts.map