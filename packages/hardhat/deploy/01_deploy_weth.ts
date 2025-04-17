import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the WETH9 contract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployWETH9: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy WETH9 with NO constructor arguments
  await deploy("WETH9", {
    from: deployer,
    // No constructor arguments for WETH9
    args: [], // Changed from [deployer] to [] - WETH9 has no constructor arguments
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const weth9Contract = await hre.ethers.getContract<Contract>("WETH9", deployer);
  
  // Print contract information (using methods that actually exist on WETH9)
  console.log("🪙 WETH9 Token Info:");
  console.log("- Name:", await weth9Contract.name());
  console.log("- Symbol:", await weth9Contract.symbol());
  console.log("- Decimals:", await weth9Contract.decimals());
  console.log("- Total Supply:", await weth9Contract.totalSupply());
  
  // Save this address for UniswapV2Router deployment
  console.log("\n⚠️ IMPORTANT: Save this WETH address for your Uniswap V2 Router deployment!");
  console.log(`WETH_ADDRESS=${await weth9Contract.address}`);
};

export default deployWETH9;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployWETH9.tags = ["WETH9"];