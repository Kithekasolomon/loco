import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilExternalLink,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  // {
  //   component: CNavTitle,
  //   name: 'Theme',
  // },
  // {
  //   component: CNavItem,
  //   name: 'Colors',
  //   to: '/theme/colors',
  //   icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
  // },
  // {
  //   component: CNavItem,
  //   name: 'Typography',
  //   to: '/theme/typography',
  //   icon: <CIcon icon={cilPencil} customClassName="nav-icon" />,
  // },
  {
    component: CNavTitle,
    name: 'Components',
  },
  {
    component: CNavGroup,
    name: 'User Management',
    to: '/base',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [
      // {
      //   component: CNavItem,
      //   name: 'Users List',
      //   to: '/users/list',
      // },
      {
        component: CNavItem,
        name: 'Roles List',
        to: '/user/roles',
      },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Calendar'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/components/calendar/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: 'Cards',
      //   to: '/base/users',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Carousel',
      //   to: '/base/carousels',
      // },
      {
        component: CNavItem,
        name: 'Users List',
        to: '/base/collapses',
      },
      
      // {
      //   component: CNavItem,
      //   name: 'Navs & Tabs',
      //   to: '/base/navs',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Pagination',
      //   to: '/base/paginations',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Placeholders',
      //   to: '/base/placeholders',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Popovers',
      //   to: '/base/popovers',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Progress',
      //   to: '/base/progress',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Smart Pagination',
      //   href: 'https://coreui.io/react/docs/components/smart-pagination/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Smart Table'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/components/smart-table/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: 'Spinners',
      //   to: '/base/spinners',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Tables',
      //   to: '/base/tables',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Tabs',
      //   to: '/base/tabs',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Tooltips',
      //   to: '/base/tooltips',
      // },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Virtual Scroller'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/components/virtual-scroller/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
    ],
  },
  {
    component: CNavGroup,
    name: 'Project Management',
    to: '/projects',
    icon: <CIcon icon={cilCursor} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Projects List',
        to: '/project/lists',
      },
      {
        component: CNavItem,
        name: 'Project Tasks',
        to: '/project/tasks',
      },
      {
        component: CNavItem,
        name: 'Project Reports',
        to: '/project/reports',
      },
     
    ],
  },
  {
    component: CNavGroup,
    name: 'Approvals ',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
    items: [
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Autocomplete'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/forms/autocomplete/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: 'Aprrovals List',
      //   to: '/approvals/list',
      // },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Date Picker'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/forms/date-picker/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: 'Date Range Picker',
      //   href: 'https://coreui.io/react/docs/forms/date-range-picker/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: 'Floating Labels',
      //   to: '/forms/floating-labels',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Form Control',
      //   to: '/forms/form-control',
      // },
      // {
      //   component: CNavItem,
      //   name: 'Input Group',
      //   to: '/forms/input-group',
      // },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Multi Select'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/forms/multi-select/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'OTP Input'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/forms/one-time-password-input/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Password Input'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/forms/password-input/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      {
        component: CNavItem,
        name: 'Approvals List',
        to: '/forms/approvals',
      },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Range Slider'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/forms/range-slider/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Rating'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/forms/rating/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      {
        component: CNavItem,
        name: 'InvoiceView',
        to: '/forms/InvoiceView',
      },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Stepper'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/forms/stepper/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      // {
      //   component: CNavItem,
      //   name: (
      //     <React.Fragment>
      //       {'Time Picker'}
      //       <CIcon icon={cilExternalLink} size="sm" className="ms-2" />
      //     </React.Fragment>
      //   ),
      //   href: 'https://coreui.io/react/docs/forms/time-picker/',
      //   badge: {
      //     color: 'danger',
      //     text: 'PRO',
      //   },
      // },
      {
        component: CNavItem,
        name: 'Invoice',
        to: '/forms/invoice',
      },
      
    ],
  },
  {
    component: CNavItem,
    name: 'Analytics ',
    to: '/charts',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
  // {
  //   component: CNavGroup,
  //   name: 'Icons',
  //   icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
  //   items: [
  //     {
  //       component: CNavItem,
  //       name: 'CoreUI Free',
  //       to: '/icons/coreui-icons',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'CoreUI Flags',
  //       to: '/icons/flags',
  //     },
  //     {
  //       component: CNavItem,
  //       name: 'CoreUI Brands',
  //       to: '/icons/brands',
  //     },
  //   ],
  // },
  {
    component: CNavGroup,
    name: 'Accounts',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
    items: [
      // {
      //   component: CNavItem,
      //   name: 'Notifications List',
      //   to: '/notifications/list',
      // },
      {
        component: CNavItem,
        name: 'Customers',
        to: '/forms/Customers',
      },
      {
        component: CNavItem,
        name: 'Contacts',
        to: '/forms/Contacts',
      },
      {
        component: CNavItem,
        name: 'Payments',
        to: '/payments',
      },
      {
        component: CNavItem,
        name: 'View Payment',
        to: '/payments/:id',
      },
      {
        component: CNavItem,
        name: 'Record Payment',
        to: '/payments/create',
      },
     
      {
        component: CNavItem,
        name: 'Bills List',
        to: '/bills',
      },


      {
        component: CNavItem,
        name: 'Reports',
        to: '/reports',
      },
      {
        component: CNavItem,
        name: 'Profit & Loss',
        to: '/reports/profit-loss',
      },
      {
        component: CNavItem,
        name: 'Balance Sheet',
        to: '/reports/balance-sheet',
      },
      {
        component: CNavItem,
        name: 'Accounts Receivable Aging',
        to: '/reports/ar-aging',
      },
      {
        component: CNavItem,
        name: 'Accounts Payable Aging',
        to: '/reports/ap-aging',
      },
      // {
      //   component: CNavItem,
      //   name: 'CreateBill',
      //   to: '/bills/create',
      // },
      {
        component: CNavItem,
        name: 'BillView',
        to: '/bills/:id',
      },
    ],
  },

  {
    component: CNavTitle,
    name: 'Logs',
    items: [
     {
        component: CNavItem,
        name: 'Logs',
        to: '/base/list-groups',
      },
    ],

  },

  
]

export default _nav
