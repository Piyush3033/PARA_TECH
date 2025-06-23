// SPDX-License-Identifier: MIT
pragma solidity ^0.5.16;

/**
 * @title SimpleLoan - Ultra-simple version for Ganache compatibility
 * @dev Basic lending contract that should work with any Ganache version
 */
contract SimpleLoan {
    address public owner;
    
    struct Loan {
        address borrower;
        uint256 collateral;
        uint256 amount;
        bool active;
    }
    
    mapping(uint256 => Loan) public loans;
    uint256 public loanCount = 0;
    
    event LoanCreated(uint256 loanId, address borrower, uint256 amount);
    event LoanRepaid(uint256 loanId, address borrower);
    
    constructor() public {
        owner = msg.sender;
    }
    
    function createLoan() public payable {
        require(msg.value > 0, "Need collateral");
        
        loanCount++;
        uint256 loanAmount = msg.value * 70 / 100; // 70% LTV
        
        loans[loanCount] = Loan({
            borrower: msg.sender,
            collateral: msg.value,
            amount: loanAmount,
            active: true
        });
        
        msg.sender.transfer(loanAmount);
        emit LoanCreated(loanCount, msg.sender, loanAmount);
    }
    
    function repayLoan(uint256 loanId) public payable {
        require(loans[loanId].borrower == msg.sender, "Not your loan");
        require(loans[loanId].active, "Loan not active");
        
        uint256 repayAmount = loans[loanId].amount + (loans[loanId].amount * 5 / 100); // 5% interest
        require(msg.value >= repayAmount, "Not enough payment");
        
        loans[loanId].active = false;
        msg.sender.transfer(loans[loanId].collateral);
        
        if (msg.value > repayAmount) {
            msg.sender.transfer(msg.value - repayAmount);
        }
        
        emit LoanRepaid(loanId, msg.sender);
    }
    
    function getLoan(uint256 loanId) public view returns (address, uint256, uint256, bool) {
        Loan memory loan = loans[loanId];
        return (loan.borrower, loan.collateral, loan.amount, loan.active);
    }
    
    function addLiquidity() public payable {
        require(msg.sender == owner, "Only owner");
    }
    
    function() external payable {
        // Accept ETH
    }
}
