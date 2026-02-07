import React from 'react'
import ProjectList from './views/pages/projectManagement/ProjectList/ProjectList'
const Payments = React.lazy(() => import('./views/forms/Payments/Payments'))
const CreatePayment = React.lazy(() => import('./views/forms/Payments/CreatePayment'))


const ServicesList = React.lazy(() => import('./views/service/ServicesList'));
const ServiceRequestsList = React.lazy(() => import('./views/service/ServiceRequestsList'));
const ServiceRequestCreate = React.lazy(() => import('./views/service/ServiceRequestCreate'));
const ServiceRequestDetail = React.lazy(() => import('./views/service/ServiceRequestDetail'));
const AdminRequestsList = React.lazy(() => import('./views/service/AdminRequestsList'));
const TechnicianDashboard = React.lazy(() => import('./views/technician/TechnicianDashboard'));

const PaymentView = React.lazy(() => import('./views/forms/Payments/PaymentView'))
const ProfitLoss = React.lazy(() => import('./views/forms/reports/ProfitLoss'))
const Reports = React.lazy(() => import('./views/forms/reports/Reports'))
const BalanceSheet = React.lazy(() => import('./views/forms/reports/BalanceSheet'))
const ARAging = React.lazy(() => import('./views/forms/reports/ARAging'))
const APAging = React.lazy(() => import('./views/forms/reports/APAging'))

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))
const BoqView = React.lazy(() => import('./views/pages/projectManagement/BoqView/BoqView'))
const EditProject = React.lazy(
  () => import('./views/pages/projectManagement/EditProject/EditProject'),
)
const Contacts = React.lazy(() => import('./views/forms/Contacts/Contacts'))
const CreateContact = React.lazy(() => import('./views/forms/Contacts/CreateContact'))
const ContactView = React.lazy(() => import('./views/forms/Contacts/ContactView'))

const DailyReportsList = React.lazy(() => import('./views/forms/DailyReports/DailyReportsList'))
const DailyReportForm = React.lazy(() => import('./views/forms/DailyReports/DailyReportForm'))
// const DailyReportView = React.lazy(() => import('./views/forms/DailyReports/DailyReportView'))

// Base
const UserList = React.lazy(() => import('./views/pages/userManagement/UserList/UserList'))
const UserRoles = React.lazy(() => import('./views/pages/userManagement/UserRoles/UserRoles'))
const Users = React.lazy(() => import('./views/pages/userManagement/Users/Users'))
const Carousels = React.lazy(() => import('./views/base/carousels/Carousels'))
const Collapses = React.lazy(() => import('./views/base/collapses/Collapses'))
const ListGroups = React.lazy(() => import('./views/base/list-groups/ListGroups'))
const Navs = React.lazy(() => import('./views/base/navs/Navs'))
const Paginations = React.lazy(() => import('./views/base/paginations/Paginations'))
const Placeholders = React.lazy(() => import('./views/base/placeholders/Placeholders'))
const Popovers = React.lazy(() => import('./views/base/popovers/Popovers'))
const Progress = React.lazy(() => import('./views/base/progress/Progress'))
const Spinners = React.lazy(() => import('./views/base/spinners/Spinners'))
const Tabs = React.lazy(() => import('./views/base/tabs/Tabs'))
const Tables = React.lazy(() => import('./views/base/tables/Tables'))
const Tooltips = React.lazy(() => import('./views/base/tooltips/Tooltips'))

// Buttons
const Buttons = React.lazy(() => import('./views/pages/projectManagement/ProjectList/ProjectList'))

const BoqItemDetails = React.lazy(
  () => import('./views/pages/projectManagement/BoqItemDetails/BoqItemDetails'),
)
const InvoiceView = React.lazy(
  () => import('./views/forms/Invoice/InvoiceView/InvoiceView'),
)


const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups'))


//Forms
const ApprovalList = React.lazy(() => import('./views/pages/Approvals/ApprovalList/ApprovalList'))
const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels'))
const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup'))
const Invoice = React.lazy(() => import('./views/forms/Invoice/Invoice'))
const Approvals = React.lazy(() => import('./views/pages/Approvals/Approvals'))

const CreateInvoice = React.lazy(() => import('./views/forms/CreateInvoice/CreateInvoice'))

const Charts = React.lazy(() => import('./views/charts/Charts'))

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

// Notifications
const NotificationList = React.lazy(() => import('./views/pages/notifications/Notifications/NotificationList'))
const Customers = React.lazy(() => import('./views/forms/Customers/Customers'))
const Bills = React.lazy(() => import('./views/forms/Bills/Bills'))
const CreateBill = React.lazy(() => import('./views/forms/CreateBill/CreateBill'))
const BillView = React.lazy(() => import('./views/forms/BillView/BillView'))

