# **Account Web Application**

## **Overview**

The **Account Web Application** is a comprehensive full-stack solution designed for efficient management of users, brands, categories, accounts, vouchers, and account ledgers. The backend includes extended functionality for invoices, products, and godowns, which are scheduled for frontend integration in the next release.

## **Version: v0.1**

This initial release establishes the foundational features across both the frontend and backend components.

## **Features**

### **Backend**

- Secure user authentication and authorization
- Comprehensive brand management
- Efficient category management
- Seamless account handling
- Robust voucher system
- Detailed account ledger management
- **New:** Invoice management
- **New:** Product management
- **New:** Godown management

### **Frontend**

- User authentication and authorization
- Brand management
- Category management
- Account handling
- Voucher system
- Account ledger

> **Upcoming Enhancements in the Next Release:** Frontend integration for Invoices, Products, and Godown management, along with additional features such as Returns and more.

## **Technology Stack**

- **Frontend:** React (TypeScript), Redux, Axios, TailwindCSS
- **Backend:** Node.js, Express, Sequelize (PostgreSQL)
- **Database:** PostgreSQL

## **Installation Guide**

### **Backend Setup**

1. Clone the repository:
   ```sh
   git clone (https://github.com/Sufiyan-Sakaria/NCS.git)
   cd backend
   ```
2. Install dependencies:
   ```sh
   bun install
   ```
3. Configure environment variables in the `.env` file.
4. Start the backend server:
   ```sh
   bun start
   ```

### **Frontend Setup**

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   bun install
   ```
3. Launch the development server:
   ```sh
   bun run dev
   ```

## **Release Notes (v0.1)**

### **Backend Enhancements:**

- Introduced invoice management.
- Implemented product management.
- Added godown management.

### **Frontend Features:**

- User authentication module.
- Core modules for brand, category, account, voucher, and ledger management.

### **Upcoming Features:**

- Frontend integration for Invoice, Product, and Godown management.
- Additional functionalities, including Returns and extended ledger operations.

## **License**

This project is licensed under the **MIT License**.

---

We welcome contributions and suggestions for further enhancements!
