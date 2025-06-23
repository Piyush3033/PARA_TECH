// Script to fund the deployment account in Ganache
const Web3 = require("web3").Web3 || require("web3")

async function fundAccount() {
  try {
    const web3 = new Web3("http://127.0.0.1:8545")

    // Get all accounts from Ganache
    const accounts = await web3.eth.getAccounts()
    console.log("Available Ganache accounts:", accounts.length)

    if (accounts.length === 0) {
      console.error("❌ No accounts found. Make sure Ganache is running.")
      return
    }

    // The deployment account (first Ganache account)
    const deploymentAccount = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"

    // Check if deployment account exists in Ganache
    const deploymentBalance = await web3.eth.getBalance(deploymentAccount)
    console.log("Deployment account balance:", web3.utils.fromWei(deploymentBalance, "ether"), "ETH")

    if (Number.parseFloat(web3.utils.fromWei(deploymentBalance, "ether")) < 1) {
      console.log("💰 Funding deployment account...")

      // Send ETH from first available account to deployment account
      const fundingTx = await web3.eth.sendTransaction({
        from: accounts[0],
        to: deploymentAccount,
        value: web3.utils.toWei("10", "ether"), // Send 10 ETH
        gas: 21000,
      })

      console.log("✅ Funding transaction:", fundingTx.transactionHash)

      // Check new balance
      const newBalance = await web3.eth.getBalance(deploymentAccount)
      console.log("New deployment account balance:", web3.utils.fromWei(newBalance, "ether"), "ETH")
    } else {
      console.log("✅ Deployment account already has sufficient funds")
    }
  } catch (error) {
    console.error("❌ Error funding account:", error.message)
  }
}

if (require.main === module) {
  fundAccount()
}

module.exports = { fundAccount }
