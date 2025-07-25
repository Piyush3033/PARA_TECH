CryptoBank - Real Smart Contract Loans

This project Shows the CryptoBank - a real blockchain-powered lending platform using Ethereum smart contracts.

## Features

- **Real Smart Contracts**: Loans are now backed by actual Ethereum smart contracts
- **Collateral Management**: ETH collateral is locked in smart contracts until repayment
- **Automated Interest**: 5.5% APR calculated and enforced by smart contracts
- **Liquidation Protection**: 30-day loan terms with automatic liquidation capabilities
- **MetaMask Integration**: Seamless wallet connectivity and transaction signing
- **Real-time Updates**: Live balance updates and transaction confirmations

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Deploy Smart Contract

#### For Local Development (Ganache):
\`\`\`bash
# Start Ganache on port 8545
npm run deploy:local
\`\`\`

### 3. Update Contract Address

After deployment, update the contract address in `js/contract-integration.js`:

\`\`\`javascript
this.contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";
\`\`\`

### 4. Start the Application

\`\`\`bash
npm start
\`\`\`

## More Commands

## Adding liquidity to deployed contract
 npm run add-liquidity  

##  Checking contract deployment
npm run check-deployment
 Contract address: 0x0290FB167208Af455bB137780163b7B7a9a10C16 // may be different
 Contract owner: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1

## To diagnose
 npm run diagnose

## Close the server
 Ctrl+c

## How It Works

### Creating a Loan

1. **Connect Wallet**: Users connect their MetaMask wallet
2. **Enter Collateral**: Specify ETH amount to use as collateral
3. **Smart Contract Execution**: Contract locks collateral and transfers 70% as loan
4. **Real Transaction**: All operations are recorded on the blockchain

### Repaying a Loan

1. **Calculate Repayment**: Smart contract calculates total amount (principal + 5.5% interest)
2. **Send Payment**: User sends repayment amount to smart contract
3. **Release Collateral**: Contract automatically releases locked collateral
4. **Transaction Complete**: All operations confirmed on blockchain

##  Smart Contract Details

### Contract Features

- **Loan-to-Value Ratio**: 70% (borrow 0.7 ETH for every 1 ETH collateral)
- **Interest Rate**: 5.5% APR (550 basis points)
- **Loan Duration**: 30 days
- **Liquidation Threshold**: 85%
- **Gas Optimized**: Efficient contract design to minimize transaction costs

### Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Owner-only functions for contract management
- **SafeMath**: Overflow protection for all calculations
- **Event Logging**: Complete audit trail of all loan operations

## Network Support

- **Local Development**: Ganache
- **Testnet**: Sepolia (recommended for testing)
- **Mainnet**: Ethereum (production use)

## 📱 Frontend Integration

## Security Considerations

### For Users
- Always verify contract addresses before interacting
- Understand that collateral is locked until repayment
- Monitor gas prices to optimize transaction costs
- Keep private keys secure and never share them

### For Developers
- Test thoroughly on testnets before mainnet deployment
- Implement proper error handling for all blockchain interactions
- Monitor contract for unusual activity
- Consider implementing additional security measures like multi-sig

## Important Notes

1. **Real Money**: This system uses real cryptocurrency - test thoroughly on testnets first
2. **Gas Costs**: All transactions require ETH for gas fees
3. **Irreversible**: Blockchain transactions cannot be undone
4. **Smart Contract Risk**: While audited, smart contracts carry inherent risks

## Support

For technical support or questions:
- Check the browser console for detailed error messages
- Ensure MetaMask is properly connected
- Verify you're on the correct network
- Confirm sufficient ETH balance for gas fees


#   B l o c k c h a i n - B a s e d - B a n k i n g - S y s t e m 
 
 
