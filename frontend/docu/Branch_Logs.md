CAPSTONE TICKETS/TASKS 

feature/Add-Roles-Account-Backend / 
feature/Rename-id-DepartmentId /
feature/Add-Status-Account-Backend / 
feature/Add-Edit-Details-Build / 
feature/View-Account-Table-Edit /
feature/Use-React-Toastify-on-View-Account-Department /
feature/Activity-Log-Functionality-Implementation / 
feature/Test-and-Referrer-Frontend-Modals /
feature/Build-Test-Management-Page /
feature/Department-Fetching-and-Pagination-Patch /
feature/Test-Management-Department-Filter / 
fetaure/Activity-Log-Department-Test-Pagination /
feature/Department-Kebab-Revamp-Edit-and-Status-Update /
feature/Activity-Log-Calendar-Filter / 
feature/Bug-Fix-and-Revamp-View-Account-Activity-Log /
feature/Add-Account-Form-Overlapping / 
feature/Add-Change-Passkey-on-Edit-User-Modal / 
feature/Build-Referrer-Management /
feature/Align-Position-Kebab-Settings /
feature/View-Activity-Page-Not-Responsive / 
feature/Fetch-All-Referrer-on-Table / 
feature/Test-Management-useQuery-Implementation /
feature/Clean-Console-Logs-Referral-Management / 
feature/Add-Income-Fetch-Test-Data /
feature/Add-Income-Fixed-Add-Test-Container-Unselect-Test / 
feature/Tweak-Add-Income-Test-Referral-Management /
feature/Test-Registration-Summary-Height-Fix /
feature/Add-Income-Fetch-Referrer-on-Dropdown / 
feature/Disable-Referrer-Test-Display-Add-Income /
feature/Activiy-Log-Exclude-Status-Change-Referrer-Details / 
feature/Add-Income-Payment-Details-Modal /
feature/Settings-Referral-Design-Adjustment / 
feature/Department-Test-Kebab-Dropdown-Bug /
feature/Exclude-Referrer-Display-Deactivated-Status /
feature/Add-Income-Referrer-Birthdate-FE-Update /
feature/Add-Income-New-Test-Queueing-Funcational / 
feature/Add-Income-New-Referrer-Modal / 
feature/Add-Income-FE-Transaction-Summary-Modal /
feature/Activate/Deactivate-Arcive-Recover /
feature/New-Referrer-Address-Contact-Validator /
feature/Fixed-Label-Whole-Number-Commas /
feature/Build-Add-Income-Transaction-Page /
feature/Fix-Bug-Activity-Log-Search-User / 

feature/Build-Transaction-FE-and-BE-V.1 /
What's Changed V.1? 
- Gcash Computation on Balance Fixed
- No Table Transaction Display 
- Add New Referrer Blank Field Detector Contact No and Clinic Address
- Change Activate/Deactivated to Unarchived/Archive in Department, Test and Referral Management 
- Department Archived Together with Test Associated with it 
- Test Edit Modal Status Update Deactivated if Department is Archived
- Department Changing on Test Plus Logging it On Activity Log
- Activity Log Table Adjustment on Responsiveness
- Labeled Archived Department on Transaction Table 
- Exclude Department when Archived on Hamburger Add Income Page
- Put A Birthday on the Birthdate Input Field
- Income Table Pagination 
- Income Table Calendar Functional 
- Income Table Search Functional 
- Cancel Patient Income Data 
- Digit has now Comma in Income Table 
- Editable patient row plus Referrer Dropdown Selection 
- Remove Income per Department in Transaction Table together with Gross 
- Remove Pagination on Income Table 
- Remove Legend on Income Table 

feature/Build-Add-Transaction-FE-and-BE-Adjustment /
What's Changed V.2? 
- Add Transaction Wireframe Adjustment 
- Hide Generate Reports when there is no transaction on that day 
- Add MCno Field 
- Add ID no type
- MCno is incrementing only if the user created a successfull transaction 
- ID number and MCno is appearing on transaction summary 

