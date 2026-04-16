import { ICreateOrganization, IUpdateOrganization } from "./organization.interface";
export declare const OrgService: {
    createOrganization: (ownerId: number, payload: ICreateOrganization) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: number;
        address: string | null;
        logo: string | null;
        registerNumber: string | null;
        gstNumber: string | null;
        invoicePrefix: string;
        nextInvoiceNumber: number;
    }>;
    getMyOrganizations: (ownerId: number) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: number;
        address: string | null;
        logo: string | null;
        registerNumber: string | null;
        gstNumber: string | null;
        invoicePrefix: string;
        nextInvoiceNumber: number;
    }[]>;
    getOrganizationById: (id: number) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: number;
        address: string | null;
        logo: string | null;
        registerNumber: string | null;
        gstNumber: string | null;
        invoicePrefix: string;
        nextInvoiceNumber: number;
    }>;
    updateOrganization: (id: number, payload: IUpdateOrganization) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: number;
        address: string | null;
        logo: string | null;
        registerNumber: string | null;
        gstNumber: string | null;
        invoicePrefix: string;
        nextInvoiceNumber: number;
    }>;
    deleteOrganization: (id: number) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: number;
        address: string | null;
        logo: string | null;
        registerNumber: string | null;
        gstNumber: string | null;
        invoicePrefix: string;
        nextInvoiceNumber: number;
    }>;
    updateLogo: (id: number, filename: string) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: number;
        address: string | null;
        logo: string | null;
        registerNumber: string | null;
        gstNumber: string | null;
        invoicePrefix: string;
        nextInvoiceNumber: number;
    }>;
    getAllOrganizations: (search?: string) => Promise<({
        owner: {
            email: string;
            name: string;
            id: number;
        };
    } & {
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: number;
        address: string | null;
        logo: string | null;
        registerNumber: string | null;
        gstNumber: string | null;
        invoicePrefix: string;
        nextInvoiceNumber: number;
    })[]>;
    assignOrganization: (orgId: number, userId: number) => Promise<{
        owner: {
            email: string;
            name: string;
            id: number;
        };
    } & {
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        ownerId: number;
        address: string | null;
        logo: string | null;
        registerNumber: string | null;
        gstNumber: string | null;
        invoicePrefix: string;
        nextInvoiceNumber: number;
    }>;
};
//# sourceMappingURL=organization.service.d.ts.map