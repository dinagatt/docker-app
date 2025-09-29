/*

-------LEFT JOIN-------:

`
SELECT ws.*, w."Title", concat(u."FirstName", '', u."LastName") as "UserFullName"
FROM "WalletSharing" ws
ON ws."WalletId" = w."Id"
LEFT JOIN "Users" u
ON ws."UserId" = u."Id"
`

We get a table of ws with user's name and last name, and a wallet name.

 */

/*
-------SUBQUERY-------:

Example 1:
`
SELECT *
(
SELECT "FirstName" || '' || "LastName" as "BossName"
FROM public."Users"
WHERE "Id" = 123
)

FROM public."Users"
`

We get a table with all users, and we add a new column for all users called "BossName" and the name is a user with ID 123.

Example 2 "count":
`
SELECT *
(
SELECT count(*)
FROM public."Wallets" as w
WHERE w."OwnerId" = u."Id"
) as "WalletCount"

FROM public."Users" as u
`

We get a table with all users and add a column for all users called "WalletCount" which shows the amount of wallets each user has.

Example 3 "WHEN/THEN":
`
SELECT *
(
SELECT
   CASE
   WHEN count(*) > 0 THEN True
   ELSE False
   END
FROM public."Wallets" as w
WHERE w."OwnerId" = u."Id"
) as "doesUseHaveWallets"

FROM public."Users" as u
`

We get a table with all users and add a column for each user if he/she has any  wallets: true/false.

*/

/*

-------COUNT-------:

SELECT count(*) as "WalletCount"
FROM public."Wallets"
WHERE "OwnerId" = 123

We get a one column table with the number of wallets of a user with ID 123.

*/

/*
-------ROW NUMBER, CTE(Common Table Expression)-------

Example 1:
`
SELECT wallet.*
   ROW_NUMBER() OVER (ORDER BY "addedAt") AS "walletNumber"
FROM wallet
`

We get a table of all wallets ordered by "addedAt" and we add a row with ordinal/serial number

Example 2:
`
SELECT wallet.*
   ROW_NUMBER() OVER ( PARTITION BY "ownerId" ORDER BY "addedAt") AS "walletNumber"
FROM wallet
`

We get a table of all wallets ordered by "addedAt" and "ownerId", so first batch of rows is one user, then the second, A row with ordinal/serial numbers was added (e.g. 1-19 one user's wallets, then again 1-8 the second user's wallets, etc.)

*/
