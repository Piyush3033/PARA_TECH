// Add liquidity to deployed contract
const fs = require("fs")

let Web3
try {
  const web3Module = require("web3")
  Web3 = web3Module.Web3 || web3Module.default || web3Module
} catch (e) {
  console.error("❌ Could not import Web3")
  process.exit(1)
}

async function addLiquidity() {
  try {
    console.log("💰 Adding liquidity to deployed contract...")

    const web3 = new Web3("http://127.0.0.1:8545")
    const privateKey = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
    const account = web3.eth.accounts.privateKeyToAccount(privateKey)
    web3.eth.accounts.wallet.add(account)

    // Use the known contract address
    const contractAddress = "0x0290FB167208Af455bB137780163b7B7a9a10C16"
    console.log("📍 Contract address:", contractAddress)

    // Check account balance
    const balance = await web3.eth.getBalance(account.address)
    console.log("💰 Account balance:", web3.utils.fromWei(balance, "ether"), "ETH")

    // Create contract instance
    const contractABI = [
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

    const contract = new web3.eth.Contract(contractABI, contractAddress)

    // Add smaller amount of liquidity
    const liquidityAmount = web3.utils.toWei("0.3", "ether") // 0.3 ETH
    console.log("💰 Adding", web3.utils.fromWei(liquidityAmount, "ether"), "ETH liquidity...")

    const tx = await contract.methods.addLiquidity().send({
      from: account.address,
      value: liquidityAmount,
      gas: 100000,
      gasPrice: web3.utils.toWei("20", "gwei"),
    })

    console.log("✅ Liquidity added successfully!")
    console.log("🔗 Transaction hash:", tx.transactionHash)

    // Check contract balance
    const contractBalance = await web3.eth.getBalance(contractAddress)
    console.log("💰 Contract balance:", web3.utils.fromWei(contractBalance, "ether"), "ETH")

    // Update deployment info
    const deploymentInfo = {
      contractAddress: contractAddress,
      deployedBy: account.address,
      deployedAt: new Date().toISOString(),
      abi: [
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
      ],
      network: "5777",
      contractBalance: web3.utils.fromWei(contractBalance, "ether"),
      liquidityAdded: true,
      liquidityAmount: web3.utils.fromWei(liquidityAmount, "ether"),
    }

    fs.writeFileSync("deployment-info.json", JSON.stringify(deploymentInfo, null, 2))
    console.log("💾 Deployment info updated")
  } catch (error) {
    console.error("❌ Failed to add liquidity:", error.message)
  }
}

if (require.main === module) {
  addLiquidity()
}

module.exports = { addLiquidity }
