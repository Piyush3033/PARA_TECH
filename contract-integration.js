// Smart Contract Integration for CryptoBank Loans - Browser Compatible Version with Activity Tracking
;(() => {
  // Import Web3 library
  const Web3 = window.Web3 // Use window.Web3 to ensure it's loaded in the browser

  // Activity and transaction tracking functions
  function saveTransaction(transactionData) {
    try {
      const transactions = JSON.parse(localStorage.getItem("transactions") || "[]")
      const newTransaction = {
        id: Date.now().toString(),
        hash: transactionData.hash || `tx_${Date.now()}`,
        type: transactionData.type,
        amount: transactionData.amount,
        from: transactionData.from,
        to: transactionData.to,
        status: transactionData.status || "confirmed",
        timestamp: Date.now(),
        ...transactionData,
      }

      transactions.push(newTransaction)
      localStorage.setItem("transactions", JSON.stringify(transactions))

      // Also save as activity
      saveActivity({
        type: "transaction",
        user: transactionData.from || "Unknown",
        description: `${transactionData.type.charAt(0).toUpperCase() + transactionData.type.slice(1)} transaction of ${transactionData.amount} ETH`,
        status: transactionData.status === "confirmed" ? "success" : transactionData.status,
        metadata: {
          amount: transactionData.amount,
          to: transactionData.to,
          hash: transactionData.hash,
        },
      })

      console.log("✅ Transaction saved:", newTransaction)
    } catch (error) {
      console.error("❌ Error saving transaction:", error)
    }
  }

  function saveActivity(activityData) {
    try {
      const activities = JSON.parse(localStorage.getItem("activities") || "[]")
      const newActivity = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...activityData,
      }

      activities.push(newActivity)

      // Keep only last 1000 activities
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000)
      }

      localStorage.setItem("activities", JSON.stringify(activities))
      console.log("✅ Activity saved:", newActivity)
    } catch (error) {
      console.error("❌ Error saving activity:", error)
    }
  }

  // Make functions globally available
  window.saveTransaction = saveTransaction
  window.saveActivity = saveActivity

  class CryptoBankContract {
    constructor() {
      // Simple Contract ABI for the deployed contract
      this.contractABI = [
        {
          constant: true,
          inputs: [],
          name: "owner",
          outputs: [{ name: "", type: "address" }],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
        {
          constant: true,
          inputs: [],
          name: "loanCount",
          outputs: [{ name: "", type: "uint256" }],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
        {
          constant: true,
          inputs: [{ name: "", type: "uint256" }],
          name: "loans",
          outputs: [
            { name: "borrower", type: "address" },
            { name: "collateral", type: "uint256" },
            { name: "amount", type: "uint256" },
            { name: "active", type: "bool" },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
        {
          constant: false,
          inputs: [],
          name: "createLoan",
          outputs: [],
          payable: true,
          stateMutability: "payable",
          type: "function",
        },
        {
          constant: false,
          inputs: [{ name: "loanId", type: "uint256" }],
          name: "repayLoan",
          outputs: [],
          payable: true,
          stateMutability: "payable",
          type: "function",
        },
        {
          constant: true,
          inputs: [{ name: "loanId", type: "uint256" }],
          name: "getLoan",
          outputs: [
            { name: "", type: "address" },
            { name: "", type: "uint256" },
            { name: "", type: "uint256" },
            { name: "", type: "bool" },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
        {
          constant: false,
          inputs: [],
          name: "addLiquidity",
          outputs: [],
          payable: true,
          stateMutability: "payable",
          type: "function",
        },
      ]

      // Default contract address - will be updated from deployment info
      this.contractAddress = "0x0290FB167208Af455bB137780163b7B7a9a10C16"
      this.contract = null
      this.web3 = null
      this.isInitialized = false
    }

    // Helper function to safely convert values to strings for BigInt compatibility
    safeToString(value) {
      if (typeof value === "bigint") {
        return value.toString()
      }
      if (typeof value === "object" && value !== null && typeof value.toString === "function") {
        return value.toString()
      }
      return String(value)
    }

    // Helper function to safely convert hex values
    safeFromHex(hexValue) {
      try {
        // Remove 0x prefix if present
        const cleanHex = hexValue.toString().replace("0x", "")
        // Convert to decimal string to avoid BigInt issues
        return Number.parseInt(cleanHex, 16).toString()
      } catch (error) {
        console.warn("Error converting hex value:", hexValue, error)
        return "0"
      }
    }

    async initialize() {
      try {
        console.log("🔄 Initializing smart contract...")

        // Check if MetaMask is available
        if (typeof window.ethereum === "undefined") {
          throw new Error("MetaMask not found. Please install MetaMask extension.")
        }
        console.log("✅ MetaMask detected")

        // Initialize Web3
        this.web3 = new Web3(window.ethereum)
        console.log("✅ Web3 initialized")

        // Test basic Web3 connection
        try {
          const networkId = await this.web3.eth.net.getId()
          console.log("✅ Connected to network:", this.safeToString(networkId))

          // Check if we're on Ganache (network ID 5777)
          const networkIdNum = Number(this.safeToString(networkId))
          if (networkIdNum !== 5777) {
            console.warn("⚠️  Warning: Not connected to Ganache. Expected network ID 5777, got:", networkIdNum)
          }
        } catch (error) {
          throw new Error("Cannot connect to blockchain network. Make sure Ganache is running on port 8545.")
        }

        // Try to load contract address from deployment info
        try {
          const response = await fetch("/deployment-info.json")
          if (response.ok) {
            const deploymentInfo = await response.json()
            if (deploymentInfo.contractAddress) {
              this.contractAddress = deploymentInfo.contractAddress
              console.log("✅ Contract address loaded from deployment info:", this.contractAddress)
            }
          } else {
            console.log("⚠️  No deployment info found, using default address:", this.contractAddress)
          }
        } catch (error) {
          console.log("⚠️  Could not load deployment info, using default address:", this.contractAddress)
        }

        // Validate contract address
        if (!this.contractAddress || this.contractAddress === "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE") {
          throw new Error("Invalid contract address. Please deploy the contract first using 'npm run deploy:simple'")
        }

        // Check if contract exists at address
        const contractCode = await this.web3.eth.getCode(this.contractAddress)
        if (contractCode === "0x" || contractCode === "0x0") {
          throw new Error(`No contract found at address ${this.contractAddress}. Please deploy the contract first.`)
        }
        console.log("✅ Contract code found at address")

        // Create contract instance
        this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
        console.log("✅ Contract instance created")

        // Test contract by calling a simple method
        try {
          const owner = await this.contract.methods.owner().call()
          console.log("✅ Contract test successful. Owner:", owner)
        } catch (error) {
          console.error("❌ Contract method call failed:", error)
          throw new Error(
            "Contract exists but method calls are failing. Check if the ABI matches the deployed contract.",
          )
        }

        // Check contract balance
        try {
          const balance = await this.web3.eth.getBalance(this.contractAddress)
          const balanceEth = this.web3.utils.fromWei(this.safeToString(balance), "ether")
          console.log("💰 Contract balance:", balanceEth, "ETH")

          if (Number.parseFloat(balanceEth) < 0.1) {
            console.warn(
              "⚠️  Warning: Contract has low balance. You may need to add liquidity using 'npm run add-liquidity'",
            )
          }
        } catch (error) {
          console.warn("⚠️  Could not check contract balance:", error.message)
        }

        this.isInitialized = true
        console.log("🎉 Smart contract initialized successfully!")
        return true
      } catch (error) {
        console.error("❌ Contract initialization failed:", error)
        this.isInitialized = false

        // Provide helpful error messages
        if (error.message.includes("MetaMask")) {
          console.log("💡 Solution: Install MetaMask browser extension")
        } else if (error.message.includes("network")) {
          console.log("💡 Solution: Make sure Ganache is running on http://127.0.0.1:8545")
        } else if (error.message.includes("contract")) {
          console.log("💡 Solution: Deploy the contract using 'npm run deploy:simple'")
        }

        throw error
      }
    }

    // Check if contract is initialized
    checkInitialized() {
      if (!this.isInitialized || !this.contract) {
        throw new Error("Smart contract not initialized. Please refresh the page and try again.")
      }
    }

    // Convert ETH to Wei with BigInt safety
    ethToWei(eth) {
      this.checkInitialized()
      try {
        const weiValue = this.web3.utils.toWei(eth.toString(), "ether")
        return this.safeToString(weiValue)
      } catch (error) {
        console.error("Error converting ETH to Wei:", error)
        throw new Error(`Failed to convert ${eth} ETH to Wei`)
      }
    }

    // Convert Wei to ETH with BigInt safety
    weiToEth(wei) {
      this.checkInitialized()
      try {
        const ethValue = this.web3.utils.fromWei(this.safeToString(wei), "ether")
        return ethValue
      } catch (error) {
        console.error("Error converting Wei to ETH:", error)
        return "0"
      }
    }

    // Create a new loan with BigInt handling and activity tracking
    async createLoan(collateralAmount, userAccount) {
      try {
        this.checkInitialized()

        const collateralWei = this.ethToWei(collateralAmount)
        console.log("Creating loan with collateral:", collateralAmount, "ETH")
        console.log("Collateral in Wei:", collateralWei)

        // Save pending transaction
        saveTransaction({
          type: "loan",
          amount: (Number.parseFloat(collateralAmount) * 0.7).toFixed(4), // 70% of collateral
          from: userAccount,
          to: this.contractAddress,
          status: "pending",
        })

        // Save loan creation activity
        saveActivity({
          type: "loan_create",
          user: userAccount,
          description: `Creating loan with ${collateralAmount} ETH collateral`,
          status: "pending",
          metadata: {
            collateral: collateralAmount,
            amount: (Number.parseFloat(collateralAmount) * 0.7).toFixed(4),
          },
        })

        // Estimate gas with proper value conversion
        let gasEstimate
        try {
          gasEstimate = await this.contract.methods.createLoan().estimateGas({
            from: userAccount,
            value: collateralWei,
          })
          console.log("Gas estimate:", this.safeToString(gasEstimate))
        } catch (gasError) {
          console.warn("Gas estimation failed, using default:", gasError.message)
          gasEstimate = 200000 // Default gas limit
        }

        // Send transaction with proper value and gas conversion
        const transaction = await this.contract.methods.createLoan().send({
          from: userAccount,
          value: collateralWei,
          gas: Math.floor(Number(this.safeToString(gasEstimate)) * 1.2), // Add 20% buffer
        })

        // Save successful transaction
        saveTransaction({
          type: "loan",
          amount: (Number.parseFloat(collateralAmount) * 0.7).toFixed(4),
          from: userAccount,
          to: this.contractAddress,
          status: "confirmed",
          hash: transaction.transactionHash,
        })

        // Update loan creation activity
        saveActivity({
          type: "loan_create",
          user: userAccount,
          description: `Successfully created loan with ${collateralAmount} ETH collateral`,
          status: "success",
          metadata: {
            collateral: collateralAmount,
            amount: (Number.parseFloat(collateralAmount) * 0.7).toFixed(4),
            hash: transaction.transactionHash,
          },
        })

        return {
          success: true,
          transactionHash: transaction.transactionHash,
          loanId: this.extractLoanIdFromTransaction(transaction),
        }
      } catch (error) {
        console.error("Error creating loan:", error)

        // Save failed transaction
        saveTransaction({
          type: "loan",
          amount: (Number.parseFloat(collateralAmount) * 0.7).toFixed(4),
          from: userAccount,
          to: this.contractAddress,
          status: "failed",
        })

        // Save failed loan creation activity
        saveActivity({
          type: "loan_create",
          user: userAccount,
          description: `Failed to create loan with ${collateralAmount} ETH collateral`,
          status: "failed",
          metadata: {
            collateral: collateralAmount,
            error: error.message,
          },
        })

        // Provide more specific error messages
        if (error.message.includes("BigInt")) {
          throw new Error("BigInt conversion error. Please try refreshing the page and trying again.")
        } else if (error.message.includes("insufficient funds")) {
          throw new Error("Insufficient funds for gas or collateral amount.")
        } else if (error.code === 4001) {
          throw new Error("Transaction rejected by user.")
        } else {
          throw new Error(`Loan creation failed: ${error.message}`)
        }
      }
    }

    // Repay a loan with BigInt handling and activity tracking
    async repayLoan(loanId, repaymentAmount, userAccount) {
      try {
        this.checkInitialized()

        const repaymentWei = this.ethToWei(repaymentAmount)
        console.log("Repaying loan with amount:", repaymentAmount, "ETH")
        console.log("Repayment in Wei:", repaymentWei)

        // Save pending transaction
        saveTransaction({
          type: "repayment",
          amount: repaymentAmount,
          from: userAccount,
          to: this.contractAddress,
          status: "pending",
        })

        // Save loan repayment activity
        saveActivity({
          type: "loan_repay",
          user: userAccount,
          description: `Repaying loan #${loanId} with ${repaymentAmount} ETH`,
          status: "pending",
          metadata: {
            loanId: loanId,
            amount: repaymentAmount,
          },
        })

        // Estimate gas
        let gasEstimate
        try {
          gasEstimate = await this.contract.methods.repayLoan(loanId).estimateGas({
            from: userAccount,
            value: repaymentWei,
          })
        } catch (gasError) {
          console.warn("Gas estimation failed, using default:", gasError.message)
          gasEstimate = 150000 // Default gas limit
        }

        const transaction = await this.contract.methods.repayLoan(loanId).send({
          from: userAccount,
          value: repaymentWei,
          gas: Math.floor(Number(this.safeToString(gasEstimate)) * 1.2),
        })

        // Save successful transaction
        saveTransaction({
          type: "repayment",
          amount: repaymentAmount,
          from: userAccount,
          to: this.contractAddress,
          status: "confirmed",
          hash: transaction.transactionHash,
        })

        // Update loan repayment activity
        saveActivity({
          type: "loan_repay",
          user: userAccount,
          description: `Successfully repaid loan #${loanId} with ${repaymentAmount} ETH`,
          status: "success",
          metadata: {
            loanId: loanId,
            amount: repaymentAmount,
            hash: transaction.transactionHash,
          },
        })

        return {
          success: true,
          transactionHash: transaction.transactionHash,
        }
      } catch (error) {
        console.error("Error repaying loan:", error)

        // Save failed transaction
        saveTransaction({
          type: "repayment",
          amount: repaymentAmount,
          from: userAccount,
          to: this.contractAddress,
          status: "failed",
        })

        // Save failed loan repayment activity
        saveActivity({
          type: "loan_repay",
          user: userAccount,
          description: `Failed to repay loan #${loanId} with ${repaymentAmount} ETH`,
          status: "failed",
          metadata: {
            loanId: loanId,
            amount: repaymentAmount,
            error: error.message,
          },
        })

        if (error.message.includes("BigInt")) {
          throw new Error("BigInt conversion error. Please try refreshing the page and trying again.")
        } else if (error.code === 4001) {
          throw new Error("Transaction rejected by user.")
        } else {
          throw new Error(`Loan repayment failed: ${error.message}`)
        }
      }
    }

    // Get user's loans with BigInt handling
    async getUserLoans(userAccount) {
      try {
        this.checkInitialized()

        const loanCount = await this.contract.methods.loanCount().call()
        const loanCountNum = Number(this.safeToString(loanCount))
        const loans = []

        for (let i = 1; i <= loanCountNum; i++) {
          try {
            const loan = await this.contract.methods.loans(i).call()
            if (loan.borrower.toLowerCase() === userAccount.toLowerCase()) {
              const loanDetails = {
                id: i,
                borrower: loan.borrower,
                collateralAmount: this.weiToEth(loan.collateral),
                loanAmount: this.weiToEth(loan.amount),
                interestRate: 5, // 5% fixed
                createdAt: Date.now(), // Simplified
                dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
                isActive: loan.active,
                isRepaid: !loan.active,
              }
              loans.push(loanDetails)
            }
          } catch (loanError) {
            console.warn(`Error loading loan ${i}:`, loanError.message)
          }
        }

        return loans
      } catch (error) {
        console.error("Error getting user loans:", error)
        return []
      }
    }

    // Get loan details with BigInt handling
    async getLoanDetails(loanId) {
      try {
        this.checkInitialized()

        const loan = await this.contract.methods.getLoan(loanId).call()

        return {
          id: loanId,
          borrower: loan[0],
          collateralAmount: this.weiToEth(loan[1]),
          loanAmount: this.weiToEth(loan[2]),
          interestRate: 5, // 5% fixed
          createdAt: Date.now(), // Simplified
          dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
          isActive: loan[3],
          isRepaid: !loan[3],
        }
      } catch (error) {
        console.error("Error getting loan details:", error)
        throw error
      }
    }

    // Extract loan ID from transaction receipt
    extractLoanIdFromTransaction(transaction) {
      try {
        if (transaction.events && transaction.events.LoanCreated) {
          return this.safeToString(transaction.events.LoanCreated.returnValues.loanId)
        }
        return null
      } catch (error) {
        console.warn("Error extracting loan ID:", error)
        return null
      }
    }

    // Listen for contract events
    subscribeToEvents(callback) {
      if (this.contract) {
        this.contract.events.allEvents().on("data", callback).on("error", console.error)
      }
    }
  }

  // Export for use in other files
  window.CryptoBankContract = CryptoBankContract

  // Auto-initialize when script loads
  console.log("📦 CryptoBankContract class loaded and ready")
})()
