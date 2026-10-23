import { createBrowserRouter, RouterProvider } from "react-router-dom"
import ProtectedRoute from "@/components/ProtectedRoute"
import SuperadminRoute from "@/components/SuperadminRoute"
import AppLayout from "@/components/layout/AppLayout"
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage"
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage"
import AcceptInvitePage from "@/pages/auth/AcceptInvitePage"
import DashboardPage from "@/pages/DashboardPage"
import UsersPage from "@/pages/users/UsersPage"
import ProfilePage from "@/pages/ProfilePage"
import OrgDetailPage from "@/pages/org/OrgDetailPage"
import OrganizationsPage from "@/pages/org/OrganizationsPage"
import CustomersPage from "@/pages/customers/CustomersPage"
import CustomerDetailPage from "@/pages/customers/CustomerDetailPage"
import ProductsPage from "@/pages/products/ProductsPage"
import ProductDetailPage from "@/pages/products/ProductDetailPage"
import CategoriesPage from "@/pages/products/CategoriesPage"
import VariantAttributesPage from "@/pages/products/VariantAttributesPage"
import InvoicesPage from "@/pages/invoices/InvoicesPage"
import CreateInvoicePage from "@/pages/invoices/CreateInvoicePage"
import EditInvoicePage from "@/pages/invoices/EditInvoicePage"
import InvoiceDetailPage from "@/pages/invoices/InvoiceDetailPage"
import TeamPage from "@/pages/org/TeamPage"
import AdminOrganizationsPage from "@/pages/admin/AdminOrganizationsPage"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/accept-invite",
    element: <AcceptInvitePage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: "users",
        element: (
          <SuperadminRoute>
            <UsersPage />
          </SuperadminRoute>
        ),
      },
      { path: "profile", element: <ProfilePage /> },
      { path: "organizations", element: <OrganizationsPage /> },
      { path: "org/:orgId", element: <OrgDetailPage /> },
      { path: "org/:orgId/team", element: <TeamPage /> },
      { path: "org/:orgId/customers", element: <CustomersPage /> },
      { path: "org/:orgId/customers/:customerId", element: <CustomerDetailPage /> },
      { path: "org/:orgId/products", element: <ProductsPage /> },
      // Before /products/:productId, so "categories"/"attributes" are not read as ids.
      { path: "org/:orgId/products/categories", element: <CategoriesPage /> },
      { path: "org/:orgId/products/attributes", element: <VariantAttributesPage /> },
      { path: "org/:orgId/products/:productId", element: <ProductDetailPage /> },
      { path: "org/:orgId/invoices", element: <InvoicesPage /> },
      { path: "org/:orgId/invoices/new", element: <CreateInvoicePage /> },
      { path: "org/:orgId/invoices/:invoiceId", element: <InvoiceDetailPage /> },
      { path: "org/:orgId/invoices/:invoiceId/edit", element: <EditInvoicePage /> },
      {
        path: "admin/organizations",
        element: (
          <SuperadminRoute>
            <AdminOrganizationsPage />
          </SuperadminRoute>
        ),
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
