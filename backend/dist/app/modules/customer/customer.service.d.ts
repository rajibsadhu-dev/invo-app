import { ICreateCustomer, IUpdateCustomer, ICustomerQuery } from "./customer.interface";
export declare const CustomerService: {
    createCustomer: (organizationId: number, payload: ICreateCustomer) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        gstNumber: string | null;
        organizationId: number;
    }>;
    getCustomers: (organizationId: number, query: ICustomerQuery) => Promise<{
        data: {
            email: string | null;
            name: string;
            id: number;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            gstNumber: string | null;
            organizationId: number;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getCustomerById: (organizationId: number, customerId: number) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        gstNumber: string | null;
        organizationId: number;
    }>;
    updateCustomer: (organizationId: number, customerId: number, payload: IUpdateCustomer) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        gstNumber: string | null;
        organizationId: number;
    }>;
    deleteCustomer: (organizationId: number, customerId: number) => Promise<{
        email: string | null;
        name: string;
        id: number;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        gstNumber: string | null;
        organizationId: number;
    }>;
};
//# sourceMappingURL=customer.service.d.ts.map