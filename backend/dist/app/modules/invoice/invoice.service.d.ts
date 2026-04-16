import { Prisma } from "@prisma/client";
import { ICreateInvoice, IUpdateInvoice, IInvoiceQuery } from "./invoice.interface";
export declare const InvoiceService: {
    createInvoice: (organizationId: number, payload: ICreateInvoice) => Promise<{
        customer: {
            email: string | null;
            name: string;
            id: number;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            gstNumber: string | null;
            organizationId: number;
        };
        items: {
            id: number;
            description: string;
            unit: string | null;
            quantity: Prisma.Decimal;
            rate: Prisma.Decimal;
            amount: Prisma.Decimal;
            invoiceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        organizationId: number;
        customerId: number;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        invoiceNumber: string;
        invoiceDate: Date;
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        grandTotal: Prisma.Decimal;
        receivedAmount: Prisma.Decimal;
        amountInWords: string | null;
        challanNo: string | null;
        vehicleNo: string | null;
        siteLocation: string | null;
        billingAddress: string | null;
        referenceNumber: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        transactionNumber: string | null;
        termsAndConditions: string | null;
        notes: string | null;
        authorizedSignatory: string | null;
    } & {
        balanceDue: number;
    }>;
    getInvoices: (organizationId: number, query: IInvoiceQuery) => Promise<{
        data: ({
            customer: {
                name: string;
                id: number;
            };
            items: {
                id: number;
                description: string;
                unit: string | null;
                quantity: Prisma.Decimal;
                rate: Prisma.Decimal;
                amount: Prisma.Decimal;
                invoiceId: number;
            }[];
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            organizationId: number;
            customerId: number;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            invoiceNumber: string;
            invoiceDate: Date;
            subtotal: Prisma.Decimal;
            tax: Prisma.Decimal;
            discount: Prisma.Decimal;
            grandTotal: Prisma.Decimal;
            receivedAmount: Prisma.Decimal;
            amountInWords: string | null;
            challanNo: string | null;
            vehicleNo: string | null;
            siteLocation: string | null;
            billingAddress: string | null;
            referenceNumber: string | null;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
            bankName: string | null;
            bankAccount: string | null;
            bankIfsc: string | null;
            transactionNumber: string | null;
            termsAndConditions: string | null;
            notes: string | null;
            authorizedSignatory: string | null;
        } & {
            balanceDue: number;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getInvoiceById: (organizationId: number, invoiceId: number) => Promise<{
        customer: {
            email: string | null;
            name: string;
            id: number;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            gstNumber: string | null;
            organizationId: number;
        };
        items: {
            id: number;
            description: string;
            unit: string | null;
            quantity: Prisma.Decimal;
            rate: Prisma.Decimal;
            amount: Prisma.Decimal;
            invoiceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        organizationId: number;
        customerId: number;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        invoiceNumber: string;
        invoiceDate: Date;
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        grandTotal: Prisma.Decimal;
        receivedAmount: Prisma.Decimal;
        amountInWords: string | null;
        challanNo: string | null;
        vehicleNo: string | null;
        siteLocation: string | null;
        billingAddress: string | null;
        referenceNumber: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        transactionNumber: string | null;
        termsAndConditions: string | null;
        notes: string | null;
        authorizedSignatory: string | null;
    } & {
        balanceDue: number;
    }>;
    updateInvoice: (organizationId: number, invoiceId: number, payload: IUpdateInvoice) => Promise<{
        customer: {
            email: string | null;
            name: string;
            id: number;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            gstNumber: string | null;
            organizationId: number;
        };
        items: {
            id: number;
            description: string;
            unit: string | null;
            quantity: Prisma.Decimal;
            rate: Prisma.Decimal;
            amount: Prisma.Decimal;
            invoiceId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        organizationId: number;
        customerId: number;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        invoiceNumber: string;
        invoiceDate: Date;
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        grandTotal: Prisma.Decimal;
        receivedAmount: Prisma.Decimal;
        amountInWords: string | null;
        challanNo: string | null;
        vehicleNo: string | null;
        siteLocation: string | null;
        billingAddress: string | null;
        referenceNumber: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        transactionNumber: string | null;
        termsAndConditions: string | null;
        notes: string | null;
        authorizedSignatory: string | null;
    } & {
        balanceDue: number;
    }>;
    deleteInvoice: (organizationId: number, invoiceId: number) => Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        organizationId: number;
        customerId: number;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        invoiceNumber: string;
        invoiceDate: Date;
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        grandTotal: Prisma.Decimal;
        receivedAmount: Prisma.Decimal;
        amountInWords: string | null;
        challanNo: string | null;
        vehicleNo: string | null;
        siteLocation: string | null;
        billingAddress: string | null;
        referenceNumber: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        transactionNumber: string | null;
        termsAndConditions: string | null;
        notes: string | null;
        authorizedSignatory: string | null;
    }>;
};
//# sourceMappingURL=invoice.service.d.ts.map