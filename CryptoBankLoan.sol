// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CryptoBankLoan
 * @dev A simple lending contract for CryptoBank
 */
contract CryptoBankLoan {
    address public owner;
    bool private locked;

    struct Loan {
        uint256 id;
        address borrower;
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 interestRate;
        uint256 createdAt;
        uint256 dueDate;
        bool isActive;
        bool isRepaid;
    }

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    uint256 public nextLoanId = 1;
    
    // Constants
    uint256 public constant LOAN_TO_VALUE_RATIO = 70; // 70%
    uint256 public constant DEFAULT_INTEREST_RATE = 550; // 5.5%
    uint256 public constant LOAN_DURATION = 30 days;

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralAmount,
        uint256 loanAmount
    );

    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 repaymentAmount
    );

    event LiquidityAdded(address indexed sender, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier noReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

    modifier loanExists(uint256 _loanId) {
        require(_loanId > 0 && _loanId < nextLoanId, "Loan does not exist");
        _;
    }

    modifier onlyBorrower(uint256 _loanId) {
        require(loans[_loanId].borrower == msg.sender, "Not the borrower");
        _;
    }

    constructor() {
        owner = msg.sender;
        locked = false;
    }

    /**
     * @dev Create a new loan by depositing ETH as collateral
     */
    function createLoan() external payable noReentrant {
        require(msg.value > 0, "Collateral required");
        
        uint256 collateralAmount = msg.value;
        uint256 loanAmount = (collateralAmount * LOAN_TO_VALUE_RATIO) / 100;
        
        require(address(this).balance >= loanAmount, "Insufficient liquidity");

        uint256 loanId = nextLoanId;
        nextLoanId++;
        
        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            collateralAmount: collateralAmount,
            loanAmount: loanAmount,
            interestRate: DEFAULT_INTEREST_RATE,
            createdAt: block.timestamp,
            dueDate: block.timestamp + LOAN_DURATION,
            isActive: true,
            isRepaid: false
        });

        userLoans[msg.sender].push(loanId);

        // Transfer loan amount to borrower
        (bool success, ) = payable(msg.sender).call{value: loanAmount}("");
        require(success, "Transfer failed");

        emit LoanCreated(loanId, msg.sender, collateralAmount, loanAmount);
    }

    /**
     * @dev Repay a loan and get collateral back
     */
    function repayLoan(uint256 _loanId) 
        external 
        payable 
        noReentrant 
        loanExists(_loanId) 
        onlyBorrower(_loanId) 
    {
        Loan storage loan = loans[_loanId];
        require(loan.isActive, "Loan not active");
        require(!loan.isRepaid, "Already repaid");

        uint256 repaymentAmount = calculateRepaymentAmount(_loanId);
        require(msg.value >= repaymentAmount, "Insufficient payment");

        loan.isActive = false;
        loan.isRepaid = true;

        // Return collateral to borrower
        (bool success, ) = payable(msg.sender).call{value: loan.collateralAmount}("");
        require(success, "Collateral transfer failed");

        // Return excess payment if any
        if (msg.value > repaymentAmount) {
            (bool excessSuccess, ) = payable(msg.sender).call{value: msg.value - repaymentAmount}("");
            require(excessSuccess, "Excess refund failed");
        }

        emit LoanRepaid(_loanId, msg.sender, repaymentAmount);
    }

    /**
     * @dev Calculate the total repayment amount including interest
     */
    function calculateRepaymentAmount(uint256 _loanId) 
        public 
        view 
        loanExists(_loanId) 
        returns (uint256) 
    {
        Loan memory loan = loans[_loanId];
        uint256 interest = (loan.loanAmount * loan.interestRate) / 10000;
        return loan.loanAmount + interest;
    }

    /**
     * @dev Get all loan IDs for a user
     */
    function getUserLoans(address _user) external view returns (uint256[] memory) {
        return userLoans[_user];
    }

    /**
     * @dev Get detailed information about a loan
     */
    function getLoanDetails(uint256 _loanId) 
        external 
        view 
        loanExists(_loanId) 
        returns (
            uint256 id,
            address borrower,
            uint256 collateralAmount,
            uint256 loanAmount,
            uint256 interestRate,
            uint256 createdAt,
            uint256 dueDate,
            bool isActive,
            bool isRepaid
        ) 
    {
        Loan memory loan = loans[_loanId];
        return (
            loan.id,
            loan.borrower,
            loan.collateralAmount,
            loan.loanAmount,
            loan.interestRate,
            loan.createdAt,
            loan.dueDate,
            loan.isActive,
            loan.isRepaid
        );
    }

    /**
     * @dev Get the contract's ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Add liquidity to the contract (owner only)
     */
    function addLiquidity() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
        emit LiquidityAdded(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw liquidity from the contract (owner only)
     */
    function withdrawLiquidity(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Accept ETH deposits for liquidity
     */
    receive() external payable {
        emit LiquidityAdded(msg.sender, msg.value);
    }
}
