import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a TestToken ERC20 contract for Uniswap testing
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployTestToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Configure your token properties here
  const tokenName = "Test Token";
  const tokenSymbol = "TEST";
  const initialSupply = 1000000; // 1 million tokens (will be multiplied by 10^18 in the contract)

  console.log(`Deploying TestToken with the following configuration:`);
  console.log(`- Name: ${tokenName}`);
  console.log(`- Symbol: ${tokenSymbol}`);
  console.log(`- Initial Supply: ${initialSupply.toLocaleString()} tokens`);

  // Deploy the test token
  const tokenDeployment = await deploy("TestToken", {
    from: deployer,
    args: [tokenName, tokenSymbol, initialSupply],
    log: true,
    autoMine: true,
  });

  console.log(`✅ TestToken deployed at: ${tokenDeployment.address}`);

  // Get the deployed contract to verify it's working
  const tokenContract = await hre.ethers.getContract<Contract>("TestToken", deployer);
  
  // Verify the token parameters
  const deployedName = await tokenContract.name();
  const deployedSymbol = await tokenContract.symbol();
  const deployedTotalSupply = await tokenContract.totalSupply();
  const deployerBalance = await tokenContract.balanceOf(deployer);
  
  console.log("\n📝 Token Verification:");
  console.log(`- Name: ${deployedName}`);
  console.log(`- Symbol: ${deployedSymbol}`);
  console.log(`- Total Supply: ${hre.ethers.utils.formatEther(deployedTotalSupply)} ${deployedSymbol}`);
  console.log(`- Deployer Balance: ${hre.ethers.utils.formatEther(deployerBalance)} ${deployedSymbol}`);

  // Deploy a second test token for creating multiple pools
  const token2Name = "Second Test Token";
  const token2Symbol = "TEST2";
  const token2Supply = 2000000; // 2 million tokens
  
  console.log(`\nDeploying a second TestToken for pool creation:`);
  console.log(`- Name: ${token2Name}`);
  console.log(`- Symbol: ${token2Symbol}`);
  console.log(`- Initial Supply: ${token2Supply.toLocaleString()} tokens`);
  
  const token2Deployment = await deploy("TestToken2", {
    contract: "TestToken", // Use the same contract, just with a different name
    from: deployer,
    args: [token2Name, token2Symbol, token2Supply],
    log: true,
    autoMine: true,
  });
  
  console.log(`✅ TestToken2 deployed at: ${token2Deployment.address}`);
  
  // Get the second deployed token contract
  const token2Contract = await hre.ethers.getContract<Contract>("TestToken2", deployer);
  
  // Verify the second token parameters
  const deployed2Name = await token2Contract.name();
  const deployed2Symbol = await token2Contract.symbol();
  const deployed2TotalSupply = await token2Contract.totalSupply();
  
  console.log("\n📝 Second Token Verification:");
  console.log(`- Name: ${deployed2Name}`);
  console.log(`- Symbol: ${deployed2Symbol}`);
  console.log(`- Total Supply: ${hre.ethers.utils.formatEther(deployed2TotalSupply)} ${deployed2Symbol}`);
  
  console.log("\n🔄 Next Steps:");
  console.log("1. Deploy the UniswapV2Factory contract");
  console.log("2. Deploy the UniswapV2Router contract using Factory and WETH9 addresses");
  console.log("3. Create liquidity pools using these test tokens");
  
  // Save the token addresses for easy reference
  console.log("\n📋 Save these addresses for your configuration:");
  console.log(`TEST_TOKEN_ADDRESS=${tokenDeployment.address}`);
  console.log(`TEST_TOKEN2_ADDRESS=${token2Deployment.address}`);
};

export default deployTestToken;

// Tags for selective deployment
deployTestToken.tags = ["TestTokens"];