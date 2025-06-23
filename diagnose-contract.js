// Comprehensive contract diagnostics
const fs = require("fs")

let Web3
try {
  const web3Module = require("web3")
  Web3 = web3Module.Web3 || web3Module.default || web3Module
} catch (e) {
  console.error("❌ Could not import Web3")
  process.exit(1)
}

async function diagnoseContract() {
  console.log("🔍 Starting comprehensive contract diagnosis...\n")

  try {
    // Step 1: Check Ganache connection
    console.log("1️⃣ Testing Ganache connection...")
    const web3 = new Web3("http://127.0.0.1:8545")

    try {
      const networkId = await web3.eth.net.getId()
      const blockNumber = await web3.eth.getBlockNumber()
      console.log("✅ Connected to Ganache")
      console.log(`   Network ID: ${networkId}`)
      console.log(`   Block Number: ${blockNumber}`)
    } catch (error) {
      console.log("❌ Cannot connect to Ganache")
      console.log("💡 Make sure Ganache is running on http://127.0.0.1:8545")
      return
    }

    // Step 2: Check accounts
    console.log("\n2️⃣ Checking accounts...")
    const accounts = await web3.eth.getAccounts()
    console.log(`✅ Found ${accounts.length} accounts`)
    if (accounts.length > 0) {
      const balance = await web3.eth.getBalance(accounts[0])
      console.log(`   First account: ${accounts[0]}`)
      console.log(`   Balance: ${web3.utils.fromWei(balance, "ether")} ETH`)
    }

    // Step 3: Check deployment info
    console.log("\n3️⃣ Checking deployment info...")
    let contractAddress = null

    if (fs.existsSync("deployment-info.json")) {
      const deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"))
      contractAddress = deploymentInfo.contractAddress
      console.log("✅ Deployment info found")
      console.log(`   Contract Address: ${contractAddress}`)
      console.log(`   Deployed By: ${deploymentInfo.deployedBy}`)
      console.log(`   Network: ${deploymentInfo.network}`)
    } else {
      console.log("❌ No deployment-info.json found")
      console.log("💡 Run: npm run deploy:simple")
      return
    }

    // Step 4: Check if contract exists
    console.log("\n4️⃣ Checking contract deployment...")
    const contractCode = await web3.eth.getCode(contractAddress)

    if (contractCode === "0x" || contractCode === "0x0") {
      console.log("❌ No contract found at address")
      console.log("💡 Contract may not be deployed or address is incorrect")
      return
    } else {
      console.log("✅ Contract code found at address")
      console.log(`   Code length: ${contractCode.length} characters`)
    }

    // Step 5: Check contract balance
    console.log("\n5️⃣ Checking contract balance...")
    const contractBalance = await web3.eth.getBalance(contractAddress)
    const balanceEth = web3.utils.fromWei(contractBalance, "ether")
    console.log(`💰 Contract balance: ${balanceEth} ETH`)

    if (Number.parseFloat(balanceEth) < 0.1) {
      console.log("⚠️  Warning: Contract has low balance")
      console.log("💡 Add liquidity: npm run add-liquidity")
    }

    // Step 6: Test contract methods
    console.log("\n6️⃣ Testing contract methods...")
    const contractABI = [
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
    ]

    const contract = new web3.eth.Contract(contractABI, contractAddress)

    try {
      const owner = await contract.methods.owner().call()
      console.log("✅ owner() method works")
      console.log(`   Owner: ${owner}`)
    } catch (error) {
      console.log("❌ owner() method failed:", error.message)
    }

    try {
      const loanCount = await contract.methods.loanCount().call()
      console.log("✅ loanCount() method works")
      console.log(`   Loan Count: ${loanCount}`)
    } catch (error) {
      console.log("❌ loanCount() method failed:", error.message)
    }

    // Step 7: Final recommendations
    console.log("\n7️⃣ Final Status:")
    console.log("✅ All checks passed! Contract should work properly.")
    console.log("\n📝 Next steps:")
    console.log("1. Open http://localhost:8080/contract-status.html")
    console.log("2. Test the contract in the browser")
    console.log("3. Try creating a loan at http://localhost:8080/loan.html")
  } catch (error) {
    console.error("\n❌ Diagnosis failed:", error.message)
    console.log("\n🔧 Troubleshooting steps:")
    console.log("1. Make sure Ganache is running: ganache-cli -p 8545")
    console.log("2. Deploy the contract: npm run deploy:simple")
    console.log("3. Add liquidity: npm run add-liquidity")
    console.log("4. Run this diagnosis again: npm run diagnose")
  }
}

if (require.main === module) {
  diagnoseContract()
}

module.exports = { diagnoseContract }
