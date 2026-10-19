import {
  Home,
  MessageSquare,
  DollarSign,
  Clock,
  PieChart,
  Download,
  Inbox,
  Package,
  Tag,
  Send,
  ShoppingCart,
  Briefcase,
  ShoppingBag,
  Truck,
  Anchor,
  CreditCard,
  Clipboard,
  Bell,
  Users,
  Globe,
  Settings,
  UserCheck,
  AlertTriangle,
  UserPlus,
} from "react-feather";

export const MENUITEMSFORADMIN = [
  {
    path: "/dashboard",
    title: "Dashboard",
    icon: Home,
    color: "#4466f2",
    type: "link",
    badgeType: "primary",
    active: false,
  },
  {
    path: "/messages",
    title: "Messages",
    icon: MessageSquare,
    color: "#00b8d9",
    type: "link",
    badgeType: "primary",
    active: false,
  },

  {
    title: "Cash in/Cash out",
    icon: DollarSign,
    color: "#16a34a",
    type: "sub",
    active: false,
    children: [
      {
        path: "/expense/daily-expense",
        title: new Date().toDateString(),
        type: "link",
      },
      {
        path: "/expense/expense-history",
        title: "History",
        type: "link",
      },
      {
        path: "/expense/salary",
        title: "Salary",
        type: "link",
      },
      {
        path: "/expense/refunds",
        title: "Refund",
        type: "link",
      },
      {
        path: "/expense/agent-commision",
        title: "Agent commision",
        type: "link",
      },
      {
        path: "/expense/lot-transport",
        title: "Lot Transport",
        type: "link",
      },
      {
        title: "Loans",
        type: "sub",
        active: false,
        children: [
          {
            title: "Monthly",
            type: "link",
            path: "/expense/loans",
          },
          {
            title: "Customer wise",
            type: "link",
            path: "/expense/loans-by-customers",
          },
        ],
      },
      {
        path: "/expense/office",
        title: "Office",
        type: "link",
      },
      {
        path: "/expense/promotion",
        title: "Boosting/Promotion",
        type: "link",
      },
      {
        path: "/expense/monthly-installment",
        title: "Monthly Installment",
        type: "link",
      },
    ],
  },
  {
    title: "Cash in/out History",
    icon: Clock,
    color: "#f97316",
    type: "sub",
    active: false,
    children: [
      {
        path: "/expense/approve-expense",
        title: "Pending",
        type: "link",
      },
      {
        path: "/expense/expense-history",
        title: "Monthly",
        type: "link",
      },
      {
        path: "/expense/cnf",
        title: "CNF",
        type: "link",
      },
      {
        path: "/expense/partner",
        title: "Business Partner",
        type: "link",
      },
      {
        path: "/expense/office",
        title: "Office",
        type: "link",
      },
      {
        path: "/expense/promotion",
        title: "Boosting/Promotion",
        type: "link",
      },
      {
        path: "/expense/salary",
        title: "Salary",
        type: "link",
      },
      {
        path: "/expense/refunds",
        title: "Refund",
        type: "link",
      },
      {
        path: "/expense/agent-commision",
        title: "Agent commision",
        type: "link",
      },
      {
        path: "/expense/invest",
        title: "Invest",
        type: "link",
      },

      {
        path: "/expense/daily-cost",
        title: "Daily Cost",
        type: "link",
      },
      {
        path: "/expense/lot-transport",
        title: "Lot Transport",
        type: "link",
      },
      {
        title: "Loans",
        type: "sub",
        active: false,
        children: [
          {
            title: "Monthly",
            type: "link",
            path: "/expense/loans",
          },
          {
            title: "Customer wise",
            type: "link",
            path: "/expense/loans-by-customers",
          },
        ],
      },
      {
        path: "/expense/monthly-installment",
        title: "Monthly Installment",
        type: "link",
      },

      {
        path: "/expense/employee",
        title: "Employee",
        type: "link",
      },
      {
        path: "/expense/fund",
        title: "Fund",
        type: "link",
      },
    ],
  },
  {
    title: "Cash Summary",
    icon: PieChart,
    color: "#8b5cf6",
    type: "sub",
    active: false,
    children: [
      {
        path: "/cash-summary",
        title: "Monthly",
        type: "link",
      },
    ],
  },
  {
    title: "Receive Products CN",
    icon: Download,
    color: "#0ea5e9",
    type: "sub",
    active: false,
    children: [
      {
        path: "/products-physical/receive-products",
        title: "Receive Products CN",
        type: "link",
      },
    ],
  },
  {
    title: "Receive Products BD",
    icon: Inbox,
    color: "#14b8a6",
    type: "sub",
    active: false,
    children: [
      {
        path: "/products-physical/receive-products-bd",
        title: "Receive Products BD",
        type: "link",
      },
    ],
  },
  {
    title: "Products",
    icon: Package,
    color: "#e11d48",
    type: "sub",
    active: false,
    children: [
      {
        title: "in stock/pre order",
        type: "sub",
        active: false,
        children: [
          {
            path: "/products/home-category",
            title: "Home category",
            type: "link",
          },
          {
            path: "/products/physical/category",
            title: "Product List",
            type: "link",
          },

          {
            path: "/products/physical/add-aliexpress-product",
            title: "Add Product",
            type: "link",
          },
          {
            path: "/products/physical/banners",
            title: "Banners",
            type: "link",
          },
          {
            path: "/products/physical/intro-modal",
            title: "Intro Modal",
            type: "link",
          },
        ],
      },
    ],
  },
  {
    title: "Coupons",
    icon: Tag,
    color: "#ec4899",
    type: "sub",
    active: false,
    children: [
      {
        path: "/coupons/physical/all-coupons",
        title: "All Coupons",
        type: "link",
      },
    ],
  },
  {
    title: "Campaigns",
    icon: Send,
    color: "#a855f7",
    type: "sub",
    active: false,
    children: [
      {
        path: "/coupons/physical/all-campaigns",
        title: "All Campaigns",
        type: "link",
      },
    ],
  },

  {
    title: "1688/taobao Orders",
    icon: ShoppingCart,
    color: "#ef4444",
    type: "sub",
    active: false,
    children: [
      { path: "/1688-taobao-orders/new", title: "New Orders", type: "link" },
      {
        path: "/1688-taobao-orders/picked-orders",
        title: "Picked Orders",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/purchased",
        title: "Purchased",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/received-in-warehouse",
        title: "Abroad Warehouse",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/ready-for-fly",
        title: "Ready for fly",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/bangladesh-customs",
        title: "Bangladesh customs",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/custom-released",
        title: "Custom released",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/Paicart-warehouse",
        title: "Paicart warehouse",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/delivered",
        title: "Delivered",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/rejected",
        title: "Rejected",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/all-orders",
        title: "All Orders",
        type: "link",
      },
      {
        path: "/1688-orders/partial-payment",
        title: "Partial Payment",
        type: "link",
      },
      {
        path: "/1688-orders/site-discount",
        title: "Site Discount",
        type: "link",
      },
      {
        path: "/1688-orders/payment-link",
        title: "1688 Payment Link",
        type: "link",
      },
    ],
  },

  {
    title: "Business Consultancy",
    icon: Briefcase,
    color: "#0891b2",
    type: "sub",
    active: false,
    children: [
      {
        title: "Sourcing",
        type: "sub",
        active: false,
        children: [
          {
            title: "Sourcing Agents",
            type: "link",
            path: "/business-consultancy/sourcing-invoice-agents",
          },
        ],
      },
    ],
  },
  {
    title: "Product Request",
    icon: ShoppingBag,
    color: "#f59e0b",
    type: "sub",
    active: false,
    children: [
      { path: "/product-request/new", title: "New Requests", type: "link" },
      {
        path: "/product-request/rates-given",
        title: "Rates Provided",
        type: "link",
      },
      {
        path: "/product-request/purchased",
        title: "Purchased",
        type: "link",
      },
      {
        path: "/product-request/received-in-warehouse",
        title: "Abroad Warehouse",
        type: "link",
      },
      {
        path: "/product-request/ready-for-fly",
        title: "Ready for fly",
        type: "link",
      },
      {
        path: "/product-request/bangladesh-customs",
        title: "Bangladesh customs",
        type: "link",
      },
      {
        path: "/product-request/custom-released",
        title: "Custom released",
        type: "link",
      },
      {
        path: "/product-request/Paicart-warehouse",
        title: "Paicart warehouse",
        type: "link",
      },
      {
        path: "/product-request/delivered",
        title: "Delivered",
        type: "link",
      },
      {
        path: "/product-request/rejected",
        title: "Rejected",
        type: "link",
      },
      {
        path: "/product-request-payment",
        title: "Payment Batches",
        type: "link",
      },
    ],
  },
  {
    title: "Shipment Request",
    icon: Truck,
    color: "#3b82f6",
    type: "sub",
    active: false,
    children: [
      { path: "/shipment-request/new", title: "Pending", type: "link" },
      {
        path: "/shipment-request/rates-given",
        title: "Approved",
        type: "link",
      },
      {
        path: "/shipment-request/received-in-warehouse",
        title: "Abroad Warehouse",
        type: "link",
      },
      {
        path: "/shipment-request/ready-for-fly",
        title: "Ready for fly",
        type: "link",
      },

      {
        path: "/shipment-request/bangladesh-customs",
        title: "Bangladesh customs",
        type: "link",
      },
      {
        path: "/shipment-request/custom-released",
        title: "Custom released",
        type: "link",
      },
      {
        path: "/shipment-request/Paicart-warehouse",
        title: "Paicart warehouse",
        type: "link",
      },
      { path: "/shipment-request/delivered", title: "Delivered", type: "link" },
      { path: "/shipment-request/rejected", title: "Rejected", type: "link" },
    ],
  },
  {
    title: "Ship for me",
    icon: Anchor,
    color: "#0d9488",
    type: "sub",
    active: false,
    children: [
      {
        title: "Air",
        type: "sub",
        active: false,
        children: [
          { path: "/ship-for-me/air-china", title: "China", type: "link" },
          { path: "/ship-for-me-2/air-1688", title: "1688", type: "link" },
          { path: "/ship-for-me/air-india", title: "India", type: "link" },
          { path: "/ship-for-me/air-uk", title: "UK", type: "link" },
          { path: "/ship-for-me/air-usa", title: "USA", type: "link" },
          {
            path: "/ship-for-me/air-hongkong",
            title: "Hongkong",
            type: "link",
          },
          {
            path: "/ship-for-me/air-thailand",
            title: "Thailand",
            type: "link",
          },
        ],
      },
      {
        title: "Sea",
        type: "sub",
        active: false,
        children: [
          { path: "/ship-for-me/sea-china", title: "China", type: "link" },
          { path: "/ship-for-me-2/sea-1688", title: "1688", type: "link" },
          { path: "/ship-for-me/sea-uk", title: "UK", type: "link" },
          { path: "/ship-for-me/sea-usa", title: "USA", type: "link" },
          {
            path: "/ship-for-me/sea-hongkong",
            title: "Hongkong",
            type: "link",
          },
          {
            path: "/ship-for-me/sea-thailand",
            title: "Thailand",
            type: "link",
          },
        ],
      },
      {
        path: "/ship-for-me-warehouse",
        title: "Warehouse address",
        type: "link",
      },
    ],
  },
  {
    title: "Payment Request",
    icon: CreditCard,
    color: "#22c55e",
    type: "sub",
    active: false,
    children: [
      {
        path: "/payment-request/pending",
        title: "Ship for me Request",
        type: "link",
      },
      {
        path: "/payment-request-order/pending",
        title: "Order Request",
        type: "link",
      },

      {
        path: "/refund-request-order/pending",
        title: "Quick Refund Request",
        type: "link",
      },
      {
        path: "/after-sale-service/pending",
        title: "After sale service",
        type: "link",
      },
      {
        path: "/cargo-collection",
        title: "Cargo collection sheet",
        type: "link",
      },
    ],
  },
  {
    title: "Product to order",
    icon: Clipboard,
    color: "#6366f1",
    type: "sub",
    active: false,
    children: [
      {
        path: "/1688-taobao-orders/paid",
        title: "1688/Taobao Orders",
        type: "link",
      },
      {
        path: "/product-request/paid",
        title: "Product Request",
        type: "link",
      },
    ],
  },

  {
    title: "Notices",
    icon: Bell,
    color: "#eab308",
    type: "sub",
    active: false,
    children: [
      {
        path: "/notices",
        title: "All Notices",
        type: "link",
      },
    ],
  },

  {
    title: "Users",
    icon: Users,
    color: "#2563eb",
    type: "sub",
    active: false,
    children: [
      { path: "/users/list-user", title: "User List", type: "link" },
      // { path: '/users/create-user', title: 'Create User', type: 'link' },
    ],
  },

  {
    title: "Localization",
    icon: Globe,
    color: "#10b981",
    type: "sub",
    children: [
      {
        path: "/localization/currency-rates",
        title: "Currency Converter",
        type: "link",
      },
      {
        path: "/localization/shipping-charges",
        title: "Shipping charges",
        type: "link",
      },
      {
        path: "/localization/shipping-charge/add-product",
        title: "Add Product Shipping charge",
        type: "link",
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    color: "#64748b",
    type: "sub",
    children: [{ path: "/settings/profile", title: "Profile", type: "link" }],
  },

  {
    title: "Admins",
    icon: UserCheck,
    color: "#7c3aed",
    type: "sub",
    active: false,
    children: [
      { path: "/admins/list-admin", title: "All Admins", type: "link" },
      // { path: '/users/create-user', title: 'Create User', type: 'link' },
    ],
  },
  {
    path: "/complain",
    title: "Complain",
    icon: AlertTriangle,
    color: "#dc2626",
    type: "link",
    badgeType: "primary",
    active: false,
  },
  {
    title: "Register a manager",
    path: "/",
    icon: UserPlus,
    color: "#059669",
    type: "link",
    active: false,
  },
];

export const MENUITEMSFORPARTNER = [
  {
    path: "/dashboard",
    title: "Dashboard",
    icon: Home,
    color: "#4466f2",
    type: "link",
    badgeType: "primary",
    active: false,
  },
  {
    path: "/messages",
    title: "Messages",
    icon: MessageSquare,
    color: "#00b8d9",
    type: "link",
    badgeType: "primary",
    active: false,
  },

  {
    title: "Cash in/Cash out",
    icon: DollarSign,
    color: "#16a34a",
    type: "sub",
    active: false,
    children: [
      {
        path: "/expense/daily-expense",
        title: new Date().toDateString(),
        type: "link",
      },
      {
        path: "/expense/expense-history",
        title: "History",
        type: "link",
      },
      {
        path: "/expense/salary",
        title: "Salary",
        type: "link",
      },
      {
        path: "/expense/refunds",
        title: "Refund",
        type: "link",
      },
      {
        path: "/expense/agent-commision",
        title: "Agent commision",
        type: "link",
      },
      {
        path: "/expense/lot-transport",
        title: "Lot Transport",
        type: "link",
      },
      {
        title: "Loans",
        type: "sub",
        active: false,
        children: [
          {
            title: "Monthly",
            type: "link",
            path: "/expense/loans",
          },
          {
            title: "Customer wise",
            type: "link",
            path: "/expense/loans-by-customers",
          },
        ],
      },
      {
        path: "/expense/office",
        title: "Office",
        type: "link",
      },
      {
        path: "/expense/promotion",
        title: "Boosting/Promotion",
        type: "link",
      },
      {
        path: "/expense/monthly-installment",
        title: "Monthly Installment",
        type: "link",
      },
    ],
  },
  {
    title: "Cash in/out History",
    icon: Clock,
    color: "#f97316",
    type: "sub",
    active: false,
    children: [
      {
        path: "/expense/approve-expense",
        title: "Pending",
        type: "link",
      },
      {
        path: "/expense/expense-history",
        title: "Monthly",
        type: "link",
      },
      {
        path: "/expense/cnf",
        title: "CNF",
        type: "link",
      },
      {
        path: "/expense/office",
        title: "Office",
        type: "link",
      },
      {
        path: "/expense/promotion",
        title: "Boosting/Promotion",
        type: "link",
      },
      {
        path: "/expense/salary",
        title: "Salary",
        type: "link",
      },
      {
        path: "/expense/refunds",
        title: "Refund",
        type: "link",
      },
      {
        path: "/expense/agent-commision",
        title: "Agent commision",
        type: "link",
      },
      {
        path: "/expense/invest",
        title: "Invest",
        type: "link",
      },

      {
        path: "/expense/daily-cost",
        title: "Daily Cost",
        type: "link",
      },
      {
        path: "/expense/lot-transport",
        title: "Lot Transport",
        type: "link",
      },
      {
        title: "Loans",
        type: "sub",
        active: false,
        children: [
          {
            title: "Monthly",
            type: "link",
            path: "/expense/loans",
          },
          {
            title: "Customer wise",
            type: "link",
            path: "/expense/loans-by-customers",
          },
        ],
      },
      {
        path: "/expense/monthly-installment",
        title: "Monthly Installment",
        type: "link",
      },

      {
        path: "/expense/employee",
        title: "Employee",
        type: "link",
      },
      {
        path: "/expense/fund",
        title: "Fund",
        type: "link",
      },
    ],
  },
  {
    title: "Cash Summary",
    icon: PieChart,
    color: "#8b5cf6",
    type: "sub",
    active: false,
    children: [
      {
        path: "/cash-summary",
        title: "Monthly",
        type: "link",
      },
    ],
  },
  {
    title: "Products",
    icon: Package,
    color: "#e11d48",
    type: "sub",
    active: false,
    children: [
      {
        title: "in stock/pre order",
        type: "sub",
        active: false,
        children: [
          {
            path: "/products/home-category",
            title: "Home category",
            type: "link",
          },
          {
            path: "/products/physical/category",
            title: "Product List",
            type: "link",
          },

          {
            path: "/products/physical/add-aliexpress-product",
            title: "Add Product",
            type: "link",
          },
          {
            path: "/products/physical/banners",
            title: "Banners",
            type: "link",
          },
          {
            path: "/products/physical/intro-modal",
            title: "Intro Modal",
            type: "link",
          },
        ],
      },
    ],
  },
  {
    title: "Coupons",
    icon: Tag,
    color: "#ec4899",
    type: "sub",
    active: false,
    children: [
      {
        path: "/coupons/physical/all-coupons",
        title: "All Coupons",
        type: "link",
      },
    ],
  },
  {
    title: "Campaigns",
    icon: Send,
    color: "#a855f7",
    type: "sub",
    active: false,
    children: [
      {
        path: "/coupons/physical/all-campaigns",
        title: "All Campaigns",
        type: "link",
      },
    ],
  },

  {
    title: "1688/taobao Orders",
    icon: ShoppingCart,
    color: "#ef4444",
    type: "sub",
    active: false,
    children: [
      { path: "/1688-taobao-orders/new", title: "New Orders", type: "link" },
      {
        path: "/1688-taobao-orders/picked-orders",
        title: "Picked Orders",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/purchased",
        title: "Purchased",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/received-in-warehouse",
        title: "Abroad Warehouse",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/ready-for-fly",
        title: "Ready for fly",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/bangladesh-customs",
        title: "Bangladesh customs",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/custom-released",
        title: "Custom released",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/Paicart-warehouse",
        title: "Paicart warehouse",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/delivered",
        title: "Delivered",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/rejected",
        title: "Rejected",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/all-orders",
        title: "All Orders",
        type: "link",
      },
      {
        path: "/1688-orders/partial-payment",
        title: "Partial Payment",
        type: "link",
      },
      {
        path: "/1688-orders/site-discount",
        title: "Site Discount",
        type: "link",
      },
      {
        path: "/1688-orders/payment-link",
        title: "1688 Payment Link",
        type: "link",
      },
    ],
  },

  {
    title: "Business Consultancy",
    icon: Briefcase,
    color: "#0891b2",
    type: "sub",
    active: false,
    children: [
      {
        title: "Sourcing",
        type: "sub",
        active: false,
        children: [
          {
            title: "Sourcing Agents",
            type: "link",
            path: "/business-consultancy/sourcing-invoice-agents",
          },
        ],
      },
    ],
  },
  {
    title: "Product Request",
    icon: ShoppingBag,
    color: "#f59e0b",
    type: "sub",
    active: false,
    children: [
      { path: "/product-request/new", title: "New Requests", type: "link" },
      {
        path: "/product-request/rates-given",
        title: "Rates Provided",
        type: "link",
      },
      {
        path: "/product-request/purchased",
        title: "Purchased",
        type: "link",
      },
      {
        path: "/product-request/received-in-warehouse",
        title: "Abroad Warehouse",
        type: "link",
      },
      {
        path: "/product-request/ready-for-fly",
        title: "Ready for fly",
        type: "link",
      },
      {
        path: "/product-request/bangladesh-customs",
        title: "Bangladesh customs",
        type: "link",
      },
      {
        path: "/product-request/custom-released",
        title: "Custom released",
        type: "link",
      },
      {
        path: "/product-request/Paicart-warehouse",
        title: "Paicart warehouse",
        type: "link",
      },
      {
        path: "/product-request/delivered",
        title: "Delivered",
        type: "link",
      },
      {
        path: "/product-request/rejected",
        title: "Rejected",
        type: "link",
      },
      {
        path: "/product-request-payment",
        title: "Payment Batches",
        type: "link",
      },
    ],
  },
  {
    title: "Shipment Request",
    icon: Truck,
    color: "#3b82f6",
    type: "sub",
    active: false,
    children: [
      { path: "/shipment-request/new", title: "Pending", type: "link" },
      {
        path: "/shipment-request/rates-given",
        title: "Approved",
        type: "link",
      },
      {
        path: "/shipment-request/received-in-warehouse",
        title: "Abroad Warehouse",
        type: "link",
      },
      {
        path: "/shipment-request/ready-for-fly",
        title: "Ready for fly",
        type: "link",
      },

      {
        path: "/shipment-request/bangladesh-customs",
        title: "Bangladesh customs",
        type: "link",
      },
      {
        path: "/shipment-request/custom-released",
        title: "Custom released",
        type: "link",
      },
      {
        path: "/shipment-request/Paicart-warehouse",
        title: "Paicart warehouse",
        type: "link",
      },
      { path: "/shipment-request/delivered", title: "Delivered", type: "link" },
      { path: "/shipment-request/rejected", title: "Rejected", type: "link" },
    ],
  },
  {
    title: "Ship for me",
    icon: Anchor,
    color: "#0d9488",
    type: "sub",
    active: false,
    children: [
      {
        title: "Air",
        type: "sub",
        active: false,
        children: [
          { path: "/ship-for-me/air-china", title: "China", type: "link" },
          { path: "/ship-for-me-2/air-1688", title: "1688", type: "link" },
          { path: "/ship-for-me/air-india", title: "India", type: "link" },
          { path: "/ship-for-me/air-uk", title: "UK", type: "link" },
          { path: "/ship-for-me/air-usa", title: "USA", type: "link" },
          {
            path: "/ship-for-me/air-hongkong",
            title: "Hongkong",
            type: "link",
          },
          {
            path: "/ship-for-me/air-thailand",
            title: "Thailand",
            type: "link",
          },
        ],
      },
      {
        title: "Sea",
        type: "sub",
        active: false,
        children: [
          { path: "/ship-for-me/sea-china", title: "China", type: "link" },
          { path: "/ship-for-me-2/sea-1688", title: "1688", type: "link" },
          { path: "/ship-for-me/sea-uk", title: "UK", type: "link" },
          { path: "/ship-for-me/sea-usa", title: "USA", type: "link" },
          {
            path: "/ship-for-me/sea-hongkong",
            title: "Hongkong",
            type: "link",
          },
          {
            path: "/ship-for-me/sea-thailand",
            title: "Thailand",
            type: "link",
          },
        ],
      },
      {
        path: "/ship-for-me-warehouse",
        title: "Warehouse address",
        type: "link",
      },
    ],
  },
  {
    title: "Payment Request",
    icon: CreditCard,
    color: "#22c55e",
    type: "sub",
    active: false,
    children: [
      {
        path: "/payment-request/pending",
        title: "Ship for me Request",
        type: "link",
      },
      {
        path: "/payment-request-order/pending",
        title: "Order Request",
        type: "link",
      },

      {
        path: "/refund-request-order/pending",
        title: "Quick Refund Request",
        type: "link",
      },
      {
        path: "/after-sale-service/pending",
        title: "After sale service",
        type: "link",
      },
      {
        path: "/cargo-collection",
        title: "Cargo collection sheet",
        type: "link",
      },
    ],
  },
  {
    title: "Product to order",
    icon: Clipboard,
    color: "#6366f1",
    type: "sub",
    active: false,
    children: [
      {
        path: "/1688-taobao-orders/paid",
        title: "1688/Taobao Orders",
        type: "link",
      },
      {
        path: "/product-request/paid",
        title: "Product Request",
        type: "link",
      },
    ],
  },

  {
    title: "Notices",
    icon: Bell,
    color: "#eab308",
    type: "sub",
    active: false,
    children: [
      {
        path: "/notices",
        title: "All Notices",
        type: "link",
      },
    ],
  },

  {
    title: "Localization",
    icon: Globe,
    color: "#10b981",
    type: "sub",
    children: [
      {
        path: "/localization/currency-rates",
        title: "Currency Converter",
        type: "link",
      },
      {
        path: "/localization/shipping-charges",
        title: "Shipping charges",
        type: "link",
      },
      {
        path: "/localization/shipping-charge/add-product",
        title: "Add Product Shipping charge",
        type: "link",
      },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    color: "#64748b",
    type: "sub",
    children: [{ path: "/settings/profile", title: "Profile", type: "link" }],
  },

  {
    title: "Admins",
    icon: UserCheck,
    color: "#7c3aed",
    type: "sub",
    active: false,
    children: [
      { path: "/admins/list-admin", title: "All Admins", type: "link" },
      // { path: '/users/create-user', title: 'Create User', type: 'link' },
    ],
  },
];
export const MENUITEMSFORACCOUNTS = [
  {
    path: "/dashboard",
    title: "Dashboard",
    icon: Home,
    color: "#4466f2",
    type: "link",
    badgeType: "primary",
    active: false,
  },

  {
    title: "Cash in/Cash out",
    icon: DollarSign,
    color: "#16a34a",
    type: "sub",
    active: false,
    children: [
      {
        path: "/expense/daily-expense",
        title: new Date().toDateString(),
        type: "link",
      },
      {
        path: "/expense/expense-history",
        title: "History",
        type: "link",
      },
      {
        path: "/expense/salary",
        title: "Salary",
        type: "link",
      },
      {
        path: "/expense/refunds",
        title: "Refund",
        type: "link",
      },
      {
        path: "/expense/agent-commision",
        title: "Agent commision",
        type: "link",
      },
      {
        path: "/expense/lot-transport",
        title: "Lot Transport",
        type: "link",
      },
      {
        title: "Loans",
        type: "sub",
        active: false,
        children: [
          {
            title: "Monthly",
            type: "link",
            path: "/expense/loans",
          },
          {
            title: "Customer wise",
            type: "link",
            path: "/expense/loans-by-customers",
          },
        ],
      },
      {
        path: "/expense/office",
        title: "Office",
        type: "link",
      },
      {
        path: "/expense/promotion",
        title: "Boosting/Promotion",
        type: "link",
      },
      {
        path: "/expense/monthly-installment",
        title: "Monthly Installment",
        type: "link",
      },
    ],
  },

  {
    title: "Cash Summary",
    icon: PieChart,
    color: "#8b5cf6",
    type: "sub",
    active: false,
    children: [
      {
        path: "/cash-summary",
        title: "Monthly",
        type: "link",
      },
    ],
  },

  {
    title: "Business Consultancy",
    icon: Briefcase,
    color: "#0891b2",
    type: "sub",
    active: false,
    children: [
      {
        title: "Sourcing",
        type: "sub",
        active: false,
        children: [
          {
            title: "Sourcing Agents",
            type: "link",
            path: "/business-consultancy/sourcing-invoice-agents",
          },
        ],
      },
    ],
  },

  {
    title: "Payment Request",
    icon: CreditCard,
    color: "#22c55e",
    type: "sub",
    active: false,
    children: [
      {
        path: "/payment-request/pending",
        title: "Ship for me Request",
        type: "link",
      },
      {
        path: "/payment-request-order/pending",
        title: "Order Request",
        type: "link",
      },

      {
        path: "/refund-request-order/pending",
        title: "Quick Refund Request",
        type: "link",
      },
      {
        path: "/after-sale-service/pending",
        title: "After sale service",
        type: "link",
      },
      {
        path: "/cargo-collection",
        title: "Cargo collection sheet",
        type: "link",
      },
    ],
  },
];

export const MENUITEMSFOREMPLOYEE = [
  {
    path: "/dashboard",
    title: "Dashboard",
    icon: Home,
    color: "#4466f2",
    type: "link",
    badgeType: "primary",
    active: false,
  },
  {
    path: "/messages",
    title: "Messages",
    icon: MessageSquare,
    color: "#00b8d9",
    type: "link",
    badgeType: "primary",
    active: false,
  },
  {
    title: "Products",
    icon: Package,
    color: "#e11d48",
    type: "sub",
    active: false,
    children: [
      {
        title: "in stock/pre order",
        type: "sub",
        active: false,
        children: [
          {
            path: "/products/home-category",
            title: "Home category",
            type: "link",
          },
          {
            path: "/products/physical/category",
            title: "Product List",
            type: "link",
          },

          {
            path: "/products/physical/add-aliexpress-product",
            title: "Add Product",
            type: "link",
          },
          {
            path: "/products/physical/banners",
            title: "Banners",
            type: "link",
          },
          {
            path: "/products/physical/intro-modal",
            title: "Intro Modal",
            type: "link",
          },
        ],
      },
    ],
  },
  {
    title: "Coupons",
    icon: Tag,
    color: "#ec4899",
    type: "sub",
    active: false,
    children: [
      {
        path: "/coupons/physical/all-coupons",
        title: "All Coupons",
        type: "link",
      },
    ],
  },
  {
    title: "Campaigns",
    icon: Send,
    color: "#a855f7",
    type: "sub",
    active: false,
    children: [
      {
        path: "/coupons/physical/all-campaigns",
        title: "All Campaigns",
        type: "link",
      },
    ],
  },

  {
    title: "Ship for me",
    icon: Anchor,
    color: "#0d9488",
    type: "sub",
    active: false,
    children: [
      {
        title: "Air",
        type: "sub",
        active: false,
        children: [
          { path: "/ship-for-me/air-china", title: "China", type: "link" },
          { path: "/ship-for-me-2/air-1688", title: "1688", type: "link" },
          { path: "/ship-for-me/air-india", title: "India", type: "link" },
          { path: "/ship-for-me/air-uk", title: "UK", type: "link" },
          { path: "/ship-for-me/air-usa", title: "USA", type: "link" },
          {
            path: "/ship-for-me/air-hongkong",
            title: "Hongkong",
            type: "link",
          },
          {
            path: "/ship-for-me/air-thailand",
            title: "Thailand",
            type: "link",
          },
        ],
      },
      {
        title: "Sea",
        type: "sub",
        active: false,
        children: [
          { path: "/ship-for-me/sea-china", title: "China", type: "link" },
          { path: "/ship-for-me-2/sea-1688", title: "1688", type: "link" },
          { path: "/ship-for-me/sea-uk", title: "UK", type: "link" },
          { path: "/ship-for-me/sea-usa", title: "USA", type: "link" },
          {
            path: "/ship-for-me/sea-hongkong",
            title: "Hongkong",
            type: "link",
          },
          {
            path: "/ship-for-me/sea-thailand",
            title: "Thailand",
            type: "link",
          },
        ],
      },
      {
        path: "/ship-for-me-warehouse",
        title: "Warehouse address",
        type: "link",
      },
    ],
  },

  {
    title: "Notices",
    icon: Bell,
    color: "#eab308",
    type: "sub",
    active: false,
    children: [
      {
        path: "/notices",
        title: "All Notices",
        type: "link",
      },
    ],
  },
  {
    title: "Receive Products CN",
    icon: Download,
    color: "#0ea5e9",
    type: "sub",
    active: false,
    children: [
      {
        path: "/products-physical/receive-products",
        title: "Receive Products CN",
        type: "link",
      },
    ],
  },
  {
    title: "Receive Products BD",
    icon: Inbox,
    color: "#14b8a6",
    type: "sub",
    active: false,
    children: [
      {
        path: "/products-physical/receive-products-bd",
        title: "Receive Products BD",
        type: "link",
      },
    ],
  },
];

export const MENUITEMSFOROFFICER = [
  {
    path: "/dashboard",
    title: "Dashboard",
    icon: Home,
    color: "#4466f2",
    type: "link",
    badgeType: "primary",
    active: false,
  },
  {
    path: "/messages",
    title: "Messages",
    icon: MessageSquare,
    color: "#00b8d9",
    type: "link",
    badgeType: "primary",
    active: false,
  },

  {
    title: "1688/taobao Orders",
    icon: ShoppingCart,
    color: "#ef4444",
    type: "sub",
    active: false,
    children: [
      { path: "/1688-taobao-orders/new", title: "New Orders", type: "link" },
      {
        path: "/1688-taobao-orders/picked-orders",
        title: "Picked Orders",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/purchased",
        title: "Purchased",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/received-in-warehouse",
        title: "Abroad Warehouse",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/ready-for-fly",
        title: "Ready for fly",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/bangladesh-customs",
        title: "Bangladesh customs",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/custom-released",
        title: "Custom released",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/Paicart-warehouse",
        title: "Paicart warehouse",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/delivered",
        title: "Delivered",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/rejected",
        title: "Rejected",
        type: "link",
      },
      {
        path: "/1688-taobao-orders/all-orders",
        title: "All Orders",
        type: "link",
      },
      {
        path: "/1688-orders/partial-payment",
        title: "Partial Payment",
        type: "link",
      },
      {
        path: "/1688-orders/site-discount",
        title: "Site Discount",
        type: "link",
      },
      {
        path: "/1688-orders/payment-link",
        title: "1688 Payment Link",
        type: "link",
      },
    ],
  },

  {
    title: "Business Consultancy",
    icon: Briefcase,
    color: "#0891b2",
    type: "sub",
    active: false,
    children: [
      {
        title: "Sourcing",
        type: "sub",
        active: false,
        children: [
          {
            title: "Sourcing Agents",
            type: "link",
            path: "/business-consultancy/sourcing-invoice-agents",
          },
        ],
      },
    ],
  },
  {
    title: "Product Request",
    icon: ShoppingBag,
    color: "#f59e0b",
    type: "sub",
    active: false,
    children: [
      { path: "/product-request/new", title: "New Requests", type: "link" },
      {
        path: "/product-request/rates-given",
        title: "Rates Provided",
        type: "link",
      },
      {
        path: "/product-request/purchased",
        title: "Purchased",
        type: "link",
      },
      {
        path: "/product-request/received-in-warehouse",
        title: "Abroad Warehouse",
        type: "link",
      },
      {
        path: "/product-request/ready-for-fly",
        title: "Ready for fly",
        type: "link",
      },
      {
        path: "/product-request/bangladesh-customs",
        title: "Bangladesh customs",
        type: "link",
      },
      {
        path: "/product-request/custom-released",
        title: "Custom released",
        type: "link",
      },
      {
        path: "/product-request/Paicart-warehouse",
        title: "Paicart warehouse",
        type: "link",
      },
      {
        path: "/product-request/delivered",
        title: "Delivered",
        type: "link",
      },
      {
        path: "/product-request/rejected",
        title: "Rejected",
        type: "link",
      },
      {
        path: "/product-request-payment",
        title: "Payment Batches",
        type: "link",
      },
    ],
  },
  {
    title: "Shipment Request",
    icon: Truck,
    color: "#3b82f6",
    type: "sub",
    active: false,
    children: [
      { path: "/shipment-request/new", title: "Pending", type: "link" },
      {
        path: "/shipment-request/rates-given",
        title: "Approved",
        type: "link",
      },
      {
        path: "/shipment-request/received-in-warehouse",
        title: "Abroad Warehouse",
        type: "link",
      },
      {
        path: "/shipment-request/ready-for-fly",
        title: "Ready for fly",
        type: "link",
      },

      {
        path: "/shipment-request/bangladesh-customs",
        title: "Bangladesh customs",
        type: "link",
      },
      {
        path: "/shipment-request/custom-released",
        title: "Custom released",
        type: "link",
      },
      {
        path: "/shipment-request/Paicart-warehouse",
        title: "Paicart warehouse",
        type: "link",
      },
      { path: "/shipment-request/delivered", title: "Delivered", type: "link" },
      { path: "/shipment-request/rejected", title: "Rejected", type: "link" },
    ],
  },
  {
    title: "Ship for me",
    icon: Anchor,
    color: "#0d9488",
    type: "sub",
    active: false,
    children: [
      {
        title: "Air",
        type: "sub",
        active: false,
        children: [
          { path: "/ship-for-me/air-china", title: "China", type: "link" },
          { path: "/ship-for-me-2/air-1688", title: "1688", type: "link" },
          { path: "/ship-for-me/air-india", title: "India", type: "link" },
          { path: "/ship-for-me/air-uk", title: "UK", type: "link" },
          { path: "/ship-for-me/air-usa", title: "USA", type: "link" },
          {
            path: "/ship-for-me/air-hongkong",
            title: "Hongkong",
            type: "link",
          },
          {
            path: "/ship-for-me/air-thailand",
            title: "Thailand",
            type: "link",
          },
        ],
      },
      {
        title: "Sea",
        type: "sub",
        active: false,
        children: [
          { path: "/ship-for-me/sea-china", title: "China", type: "link" },
          { path: "/ship-for-me-2/sea-1688", title: "1688", type: "link" },
          { path: "/ship-for-me/sea-uk", title: "UK", type: "link" },
          { path: "/ship-for-me/sea-usa", title: "USA", type: "link" },
          {
            path: "/ship-for-me/sea-hongkong",
            title: "Hongkong",
            type: "link",
          },
          {
            path: "/ship-for-me/sea-thailand",
            title: "Thailand",
            type: "link",
          },
        ],
      },
      {
        path: "/ship-for-me-warehouse",
        title: "Warehouse address",
        type: "link",
      },
    ],
  },
  {
    title: "Localization",
    icon: Globe,
    color: "#10b981",
    type: "sub",
    children: [
      {
        path: "/localization/currency-rates",
        title: "Currency Converter",
        type: "link",
      },
      {
        path: "/localization/shipping-charges",
        title: "Shipping charges",
        type: "link",
      },
      {
        path: "/localization/shipping-charge/add-product",
        title: "Add Product Shipping charge",
        type: "link",
      },
    ],
  },
];
