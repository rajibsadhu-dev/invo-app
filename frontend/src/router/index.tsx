import { createBrowserRouter, RouterProvider } from "react-router-dom"
import ProtectedRoute from "@/components/ProtectedRoute"
import SuperadminRoute from "@/components/SuperadminRoute"
import AppLayout from "@/components/layout/AppLayout"
import LoginPage from "@/pages/auth/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import UsersPage from "@/pages/users/UsersPage"
import ProfilePage from "@/pages/ProfilePage"
import OrgDetailPage from "@/pages/org/OrgDetailPage"
import OrganizationsPage from "@/pages/org/OrganizationsPage"
import CustomersPage from "@/pages/customers/CustomersPage"
import CustomerDetailPage from "@/pages/customers/CustomerDetailPage"
import InvoicesPage from "@/pages/invoices/InvoicesPage"
import CreateInvoicePage from "@/pages/invoices/CreateInvoicePage"
import EditInvoicePage from "@/pages/invoices/EditInvoicePage"
import InvoiceDetailPage from "@/pages/invoices/InvoiceDetailPage"
import AdminOrganizationsPage from "@/pages/admin/AdminOrganizationsPage"

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
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
      { path: "org/:orgId/customers", element: <CustomersPage /> },
      { path: "org/:orgId/customers/:customerId", element: <CustomerDetailPage /> },
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
