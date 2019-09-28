export const RDAI_TOKEN = "\\x09163bc9da7546ddA9D82Be98FE006a95C87E9B4";

export const SLOTS = {
    SUPPLY: 5,
    HAT_LIST: 12
};


export const HAT_CHANGED_EVENT = '\\x9d1772e07de3fd01cec90e0df8d96154b0fa880d76f3098d2ab95727af469faa';

    // struct Hat {
    //     address[] recipients;
    //     uint32[] proportions;
    // }

    // struct GlobalStats {
    //     /// @notice Total redeemable tokens supply
    //     uint256 totalSupply;
    //     /// @notice Total saving assets in redeemable amount
    //     uint256 totalSavingsAmount;
    // }

    // struct AccountStats {
    //     /// @notice Cumulative interests paid
    //     uint256 cumulativeInterest;
    // }

    // /// @dev Account structure
    // struct Account {
    //     //
    //     // Essential info
    //     //
    //     /// @dev ID of the hat selected for the account
    //     uint256 hatID;
    //     /// @dev Redeemable token balance for the account
    //     uint256 rAmount;
    //     /// @dev Redeemable token balance portion that is from interest payment
    //     uint256 rInterest;
    //     /// @dev Loan recipients and their amount of debt
    //     mapping (address => uint256) lRecipients;
    //     /// @dev Loan debt amount for the account
    //     uint256 lDebt;
    //     /// @dev Saving asset amount internal
    //     uint256 sInternalAmount;

    //     /// @dev Stats
    //     AccountStats stats;
    // }

    // mapping (address => Account) private accounts;
