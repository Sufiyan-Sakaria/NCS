import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  numeric,
  uniqueIndex,
  foreignKey,
  pgEnum,
} from "drizzle-orm/pg-core";

// Define the enums for better type safety
export const userRoleEnum = pgEnum("user_role", ["Admin", "User"]);
export const accountTypeEnum = pgEnum("account_type", [
  "Bank",
  "Cash",
  "Receivable",
  "Payable",
  "Expense",
  "Income",
  "Capital",
]);
export const accountGroupTypeEnum = pgEnum("account_group_type", [
  "Asset",
  "Liability",
  "Equity",
  "Revenue",
  "Expense",
]);
export const voucherTypeEnum = pgEnum("voucher_type", [
  "Payment",
  "Receipt",
  "Journal",
  "Contra",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "Debit",
  "Credit",
]);
export const invoiceTypeEnum = pgEnum("invoice_type", ["Sale", "Purchase"]);
export const returnTypeEnum = pgEnum("return_type", ["Sale", "Purchase"]);
export const currencyEnum = pgEnum("currency", ["PKR", "USD", "EUR", "GBP"]);
export const itemTransactionTypeEnum = pgEnum("item_transaction_type", [
  "Opening",
  "Purchase",
  "Sale",
  "PurchaseReturn",
  "SaleReturn",
  "Adjustment",
  "Transfer",
]);

// Define the Users table with snake_case for PostgreSQL
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("User").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Define the Brands table
export const brandsTable = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Define the Categories table
export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Define the AccountGroup table
export const accountGroupTable = pgTable(
  "account_groups",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: varchar("name", { length: 255 }).unique().notNull(),
    code: varchar("code", { length: 255 }).unique().notNull(),
    parent_id: varchar("parent_id", { length: 255 }),
    description: text("description"),
    type: accountGroupTypeEnum("type").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      parentFk: foreignKey({
        columns: [table.parent_id],
        foreignColumns: [table.id],
        name: "account_group_parent_child_fk",
      }),
    };
  }
);

// Define the Account table
export const accountsTable = pgTable(
  "accounts",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: varchar("name", { length: 255 }).unique().notNull(),
    code: varchar("code", { length: 255 }).unique().notNull(),
    group_id: varchar("group_id", { length: 255 }).notNull(),
    account_type: accountTypeEnum("account_type").notNull(),
    opening_balance: numeric("opening_balance").default("0").notNull(),
    current_balance: numeric("current_balance").default("0").notNull(),
    currency: currencyEnum("currency").default("PKR").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      groupFk: foreignKey({
        columns: [table.group_id],
        foreignColumns: [accountGroupTable.id],
        name: "account_group_relation_fk",
      }),
    };
  }
);

// Define the Voucher table
export const vouchersTable = pgTable(
  "vouchers",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    voucher_type: voucherTypeEnum("voucher_type").notNull(),
    voucher_no: integer("voucher_no").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    description: text("description"),
    total_amount: numeric("total_amount").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      voucherUnique: uniqueIndex("voucher_type_no_unique").on(
        table.voucher_type,
        table.voucher_no
      ),
    };
  }
);

// Define the Invoice table
export const invoicesTable = pgTable(
  "invoices",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    invoice_no: varchar("invoice_no", { length: 255 }).unique().notNull(),
    date: timestamp("date").defaultNow().notNull(),
    account_id: varchar("account_id", { length: 255 }).notNull(),
    total_amount: numeric("total_amount").notNull(),
    description: text("description"),
    type: invoiceTypeEnum("type").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      accountFk: foreignKey({
        columns: [table.account_id],
        foreignColumns: [accountsTable.id],
        name: "account_invoice_fk",
      }),
    };
  }
);

// Define the Return table
export const returnsTable = pgTable(
  "returns",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    return_no: varchar("return_no", { length: 255 }).unique().notNull(),
    date: timestamp("date").defaultNow().notNull(),
    account_id: varchar("account_id", { length: 255 }).notNull(),
    total_amount: numeric("total_amount").notNull(),
    description: text("description"),
    type: returnTypeEnum("type").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      accountFk: foreignKey({
        columns: [table.account_id],
        foreignColumns: [accountsTable.id],
        name: "account_return_fk",
      }),
    };
  }
);

// Define the Ledger table
export const ledgersTable = pgTable(
  "ledgers",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    date: timestamp("date").notNull(),
    account_id: varchar("account_id", { length: 255 }).notNull(),
    voucher_id: varchar("voucher_id", { length: 255 }),
    return_id: varchar("return_id", { length: 255 }),
    invoice_id: varchar("invoice_id", { length: 255 }),
    transaction_type: transactionTypeEnum("transaction_type").notNull(),
    amount: numeric("amount").notNull(),
    description: text("description"),
    previous_balance: numeric("previous_balance"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      accountFk: foreignKey({
        columns: [table.account_id],
        foreignColumns: [accountsTable.id],
        name: "account_ledger_fk",
      }),
      voucherFk: foreignKey({
        columns: [table.voucher_id],
        foreignColumns: [vouchersTable.id],
        name: "ledger_voucher_fk",
      }),
      returnFk: foreignKey({
        columns: [table.return_id],
        foreignColumns: [returnsTable.id],
        name: "return_ledger_fk",
      }),
      invoiceFk: foreignKey({
        columns: [table.invoice_id],
        foreignColumns: [invoicesTable.id],
        name: "invoice_ledger_fk",
      }),
    };
  }
);

