// Test BigInt handling in Web3
const fs = require("fs")

let Web3
try {
  const web3Module = require("web3")
  Web3 = web3Module.Web3 || web3Module.default || web3Module
} catch (e) {
  console.error("❌ Could not import Web3")
  process.exit(1)
}

// Helper function to safely convert BigInt values
function safeToString(value) {
  if (typeof value === "bigint") {
    return value.toString()
  }
  if (typeof value === "object" && value !== null && typeof value.toString === "function") {
    return value.toString()
  }
  return String(value)
}

async function testBigIntHandling() {
  console.log("🧪 Testing BigInt handling...")

  try {
    const web3 = new Web3("http://127.0.0.1:8545")

    // Test basic Web3 operations
    console.log("1️⃣ Testing network connection...")
    const networkId = await web3.eth.net.getId()
    console.log("✅ Network ID:", safeToString(networkId))

    // Test balance conversion
    console.log("\n2️⃣ Testing balance conversion...")
    const accounts = await web3.eth.getAccounts()
    if (accounts.length > 0) {
      const balance = await web3.eth.getBalance(accounts[0])
      console.log("Raw balance:", typeof balance, balance)
      console.log("Safe balance:", safeToString(balance))

      const balanceEth = web3.utils.fromWei(safeToString(balance), "ether")
      console.log("✅ Balance in ETH:", balanceEth)
    }

    // Test Wei conversion
    console.log("\n3️⃣ Testing Wei conversion...")
    const testAmount = "0.1"
    const weiValue = web3.utils.toWei(testAmount, "ether")
    console.log("Wei value:", typeof weiValue, weiValue)
    console.log("Safe Wei value:", safeToString(weiValue))

    const backToEth = web3.utils.fromWei(safeToString(weiValue), "ether")
    console.log("✅ Back to ETH:", backToEth)

    // Test contract interaction if deployed
    console.log("\n4️⃣ Testing contract interaction...")
    if (fs.existsSync("deployment-info.json")) {
      const deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"))
      const contractAddress = deploymentInfo.contractAddress

      const contractABI = [
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
      const loanCount = await contract.methods.loanCount().call()
      console.log("Raw loan count:", typeof loanCount, loanCount)
      console.log("✅ Safe loan count:", safeToString(loanCount))
    }

    console.log("\n🎉 All BigInt tests passed!")
  } catch (error) {
    console.error("❌ BigInt test failed:", error.message)
    console.log("\n🔧 This error suggests BigInt compatibility issues.")
    console.log("💡 The updated contract integration should handle this.")
  }
}

if (require.main === module) {
  testBigIntHandling()
}

module.exports = { testBigIntHandling }
