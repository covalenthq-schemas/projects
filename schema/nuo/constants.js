export const NUO = "\\0x740f8b58f5562c8379f2a8c2230c9be5c03ac3fc"

// This is for ROI 
export const NUO_RESERVE_ESCROW_CONTRACT = "802275979b020f0ec871c5ec1db6e412b72ff20b"

export const NUO_RESERVE_CONTRACT = "\\x64d14595152b430cf6940da15c6e39545c7c5b7e"

export const DAI_TOKEN_CONTRACT = "89d24a6b4ccb1b6faa2625fe562bdd9a23260359";

export const USDC_TOKEN_CONTRACT = "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export const WETH_TOKEN_CONTRACT = "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

export const MKR_TOKEN_CONTRACT = "9f8f72aa9304c8b593d555f12ef6589cc3a579a2";

export const WBTC_TOKEN_CONTRACT = "2260fac5e5542a773aa44fbcfedf7c193bc2c599";

export const LINK_TOKEN_CONTRACT = "514910771af9ca656af840dff83e8264ecf986ca"

export const TUSD_TOKEN_CONTRACT = "0000000000085d4780B73119b644AE5ecd22b376"
export const TUSD_OLD_TOKEN_CONTRACT = "8dd5fbce2f6a956c3022ba3663759011dd51e73e"

export const BAT_TOKEN_CONTRACT = "0d8775f648430679a709e98d2b0cb6250d2887ef"

export const KNC_TOKEN_CONTRACT = "dd974d5c2e2928dea5f71b9825b8b646686bd200"

export const REP_TOKEN_CONTRACT = "1985365e9f78359a9B6AD760e32412f4a445E862"

export const ZRX_TOKEN_CONTRACT = "e41d2489571d322189246dafa5ebde1f4699f498"


// This is for account level stats
export const NUO_ACCOUNT_FACTORY = "\\x4e9d7f37eadc6fef64b5f5dccc4deb6224667677";


// Kernel
export const KERNEL_CONTRACT = "\\x8dc3bcbb4b506fa2becd065ff4425dee32f156a6";

// LogOrderRepaid (index_topic_1 bytes32 orderHash, uint256 valueRepaid)
export const LogOrderRepaid = "\\x2d538ae573a2661798539a62b24b14e263cf75f5597027ac2ecfc44ba8ddf9e3"

// LogOrderCreated (index_topic_1 bytes32 orderHash, index_topic_2 address account, index_topic_3 address principalToken, 
//address collateralToken, address byUser,
// uint256 principalAmount, uint256 collateralAmount, uint256 premium, uint256 expirationTimestamp, uint256 fee)
export const LogOrderCreated = "\\x42436fe8b8c5070e5a6cb3c26e7bc2e889f99c1857c1a1323c54b13fedc655f6"

// LogAccountCreated (index_topic_1 address user, index_topic_2 address account, address by)
export const NUO_ACCOUNT_CREATED = "\\x00ef0c4d7ce8d09e55441711e41dc8f1a6abbe3313f4369ea8094dbf0b7b1820";

export const CRYPTO_EPOCH = 1231006505;


export const DECIMALS = (token) => {
    return `
case 
    when ${token} = '${USDC_TOKEN_CONTRACT}' then 1e6
    when ${token} = '${WBTC_TOKEN_CONTRACT}' then 1e8
    else 1e18    
end
`
}