const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/theme', name: 'Theme', element: Colors, exact: true },
  { path: '/theme/colors', name: 'Colors', element: Colors },
  { path: '/theme/typography', name: 'Typography', element: Typography },
  { path: '/user', name: 'User Management', element: Users, exact: true },

  { path: '/base/list', name: 'Users List', element: UserList },
  { path: '/user/roles', name: 'User Roles', element: UserRoles },
  { path: '/base/users', name: 'Users', element: Users },
  { path: '/base/carousels', name: 'Carousel', element: Carousels },
  { path: '/base/collapses', name: 'Collapse', element: Collapses },
  { path: '/base/list-groups', name: 'List Groups', element: ListGroups },
  { path: '/base/navs', name: 'Navs', element: Navs },
  { path: '/base/paginations', name: 'Paginations', element: Paginations },
  { path: '/base/placeholders', name: 'Placeholders', element: Placeholders },
  { path: '/base/popovers', name: 'Popovers', element: Popovers },
  { path: '/base/progress', name: 'Progress', element: Progress },
  { path: '/base/spinners', name: 'Spinners', element: Spinners },
  { path: '/base/tabs', name: 'Tabs', element: Tabs },
  { path: '/base/tables', name: 'Tables', element: Tables },
  { path: '/base/tooltips', name: 'Tooltips', element: Tooltips },
  { path: '/projects', name: 'Project Management', element: Buttons, exact: true },

  { path: '/project/tasks', name: 'Project Tasks', element: Buttons },

  { path: '/projects/view/:id', name: 'View Project BOQ', element: BoqView },
  { path: '/projects/edit/:id', name: 'Edit Project', element: EditProject },
  { path: '/project/lists', name: 'Project Lists', element: ProjectList },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/forms', name: 'Forms', element: FormControl, exact: true },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl },
  { path: '/forms/InvoiceView', name: 'InvoiceView', element: InvoiceView },
  { path: '/admin/requests', name: 'Admin Requests', element: AdminRequestsList },


  {
    path: '/services',
    name: 'Available Services',
    element: ServicesList,
  },
  {
    path: '/requests',
    name: 'My Service Requests',
    element: ServiceRequestsList,
  },
  {
    path: '/requests/create',
    name: 'Create Service Request',
    element: ServiceRequestCreate,
  },
  {
    path: '/requests/:id',
    name: 'Service Request Detail',
    element: ServiceRequestDetail,
  },
  {
    path: '/technician/dashboard',
    name: 'Technician Dashboard',
    element: TechnicianDashboard,
  },
  

  {
    path: '/invoices',
    name: 'Invoices',
    element: Invoice,
  },
  {
    path: '/invoices/create',
    name: 'Create Invoice',
    element: CreateInvoice,
  },
  {
    path: '/invoices/:id',
    name: 'View Invoice',
    element: InvoiceView,
  },
  { path: '/forms/approvals/list', name: 'ApprovalList', element: ApprovalList },
  { path: '/forms/approvals', name: 'Approvals', element: Approvals },
  { path: '/forms/input-group', name: 'Input Group', element: InputGroup },
  { path: '/forms/floating-labels', name: 'Floating Labels', element: FloatingLabels },
  { path: '/forms/invoice', name: 'Invoice', element: Invoice },
  { path: '/forms/CreateInvoice', name: 'CreateInvoice', element: CreateInvoice },
  { path: '/icons', exact: true, name: 'Icons', element: CoreUIIcons },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons },
  { path: '/icons/flags', name: 'Flags', element: Flags },
  { path: '/icons/brands', name: 'Brands', element: Brands },
  { path: '/notifications', name: 'Notifications', element: NotificationList, exact: true },
  { path: '/notifications/list', name: 'Notification List', element: NotificationList },
  { path: '/forms/Customers', name: 'Customers', element: Customers },
  { path: '/forms/bills', name: 'Bills', element: Bills },
  { path: '/forms/contacts', name: 'Contacts', element: Contacts },
  {
    path: '/projects/view/:id/boq',
    name: 'View Project BOQ',
    element: BoqView,
  },
  {
    path: '/projects/view/:id/boq/:boqItemId/details',
    name: 'BOQ Item Details',
    element: BoqItemDetails,
  },

  {
    path: '/projects/edit/:id',
    name: 'Edit Project',
    element: EditProject,
  },

  // { path: '/forms/CreateBill', name: 'CreateBill', element: CreateBill },
  // { path: '/forms/BillView', name: 'BillView', element: BillView },
  { path: '/bills', name: 'Bills List', element: Bills },
  { path: '/bills/create', name: 'Create Bill', element: CreateBill },
  { path: '/bills/:id', name: 'View Bill', element: BillView },
  { path: '/contacts', name: 'Contacts', element: Contacts },
  { path: '/contacts/create', name: 'Create Contact', element: CreateContact },
  { path: '/contacts/:id', name: 'View Contact', element: ContactView },
  { path: '/contacts/:id/edit', name: 'Edit Contact', element: CreateContact },
  { path: '/payments', name: 'Payments', element: Payments },
  { path: '/payments/create', name: 'Record Payment', element: CreatePayment },
  { path: '/payments/:id', name: 'View Payment', element: PaymentView },

  { path: '/reports', name: 'Reports', element: Reports },
  { path: '/reports/profit-loss', name: 'Profit & Loss', element: ProfitLoss },
  { path: '/reports/balance-sheet', name: 'Balance Sheet', element: BalanceSheet },
  { path: '/reports/ar-aging', name: 'A/R Aging', element: ARAging },
  { path: '/reports/ap-aging', name: 'A/P Aging', element: APAging },

  { path: '/widgets', name: 'Widgets', element: Widgets },
  { path: '/projects/:projectId/daily-reports', name: 'Daily Reports List', element: DailyReportsList },
  { path: '/projects/:projectId/daily-reports/create', name: 'Create Daily Report', element: DailyReportForm },
  { path: '/projects/:projectId/daily-reports/:reportId', name: 'Edit Daily Report', element: DailyReportForm },

]

export default routes