Make sure to edit the table with this query
- ALTER TABLE TRANSACTIONS ADD COLUMN idNumber VARCHAR(255) NOT NULL DEFAULT 'XXXX-XXXX' AFTER idType;

feature/Build-Transaction-FE-and-BE-Adjustment-V.1
- Summary Box Style Change 
- Remove Refunding a Patient when Cancelled 
- Transaction Summary Modal FE 
- Transaction Summary Edit Details 
- Transaction Summary Edit Pricing Adjustment 
- Transaction Summary Edit Payment Detail if Cash or Gcash 
- Transaction Summary Refund Mode 

devpatch/expenses-prototype

What's Changed?
feature/Add-Expenses-Frontend-Build
- Fetching of Departments in Dropdown
- Allow Queuieng of Expenses
- Expenses Summary Modal 

feature/Add-Expenses-Backend-Build
- Allow Adding of Expenses 

feature/Add-Income-Transaction-Bug-Fixing
- Include Balance deduction on Income Table Departments Total 
- Fix Apply Global Discount on Add Income 

feature/Add-Lottie-React-Loading-Transaction

feature/Refactored-Transaction-Page
- Created dateUtil.js
- Created transactionUtils.js
- Created useTransactionManagement Hook 
- Created transaction folder for Component blocks of transaction 

feature/Refactored-Transaction-Row-to-IncomChE, CTE, MCA, RN, PHN, MOS, CPhT, CHTS, CTT+e-Table-Reusable-Component
feature/Adjust-Total-Position-Add-Expenses

feature/Build-Expenses-Table-Data
- Refactored Transaction.jsx 
- Create Custom Hook for Data Fetching Called useTransactionData
- Create a Reusable Component Expense Table 
- Build Feature Date Selection 
- Build Feature Search Expenses 
- Build Feature Display All Expenses on Table 

feature/Expense-Table-Edit-Expenses
feature/Income-Kebab-Edit-Transaction-Summary-Directly-Open
feature/Expense-Decimal-Point-Bug
feature/Tab-Settings-Role-Restriction

feature/Expense-Items-Payment-Mode-Selection
ALTER TABLE ExpenseItems 
ADD COLUMN `status` ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending'
AFTER `amount`;

feature/Add-Income-Payment-Details-Exceed-Bug

devpatch/montly-prototype

feature/Add-Collectible-Income-FE-Modal

feature/Add-Collectible-Income-BE-POST-GET
- Adding of Collectible income
- Viewing of Collectible income
- Remove Spinners on FE Modal

feature/Monthly-Income-Table-Display

What's Changed? 

- Display all monthly transactions
- Fix total bug calculation when a transaction is cancelled 
- Allow out of patient adding a transaction 
- Collectible income bug button fix 
- Collectible income activity logging user fix 


feature/Monthly-Expenses-Table-Display
feature/Add-Collectible-Income-Modal-Button-Fix-Tables-Redesign
feature/Hide-env.local-FE-and-BE
feature/Implementing-Express-Helmet

feature/Re-Engineering-Refactor-V.1

What's Changed?
- Add New Referrer Blank Field Detector Contact No and Clinic Address
- Change Activate/Deactivated to Unarchived/Archive in Department, Test and Referral Management 
- Department Archived Together with Test Associated with it 
- Test Edit Modal Status Update Deactivated if Department is Archived
- Department Changing on Test Plus Logging it On Activity Log
- Activity Log Table Adjustment on Responsiveness

feature/Implementing-Express-Helmet

feature/Change-Website-Icon-to-JPEG

feature/Adjust-File-Path-Website-Icon

feature/Add-ENV-Pre-Prod

feature/Pre-Prod-Backend-Adjust

feature/Database-Dialect-Change

feature/Add-PG-Package-Backend

feature/Vercel-Routing-Fix-MYSQL-NOTE

feature/Hotfix-CORS-Typo

feature/Remove-Localhost-API-BASE-URL

feature/Remove-Localhost-rpID-Webauthn-Config

feature/rpID-Simplfy-Configuration

feature/Remove-HTTPS-on-RPID-Domain

feature/Adjust-WebAuthn-Config

