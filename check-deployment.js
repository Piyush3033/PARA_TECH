// Check if contract is deployed and working
const fs = require("fs")

let Web3
try {
  const web3Module = require("web3")
  Web3 = web3Module.Web3 || web3Module.default || web3Module
} catch (e) {
  console.error("❌ Could not import Web3")
  process.exit(1)
}

async function checkDeployment() {
  try {
    console.log("🔍 Checking contract deployment...")

    // Check if deployment info exists
    if (!fs.existsSync("deployment-info.json")) {
      console.log("❌ No deployment info found")
      console.log("💡 Run: npm run deploy:simple")
      return false
    }

    const deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"))
    console.log("📍 Contract address:", deploymentInfo.contractAddress)

    // Connect to Ganache
    const web3 = new Web3("http://127.0.0.1:8545")

    // Check if contract exists
    const code = await web3.eth.getCode(deploymentInfo.contractAddress)
    if (code === "0x") {
      console.log("❌ Contract not found at address")
      return false
    }

    console.log("✅ Contract found and deployed")

    // Test contract interaction
    const contract = new web3.eth.Contract(deploymentInfo.abi, deploymentInfo.contractAddress)
    const owner = await contract.methods.owner().call()
    console.log("👤 Contract owner:", owner)

    const balance = await web3.eth.getBalance(deploymentInfo.contractAddress)
    console.log("💰 Contract balance:", web3.utils.fromWei(balance, "ether"), "ETH")

    console.log("🎉 Contract is ready for use!")
    return true
  } catch (error) {
    console.error("❌ Deployment check failed:", error.message)
    return false
  }
}

if (require.main === module) {
  checkDeployment()
}

module.exports = { checkDeployment }
