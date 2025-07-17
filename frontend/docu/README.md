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

devpatch7 - New Core Branch due to Conflict

feature/Pre-Prod-Merge-Conflict-Resolve-v.1



--LATER--
feature/Test-Management-Search-Date-Bug
feature/User-Search-Date-Bug
feature/Refactor-Backend-Controllers-Structure-&-Table-Model 
feature/Api-Rate-Limiting 
feature/Remove-Refund-Recording
feature/Optimize-Api-Endpoints-Service
feature/Separate-Information-Add-Expenses-Page

feature/Change-Passkey-Build
feature/Activity-Log-Generate-Reports 
feature/Department-Management-Generate-Reports 
feature/Test-Management-Generate-Reports 
feature/Referrer-Management-Generate-Reports 

feature/Referrer-Generate-Reports
feature/Monthly-Income-Search-Fetch
feature/Monthly-Generate-Reports
feature/Monthly-Expenses-Search-Fetch
feature/Monthly-Expenses-Generate-Reports

feature/Transaction-Income-Table-Generate-Reports
feature/Transaction-Expenses-Table-Generate-Reports
feature/Transaction-Income-Table-Functionality
feature/Transaction-Expenses-Table-Functionality

feature/Add-Transaction
feature/Add-Expenses
feature/Dynamic-Dashboard


- Expenses, Test department iniinclude mga department kahit archived


there is a problem upon creating expenses. find the problem and resolved it 

backend issue 

Error creating expense: Error
parent: error: invalid input syntax for type integer: "INTEGER"

frontend issue 

https://purehealth-diagnostic-center.onrender.com/api/expenses

-Transaction (di maka-create sa income & expenses)(matagal mag-load)
-Nagrerefresh yung ineedit sa transaction kapag may titingnan sa ibang module.
-Time sa activity log di accurate

PHONE
-Sa dashboard, yung monthly net profit di nakaalign yung bar graph sa months
-Yung may red circle sa may transaction(swipe horizontal). Para san yun?
-Magulo Activity log
-Goods format kapag naka desktop view except lang sa last yung sa settings

LOGIN
Yung acc ko na ginawa sa laptop(L) Windows hello ginamit ko sa passkey. Yung acc ko na ginawa sa cp(C) finger print ginamit ko sa passkey. Kapag inopen ko yung acc L sa cp di ko sya maopen kase windows hello gamit ko. Kapag inopen ko naman yung acc C sa laptop di ko rin maopen.

Backup passkey registration failed: Security Error the RP ID "localhost" is invalid for this domain


TRANSACTION DEPLOYED FIXING 


-- 1. Fix TestDetails table - Change departmentId from UUID to INTEGER
ALTER TABLE "TestDetails" 
ALTER COLUMN "departmentId" TYPE INTEGER USING "departmentId"::text::integer;

-- 2. Fix DepartmentRevenues table - Change departmentId from UUID to INTEGER  
ALTER TABLE "DepartmentRevenues"
ALTER COLUMN "departmentId" TYPE INTEGER USING "departmentId"::text::integer;

-- 3. Fix Transactions table - Change userId from UUID to INTEGER
ALTER TABLE "Transactions"
ALTER COLUMN "userId" TYPE INTEGER USING "userId"::text::integer;

psql postgresql://purehealthdb_user:4TYaQnmH2MRtm5aRGt6uGluwZueoYVfO@dpg-d1d2e13e5dus73au6nm0-a/purehealthdb

Transaction Page not rendering properly and keeps getting reload. 
this error persist because there is no data on the backend. 

backend log

Error getting department refunds: Error
parent: error: operator does not exist: uuid = integer
severity: 'ERROR',
original: error: operator does not exist: uuid = integer

frontend log 
{
    "success": false,
    "message": "Failed to retrieve department refunds",
    "error": "operator does not exist: uuid = integer"
}



index-4746d220.js:73 Transaction API error: 
{success: false, message: 'Failed to create transaction', error: 'invalid input syntax for type uuid: "2"', details: 'Error\n    at Query.run (/opt/render/project/src/ba…ckend/controllers/transactionController.js:94:25)'}

{
    "success": false,
    "message": "Failed to create transaction",
    "error": "invalid input syntax for type uuid: \"2\"",
    "details": "Error\n    at Query.run (/opt/render/project/src/backend/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)\n    at /opt/render/project/src/backend/node_modules/sequelize/lib/sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.insert (/opt/render/project/src/backend/node_modules/sequelize/lib/dialects/abstract/query-interface.js:308:21)\n    at async model.save (/opt/render/project/src/backend/node_modules/sequelize/lib/model.js:2490:35)\n    at async Transaction.create (/opt/render/project/src/backend/node_modules/sequelize/lib/model.js:1362:12)\n    at async exports.createTransaction (/opt/render/project/src/backend/controllers/transactionController.js:94:25)"
}






the transaction page causes an error and keeps triggering the refund causing the transaction page to cause an error.
my perspective to this is that this error persist because the api is keep calling the refund error even thought there is no refund data yet stored in the backend/database. resolve this problem so that even thought there is no refund record it will work properly and only call the api when there is a refunded record 

backend error 
Error getting department refunds: Error

parent: error: function json_valid(text) does not exist
 severity: 'ERROR',
{success: false, message: "Failed to retrieve department refunds",…}
error

: 
"function json_valid(text) does not exist"
message


frontend error 
: 
"Failed to retrieve department refunds"
success
: 
false


i can't create a transaction 

backend error 

Transaction creation error: Error

parent: error: invalid input syntax for type uuid: "2"

severity: 'ERROR',



frontend error

{success: false, message: "Failed to create transaction",…}
details
: 
"Error\n    at Query.run (/opt/render/project/src/backend/node_modules/sequelize/lib/dialects/postgres/query.js:50:25)\n    at /opt/render/project/src/backend/node_modules/sequelize/lib/sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.insert (/opt/render/project/src/backend/node_modules/sequelize/lib/dialects/abstract/query-interface.js:308:21)\n    at async model.save (/opt/render/project/src/backend/node_modules/sequelize/lib/model.js:2490:35)\n    at async Transaction.create (/opt/render/project/src/backend/node_modules/sequelize/lib/model.js:1362:12)\n    at async exports.createTransaction (/opt/render/project/src/backend/controllers/transactionController.js:94:25)"
error
: 
"invalid input syntax for type uuid: \"2\""
message
: 
"Failed to create transaction"
success
: 
false


index-fbfe1f1a.js:73 Transaction API error: 
{success: false, message: 'Failed to create transaction', error: 'invalid input syntax for type uuid: "2"', details: 'Error\n    at Query.run (/opt/render/project/src/ba…ckend/controllers/transactionController.js:94:25)'}

index-fbfe1f1a.js:238 Transaction error: 
AxiosError {message: 'Request failed with status code 500', name: 'AxiosError', code: 'ERR_BAD_RESPONSE', config: {…}, request: XMLHttpRequest, …}


-- 4. Fix Transactions table - Change referrerId from UUID to INTEGER
ALTER TABLE "Transactions"
ALTER COLUMN "referrerId" TYPE INTEGER USING "referrerId"::text::integer;

-- 5. Fix TestDetails table - Change testId from UUID to INTEGER  
ALTER TABLE "TestDetails"
ALTER COLUMN "testId" TYPE INTEGER USING "testId"::text::integer;