feature/Try-Fix-rpID-Pre-Prod-Bug

feature/Client-Origin-Included-BE-FE

feature/Remove-rpID-Hashing

feature/rpID-Retrial-Fix

feature/Trial-Fix-Backup-Passkey-V1

feature/Trial-Fix-Expense-V.1

feature/Transaction-Trial-Fix-V.1

feature/Transaction-Trial-Fix-V.2

feature/Add-Income-Change-UUID-Integer

--- Post Proposal Defense Dev ---

feature/Test-Referral-Management-Fixing

feature/Income-Monthly-Expenses-Adjust-Design

feature/MC-OR-Transaction-Kebab-Optimize-Design

feature/Add-Expense-Department-Filtering-Archive

feature/Add-Income-Change-Route-Name-Add-Transaction-useAuth-Missing

# ⚒ Devpatch5 What's Changed?
- Change Add-Income route name to Add-Transaction
- Bring back useAuth hook on Add Transaction Page
- Add Department Dropdown Filtering for Archive Department in Add Expense Page

feature/Add-FE-Buttons=Referral-Page
# ⚒ What's Changed?
- Move Generate Button Position on Top in Referral Page
- Add FE buttons on for Filter, Date Selector 

feature/Major-Update-Referral-Functionality-Engineering
# ⚒ What's Changed?
- Backend new filtering for getAllTransactions function 
- Backend new function for getTransactionByReferrerId 
- New route getTransactionByReferrerId 
- Fix Add department dropdown click bug when no test active
- Center text Monthly Income and Expenses Table Data
- Implement Functionality on Referral Page to fetch all Transactions
- Make Filtering Amount and Date Selector Functional 
- Create another function in decimalUtil for currency

feature/Referral-useQuery-Page-Refresh

feature/Activity-Log-UTC-Asia-Timezone

feature/Activity-Log-UTC-Asia-Timezone-Fix-V2

feature/Login-Auth-Modal

devpatch6 

feature/Dashboard-FE-Revamp-Design-After-Defense

feature/Dashboard-Display-Name-Extraction-useUserDisplay

feature/Build-Dashboard-Functionality
# ⚒ What's Changed? 

✨ Backend Changes 
- Create dashboardController and include existing models for data fetching
- Create a async function to get Monthly Data
- Create a asyncfunction to get Daily Income Data
- Create a async function to get Expenses by Department
- Create a async function to get Net Profit = Revenue - Expenses
- Create dashboardRoute
- Modify Transaction model mcNo: STRING FROM 5 TO 10
- Fix Bug on Backend mcNo/OR# Generation set to 10 instead of 5 
- Use socketManager on transaction and expense Controller for instant real time update 
- Create socketManager in utils folder to initialze socket.io configuration

✨ Frontend Changes 
- Format display to add numeric and long value 
- Add Dashboard Error Boundary component for error handling in dashboard socket.io client
- Create DashboardContext to pass data on Dashboard graphs components
- Create Custom hook useDashboardData for graphs logic
- Create Custom hook useSocketDashboard for socket client logic handling
- Create requestQueue mapping to prevent duplicate requests on api file 
- New endpoints to getMonthly data
- Create chartDataTransformers for chart styling

feature/Socket-io-Package-Install-BE 

devpatch6 - Merge Conflict

feature/Build-Dashboard-Functionality-With-Socket.io-Package-BE -- will not used instead use devpatch-pre-prod merge fixed branch

devpatch7 - New Core Branch Creation due to Conflict

feature/Pre-Prod-Merge-Conflict-Resolve-v.1

feature/Pre-Prod-Merge-Conflict-Resolve-v.2

feature/Pre-Prod-Fix-Sequelize-Function-Due-To-PostgreSQL-Database

feature/Pre-Prod-Fix-Sequelize-Extraction-Queries

feature/Pre-Prod-Fix-Sequelize-Extraction-Queries-v.2

feature/Pre-Prod-Fix-Sequelize-Extraction-Queries-v.3

feature/Remove-Console-logs-Dashboard-FE

feature/Pre-Prod-Change-Icon-Tab-To-PNG

