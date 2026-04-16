import { IUser } from "./user.interface";
export declare const UserService: {
    createUser: (payload: IUser) => Promise<{
        email: string;
        name: string;
        id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAllUsers: () => Promise<{
        email: string;
        name: string;
        id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getUserById: (id: number) => Promise<{
        email: string;
        name: string;
        id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateUser: (id: number, payload: Partial<IUser>) => Promise<{
        email: string;
        name: string;
        id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteUser: (id: number) => Promise<{
        email: string;
        name: string;
        id: number;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
};
//# sourceMappingURL=user.service.d.ts.map