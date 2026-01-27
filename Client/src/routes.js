import React from 'react'
import ProjectList from './views/pages/projectManagement/ProjectList/ProjectList'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))
const BoqView = React.lazy(() => import('./views/pages/projectManagement/BoqView/BoqView'))
const EditProject = React.lazy(
  () => import('./views/pages/projectManagement/EditProject/EditProject'),
)

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


const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups'))
const Dropdowns = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns'))

//Forms
const ApprovalList = React.lazy(() => import('./views/pages/Approvals/ApprovalList/ApprovalList'))
const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels'))
const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup'))
const Layout = React.lazy(() => import('./views/forms/layout/Layout'))
const Approvals = React.lazy(() => import('./views/pages/Approvals/Approvals'))
const Select = React.lazy(() => import('./views/forms/select/Select'))
const Validation = React.lazy(() => import('./views/forms/validation/Validation'))

const Charts = React.lazy(() => import('./views/charts/Charts'))

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

// Notifications
const NotificationList = React.lazy(() => import('./views/pages/notifications/Notifications/NotificationList'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))

const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/theme', name: 'Theme', element: Colors, exact: true },
  { path: '/theme/colors', name: 'Colors', element: Colors },
  { path: '/theme/typography', name: 'Typography', element: Typography },
  { path: '/user', name: 'User Management', element: Users, exact: true },

  //user management
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
  { path: '/project/reports', name: 'Project Reports', element: Dropdowns },
  { path: '/projects/view/:id', name: 'View Project BOQ', element: BoqView },
  { path: '/projects/edit/:id', name: 'Edit Project', element: EditProject },
  { path: '/project/lists', name: 'Project Lists', element: ProjectList },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/forms', name: 'Forms', element: FormControl, exact: true },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl },
  { path: '/forms/select', name: 'Select', element: Select },
  { path: '/forms/approvals/list', name: 'ApprovalList', element: ApprovalList },
  { path: '/forms/approvals', name: 'Approvals', element: Approvals },
  { path: '/forms/input-group', name: 'Input Group', element: InputGroup },
  { path: '/forms/floating-labels', name: 'Floating Labels', element: FloatingLabels },
  { path: '/forms/layout', name: 'Layout', element: Layout },
  { path: '/forms/validation', name: 'Validation', element: Validation },
  { path: '/icons', exact: true, name: 'Icons', element: CoreUIIcons },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons },
  { path: '/icons/flags', name: 'Flags', element: Flags },
  { path: '/icons/brands', name: 'Brands', element: Brands },
  { path: '/notifications', name: 'Notifications', element: NotificationList, exact: true },
  { path: '/notifications/list', name: 'Notification List', element: NotificationList },
  { path: '/notifications/badges', name: 'Badges', element: Badges },
  { path: '/notifications/modals', name: 'Modals', element: Modals },
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

  { path: '/notifications/toasts', name: 'Toasts', element: Toasts },
  { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