feature/Devpatch7-Backend-Packages-Fix

feature/Add-Breakpoint-Responsiveness-Dashboard-Add-Transaction-Page

feature/Remove-Action-Column-on-Monthly-Income-Expenses-Page

feature/Dashboard-Net-Profit-to-Net-loss-Label-Change

feature/Add-Expenses-Department-Types-and-Categories
# ⚒ What's Changed? 
- Replace Fullname to First Name and Last Name
- Add Categories Dropdown and Modal on Add Expenses Page
- Display First Name and Last Name to Expenses Table
- Display Categories of Expense Items on Expenses Table 
- Update First Name, Last Name and Categories on Expense Summary Modal

feature/Activity-Log-Table-Responsiveness-Remove-Zero-Default-Add-Test-Queueing

feature/Collectible-Income-FE-Bug-and-Data-Includes-Dashboard-Recording

feature/Add-Expense-First-Last-Name-Blank-Field-Validator

feature/Transaction-Add-Edit-Birth-Future-Restriction

feature/Frontend-Component-Folder-Restructuring

feature/Modify-Add-Referrer-Modal-Reusable-on-Add-Transaction-and-Referral
# ⚒ What's Changed? 
- Make Referrer Modal Reusable to Referral Management and Add Transaction
- New hook useReferrerForm for Referrer Modal Logic

feature/Modify-Add-Test-Modal-Reusable-Test-Management
# ⚒ What's Changed? 
- Make Test Modal Reusable to Test Management
- New hook useTestForm for Test Modal Logic

feature/Settings-Account-Page-Padding-Left-Bug

feature/Modify-Add-Test-Queuing-Modal-Reusable-Add-Transaction

feature/Add-Test-Queuing-Modal-Future-Date-Restriction

feature/Move-Sidebar-Components-Dashboard-Component-Folder-Add-Referrer-CONFIRM-Button-Label-Change

feature/Remove-UpperCase-CONFIRM-Label-Referrer-Modal

feature/Add-Transaction-Date-Created-Input-Field-Type-Logic

feature/Test-and-Test-Queuing-Modal-Date-Created-Input-Field-Type-Logic

feature/Add-Expense-Date-Future-Restriction

feature/Test-Queuing-Modal-Date-Overload-White-Bug

feature/Transaction-Summary-Modal-Input-Field-Type-Logic

feature/Add-Collectible-Income-Date-Future-Restriction

feature/Dashboard-Date-Navigator-Date-Future-Restriction

feature/Expenses-Summary-Modal-Revamped

feature/Collectible-Income-Edit-Modal
# ⚒ What's Changed? 
- Run this sql query due to new column
ALTER TABLE CollectibleIncome 
ADD COLUMN dateConducted DATETIME NOT NULL DEFAULT NOW() AFTER totalIncome;

-- Update existing records
UPDATE CollectibleIncome 
SET dateConducted = createdAt;

- New Controller for updating Collectible incomes

feature/Edit-Button-Mode-Kebab-Onclick-Expense-Page

feature/Add-Test-Queing-Modal-Date-Queing-Not-Match

feature/Add-Referrer-Button-Referrer-Page-Include-Validate-Form-Props-to-Pages
# What's Included?
- Also Include Missing validateForm Props to Add Transaction and Referral Management Page
- Enables toast error validation for blank fields in Referrer Modals

feature/Monthly-Expenses-Rearrangment-Columns-and-Rename-Categories-to-Category
# What's Included?
- run this sql command ALTER TABLE CATEGORIES RENAME TO CATEGORY;
- table name change from categories to category

feature/Daily-Income-Trend-Collectible-Income-Change-Not-Applied
# What's Included?
- Revamp Graph Design with legend and tooltip
- Line Graph for Total Income, Collected Income and Collectible Income
- Include Collectible income on the calculation

feature/Transcation-Summary-Modal-Discount-Exceed-Refund-Income-Summary-Box-Bug
# What's Included?
- Exceeded Discount not Recording due to missing props and function
- Fix missing state on Payment Details to Open Modal 

