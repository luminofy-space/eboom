This project is created to make a personal finance management platform (PFM). 
The PFM platform is web base, the database is postgres, I also use the Supabase to have the Postgres database, Authentication and the REST API for the database tables. 

The project users are personal and individual people or families or maybe small businesses. 

We have a concept of "Canvas" which is a finance project that someone create and can add people to it. all the user activities will map to a canvas. for example user A has a canvas for the freelancing job financial management, one canvas for the family financial planning and one for the individual financial planning. 

The project features is:
- multi currency support
- Manage income resources, type of income resource, the forecasting or estimating our much income will receive in next month or current year. (multi currency income, currency or crypto currency)
- manage assets and money in the wallets. wallets may be the bank accounts, crypto wallets, the safe or a place which people put their money or assets there. assets may be gold, car, land, apartment, house, or any other thing that can bought to others. 
- manage expenses, with categories in multi level (like tree graph). 
- manage Debiting and Crediting with people
- defining people, shops, companies to map the income, expense, debiting and crediting to it's related entity
- manage loans and their repayments deadlines and amounts. 
- Budgeting 
- financial planning (for week, month, year, long time periods)
- To Buy list and plan to buy them (like a todo list with priority and due date)
- having reports about incomes, assets, expenses, loans, budgeting 
- The Ai that can guide me in financial planning and reviewing the financial part of the life

As the money or asset transactions can by multi currency, the platform should handle the data related to the asset and money converts ( for example, convert rate, convert fee, which currency or asset converted to another currency or asset ). also the Payment of the job in the income part may have currency converts.  


## Conceptual framework
```mermaid
---
config:
  layout: dagre
  look: classic
  theme: neo
---
flowchart TB
    INC_R1(["Income Resource - Fulltime job"]) -- Income Transaction --> AST1["USD Asset"]
    INC_R2(["Income Resource - Youtube"]) -- Income Transaction --> AST2["BTC Asset"]
    AST1 -- converted Transaction --> AST2
    AST2 -- converted Transaction --> AST1
    AST1 -- Expense Transaction --> EXP1(["Daily Expenses"])
    EXP2(["House Expenses"])
    AST1 -- Expense Transaction --> EXP2

    EXP3(["Trip & Hobby Expenses"])

    AST2 -- Expense Transaction --> EXP3


    AST1@{ shape: rounded}
    AST2@{ shape: rounded}
     INC_R1:::Pine
     INC_R1:::Aqua
     AST1:::Peach
     AST1:::Sky
     INC_R2:::Aqua
     AST2:::Sky
     EXP1:::Rose
     EXP2:::Rose
     EXP3:::Rose
    classDef Pine stroke-width:1px, stroke-dasharray:none, stroke:#254336, fill:#27654A, color:#FFFFFF
    classDef Aqua stroke-width:1px, stroke-dasharray:none, stroke:#46EDC8, fill:#DEFFF8, color:#378E7A
    classDef Peach stroke-width:1px, stroke-dasharray:none, stroke:#FBB35A, fill:#FFEFDB, color:#8F632D
    classDef Sky stroke-width:1px, stroke-dasharray:none, stroke:#374D7C, fill:#E2EBFF, color:#374D7C
    classDef Rose stroke-width:1px, stroke-dasharray:none, stroke:#FF5978, fill:#FFDFE5, color:#8E2236
```
