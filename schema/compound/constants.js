// event LiquidateBorrow(
//     address liquidator, 
//     address borrower, 
//     uint repayAmount, 
//     address cTokenCollateral, 
//     uint seizeTokens);

// tx: 0xae3348713993422b0471d67c8fea7ae5f6cbe2f4e94f4de9b5b3ac0825ed6c53

export const LIQUIDATE_BORROW = "\\x298637f684da70674f26509b10f07ec2fbc77a335ab1e7d6215a4b2484d8bb52";

export const CRYPTO_EPOCH = 1231006505;

// event Borrow(address borrower, uint borrowAmount, uint accountBorrows, uint totalBorrows);
export const BORROW_EVENT = "\\x13ed6866d4e1ee6da46f845c46d7e54120883d75c5ea9a2dacc1c4ca8984ab80"

// event RepayBorrow(address payer, address borrower, uint repayAmount, uint accountBorrows, uint totalBorrows);
export const REPAY_BORROW_EVENT = "\\x1a2a22cb034d26d1854bdc6666a5b91fe25efbbb5dcad3b0355478d6f5c362a1"