feature/Dashboard-20%-Discount-for-PWD-Senior-Citizen
# What's Included?
- Saved the Transaction with totalIncome discounted by 20% due to idType discount from FE to BE
- Use the Transaction Summary Modal Reusable Component on Add Transaction
- Add Total Transation Row on Transaction Summary Modal 
- Fix Gross it now Records the Updated Discount if id type is Senior Citizen and Person with Disability on Income Table
- Fix Transaction Summary Modal total not updating. if a test is refunded it should exclude it on the total cashpaid and gcash paid 
- Fix Deposit now includes Refund on calculation
- Fix Canceled Transaction that has refunded test are no longer calculated on refund display on transactionUtils.js
- Fix Income Total Table Calculation
- Fix if a test has a balance it should deduct it on the total.
- Fix the total cash paid should only calculate the cash paids
- Fix the total gcash paid should only calculate the gcash paids
- Fix if the discounted percentag make the discounted price exceeded the cash paid and gcash paid it makes it the same

feature/Add-Transaction-Birth-Date-Bug

feature/Dashboard-Net-Profit-Arrow-Tooltip

feature/Collectible-Income-View-Not-Match-in-Month

feature/Update-SQL-File-Schema-and-Add-PostgreSQL-File-Schema

feature/Add-Transaction-20%-Referrer-Deduction-Expenses

feature/Monthly-Expenses-Department-Table-Redesign

-- devpatch8 -- 

feature/FE-Application-Page-Exports

feature/Expenses-Table-Export-to-Excel
feature/Monthly-Income-Export-to-Excel
feature/Monthly-Expenses-Export-to-Excel
feature/Referrals-Export-to-Excel
feature/Action-Log-Export-to-Excel
feature/Test-Departments-Export-to-Excel
feature/Test-List-Export-to-Excel
feature/Referrer-List-Export-to-Excel
feature/Monthly-Income-Export-Header-Responsiveness

feature/Npm-Start-Concurrently-Package
feature/Npm-i-and-README-Inclusion

feature/Devpatch8-Bug-Fixing-Batch-Feedback
# 🌟 What's Changed?
- Generate Button Hide if no data displayed on the pages 
- Dashboard Total Monthly Revenue, Expenses and Net Profit Label not Responsive Sizing 
- Net Profit Now displays clear Net Profit = Total Monthly Income - Total Monthly Expenses 
- Referrer Modal in Referral Management Page now Displays Username on Activity Log
- Income Table now have Decimals 
- Rebates now have Category on Expense Table 
- Transaction Summary Modal now Updates Referrer of that transaction and paid to expense items 
- If transaction referrer was updated to out patient it will remove that rebates on the expense table \
- Test Conducted 20% now applies only on total transaction and not every test 
- Income Table Digit has no commas 
- Pie Chart and Monthly Expenses Table Rebate no has Separate Category and Table 
- Fido 2 Change Passkey Functionality

feature/Test-Conducted-20%-Discount-Removal-Application-Total-Transaction-Only

feature/Income-Table-Digit-Commas

feature/Referrer-Labeled-Dashboard-Monthly-Expenses-Table

feature/FIDO2-Change-Passkey-v1

devpatch9

devpatch10

feature/Pre-Prod-Dashboard-Error

feature/Add-DATABASE-Mock-Backup-File

feature/Build-WebAuthn-Trigger

devpatch11 

feature/Easy-Revise-Ops
- Show scrollbar on transaction summary modal 
- Change label from id to discount type 
- add webauthn modal on refund button

feature/Pre-Prod-Change-Passkey-Error

feature/Build-Dashboard-Revamp

feature/Sidebar-Revamp-v2

feature/Dashboard-Metric-System-Revamp

feature/Dashboard-Metric-Graph-Revamp

feature/FIDO2-Change-Passkey-v2

feature/Dashboard-Metric-Profit-Loss-Revamp

feauture/Build-Transaction-Revamp

feature/New-Transaction-Page-Revamp

feature/New-Add-Transction-Page-Revamp

feature/Build-Expense-Revamp

feature/New-Add-Expense-Summary-Modal