// Define the Product table
export const productsTable = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).unique().notNull(),
    description: text("description"),
    brand_id: integer("brand_id").notNull(),
    category_id: integer("category_id").notNull(),
    unit: varchar("unit", { length: 50 }).default("PCS").notNull(),
    price: numeric("price").default("0").notNull(),
    cost_price: numeric("cost_price").default("0").notNull(),
    thaan: numeric("thaan").default("0").notNull(),
    quantity: numeric("quantity").default("0").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      brandFk: foreignKey({
        columns: [table.brand_id],
        foreignColumns: [brandsTable.id],
        name: "product_brand_fk",
      }),
      categoryFk: foreignKey({
        columns: [table.category_id],
        foreignColumns: [categoriesTable.id],
        name: "product_category_fk",
      }),
    };
  }
);

// Define the InvoiceItem table
export const invoiceItemsTable = pgTable(
  "invoice_items",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    product_id: integer("product_id").notNull(),
    quantity: numeric("quantity").notNull(),
    thaan: numeric("thaan").default("0").notNull(),
    unit_price: numeric("unit_price").notNull(),
    total_amount: numeric("total_amount").notNull(),
    invoice_id: varchar("invoice_id", { length: 255 }).notNull(),
    godown_id: integer("godown_id").notNull(), // Add this field
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      productFk: foreignKey({
        columns: [table.product_id],
        foreignColumns: [productsTable.id],
        name: "product_invoice_item_fk",
      }),
      invoiceFk: foreignKey({
        columns: [table.invoice_id],
        foreignColumns: [invoicesTable.id],
        name: "invoice_invoice_item_fk",
      }),
      godownFk: foreignKey({
        columns: [table.godown_id],
        foreignColumns: [godownsTable.id],
        name: "godown_invoice_item_fk",
      }),
    };
  }
);

// Define the ReturnItem table
export const returnItemsTable = pgTable(
  "return_items",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    product_id: integer("product_id").notNull(),
    quantity: numeric("quantity").notNull(),
    unit_price: numeric("unit_price").notNull(),
    total_amount: numeric("total_amount").notNull(),
    return_id: varchar("return_id", { length: 255 }).notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      productFk: foreignKey({
        columns: [table.product_id],
        foreignColumns: [productsTable.id],
        name: "product_return_item_fk",
      }),
      returnFk: foreignKey({
        columns: [table.return_id],
        foreignColumns: [returnsTable.id],
        name: "return_return_item_fk",
      }),
    };
  }
);

export const godownsTable = pgTable("godowns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  location: text("location").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const productLocationsTable = pgTable(
  "product_locations",
  {
    id: serial("id").primaryKey(),
    product_id: integer("product_id").notNull(),
    godown_id: integer("godown_id").notNull(),
    quantity: numeric("quantity").default("0").notNull(),
    thaan: numeric("thaan").default("0").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      productFk: foreignKey({
        columns: [table.product_id],
        foreignColumns: [productsTable.id],
        name: "product_location_fk",
      }),
      godownFk: foreignKey({
        columns: [table.godown_id],
        foreignColumns: [godownsTable.id],
        name: "godown_location_fk",
      }),
    };
  }
);

// Define the ItemLedger table
export const itemLedgersTable = pgTable(
  "item_ledgers",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    date: timestamp("date").defaultNow().notNull(),
    product_id: integer("product_id").notNull(),
    godown_id: integer("godown_id").notNull(),
    transaction_type: itemTransactionTypeEnum("transaction_type").notNull(),
    quantity_in: numeric("quantity_in").default("0").notNull(),
    quantity_out: numeric("quantity_out").default("0").notNull(),
    thaan_in: numeric("thaan_in").default("0").notNull(),
    thaan_out: numeric("thaan_out").default("0").notNull(),
    unit_price: numeric("unit_price").default("0").notNull(),
    total_amount: numeric("total_amount").default("0").notNull(),
    invoice_id: varchar("invoice_id", { length: 255 }),
    return_id: varchar("return_id", { length: 255 }),
    previous_quantity: numeric("previous_quantity").default("0").notNull(),
    previous_thaan: numeric("previous_thaan").default("0").notNull(),
    description: text("description"),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      productFk: foreignKey({
        columns: [table.product_id],
        foreignColumns: [productsTable.id],
        name: "product_item_ledger_fk",
      }),
      godownFk: foreignKey({
        columns: [table.godown_id],
        foreignColumns: [godownsTable.id],
        name: "godown_item_ledger_fk",
      }),
      invoiceFk: foreignKey({
        columns: [table.invoice_id],
        foreignColumns: [invoicesTable.id],
        name: "invoice_item_ledger_fk",
      }),
      returnFk: foreignKey({
        columns: [table.return_id],
        foreignColumns: [returnsTable.id],
        name: "return_item_ledger_fk",
      }),
    };
  }
);
