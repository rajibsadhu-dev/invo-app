import httpStatus from "http-status";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { ICreateOrganization, IUpdateOrganization } from "./organization.interface";

const createOrganization = async (ownerId: number, payload: ICreateOrganization) => {
  const org = await prisma.organization.create({
    data: {
      ...payload,
      ownerId,
      email: payload.email || null,
      invoicePrefix: payload.invoicePrefix || "INV",
    },
  });
  return org;
};

const getMyOrganizations = async (ownerId: number) => {
  return prisma.organization.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
};

const getOrganizationById = async (id: number) => {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found");
  }
  return org;
};

const updateOrganization = async (id: number, payload: IUpdateOrganization) => {
  return prisma.organization.update({
    where: { id },
    data: {
      ...payload,
      // Only coerce email to null when it's explicitly provided as an empty string
      ...(payload.email !== undefined && { email: payload.email || null }),
    },
  });
};

const deleteOrganization = async (id: number) => {
  // Organizations cascade to customers and invoices. Refuse rather than destroy a
  // financial history that the business is legally required to retain.
  const invoiceCount = await prisma.invoice.count({ where: { organizationId: id } });
  if (invoiceCount > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `This organization has ${invoiceCount} invoice(s) and cannot be deleted`
    );
  }

  // Delete logo file if it exists
  const org = await prisma.organization.findUnique({ where: { id } });
  if (org?.logo) {
    const logoPath = path.join(process.cwd(), org.logo);
    if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
  }
  return prisma.organization.delete({ where: { id } });
};

const updateLogo = async (id: number, filename: string) => {
  // Delete old logo file if it exists
  const org = await prisma.organization.findUnique({ where: { id } });
  if (org?.logo) {
    const oldPath = path.join(process.cwd(), org.logo);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const logoUrl = `uploads/logos/${filename}`;
  return prisma.organization.update({ where: { id }, data: { logo: logoUrl } });
};

const getAllOrganizations = async (search?: string) => {
  return prisma.organization.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { owner: { name: { contains: search } } },
            { owner: { email: { contains: search } } },
          ],
        }
      : undefined,
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const assignOrganization = async (orgId: number, userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return prisma.organization.update({
    where: { id: orgId },
    data: { ownerId: userId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });
};

export const OrgService = {
  createOrganization,
  getMyOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  updateLogo,
  getAllOrganizations,
  assignOrganization,
};
