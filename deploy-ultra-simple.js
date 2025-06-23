// Ultra-simple deployment script for older Ganache versions
const fs = require("fs")
const solc = require("solc")

let Web3
try {
  const web3Module = require("web3")
  Web3 = web3Module.Web3 || web3Module.default || web3Module
} catch (e) {
  console.error("❌ Could not import Web3")
  process.exit(1)
}

// Helper function to convert BigInt to string for JSON serialization
function bigIntReplacer(key, value) {
  if (typeof value === "bigint") {
    return value.toString()
  }
  return value
}

async function deployUltraSimple() {
  try {
    console.log("🚀 Deploying Ultra-Simple Contract...")

    const web3 = new Web3("http://127.0.0.1:8545")
    const privateKey = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
    const account = web3.eth.accounts.privateKeyToAccount(privateKey)
    web3.eth.accounts.wallet.add(account)

    console.log("📍 Deploying from:", account.address)

    // Check connection
    const networkId = await web3.eth.net.getId()
    const balance = await web3.eth.getBalance(account.address)
    console.log("🌐 Network ID:", networkId.toString())
    console.log("💰 Balance:", web3.utils.fromWei(balance, "ether"), "ETH")

    // Read contract source
    const contractSource = fs.readFileSync("contracts/SimpleLoan.sol", "utf8")

    // Compile with older Solidity version
    const input = {
      language: "Solidity",
      sources: {
        "SimpleLoan.sol": {
          content: contractSource,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode"],
          },
        },
      },
    }

    console.log("🔨 Compiling with Solidity 0.5.16...")
    const compiled = JSON.parse(solc.compile(JSON.stringify(input)))

    if (compiled.errors) {
      let hasErrors = false
      compiled.errors.forEach((error) => {
        if (error.severity === "error") {
          console.error("❌ Error:", error.formattedMessage)
          hasErrors = true
        } else {
          console.warn("⚠️  Warning:", error.formattedMessage)
        }
      })
      if (hasErrors) {
        throw new Error("Contract compilation failed")
      }
    }

    const contract = compiled.contracts["SimpleLoan.sol"]["SimpleLoan"]
    if (!contract) {
      throw new Error("Contract compilation failed - no contract found")
    }

    const abi = contract.abi
    const bytecode = contract.evm.bytecode.object

    console.log("✅ Contract compiled successfully")
    console.log("📊 Bytecode length:", bytecode.length)

    // Deploy with minimal gas
    const contractInstance = new web3.eth.Contract(abi)

    console.log("🚀 Deploying contract...")
    const deployedContract = await contractInstance
      .deploy({
        data: "0x" + bytecode,
      })
      .send({
        from: account.address,
        gas: 2000000, // 2M gas
        gasPrice: web3.utils.toWei("20", "gwei"),
      })

    console.log("🎉 Contract deployed successfully!")
    console.log("📍 Contract address:", deployedContract.options.address)

    // Test the contract
    console.log("🧪 Testing contract...")
    const owner = await deployedContract.methods.owner().call()
    console.log("👤 Contract owner:", owner)

    // Add liquidity
    console.log("💰 Adding liquidity...")
    await deployedContract.methods.addLiquidity().send({
      from: account.address,
      value: web3.utils.toWei("0.5", "ether"), // Reduced from 2 ETH to 0.5 ETH
      gas: 100000,
    })

    const contractBalance = await web3.eth.getBalance(deployedContract.options.address)
    console.log("💰 Contract balance:", web3.utils.fromWei(contractBalance, "ether"), "ETH")

    // Save deployment info with BigInt handling
    const deploymentInfo = {
      contractAddress: deployedContract.options.address,
      deployedBy: account.address,
      deployedAt: new Date().toISOString(),
      abi: abi,
      network: networkId.toString(), // Convert BigInt to string
      ganacheVersion: "7.9.2",
      uiVersion: "2.7.1",
      contractBalance: web3.utils.fromWei(contractBalance, "ether"),
    }

    // Use the custom replacer to handle BigInt values
    fs.writeFileSync("deployment-info.json", JSON.stringify(deploymentInfo, bigIntReplacer, 2))
    console.log("💾 Deployment info saved")

    return deployedContract
  } catch (error) {
    console.error("❌ Deployment failed:", error.message)
    if (error.stack) {
      console.error("Stack:", error.stack)
    }
    throw error
  }
}

if (require.main === module) {
  deployUltraSimple()
    .then(() => {
      console.log("🎊 Ultra-simple deployment completed!")
      console.log("📝 Next: Update contract address in js/contract-integration.js")
    })
    .catch((error) => {
      console.error("💥 Failed:", error.message)
      process.exit(1)
    })
}

module.exports = { deployUltraSimple }
