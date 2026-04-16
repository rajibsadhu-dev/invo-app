import { IPaginationOptions } from "@/app/interfaces/pagination";
type IReturn = {
    page: number;
    limit: number;
    skip: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
};
declare const calculatePagination: (options: IPaginationOptions) => IReturn;
export default calculatePagination;
//# sourceMappingURL=paginationHelper.d.ts.map