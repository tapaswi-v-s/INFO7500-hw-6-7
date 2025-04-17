import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the UniswapV2Router contract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployUniswapV2Router: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get the addresses of the Factory and WETH contracts
  // You can replace these with environment variables or config values
  // For now, I'm using placeholders that you need to replace
  
  // Try to get the factory address from previous deployment
  let factoryAddress;
  try {
    const factory = await hre.ethers.getContract("UniswapV2Factory");
    factoryAddress = factory.address;
    console.log("✅ Found UniswapV2Factory at:", factoryAddress);
  } catch (error) {
    // If factory hasn't been deployed yet or is not accessible
    console.log("⚠️ UniswapV2Factory not found in deployments");
    // Use a placeholder address - REPLACE THIS with your actual factory address
    factoryAddress = process.env.FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";
    console.log("ℹ️ Using factory address from environment:", factoryAddress);
  }

  // Try to get the WETH address from previous deployment
  let wethAddress;
  try {
    const weth = await hre.ethers.getContract("WETH9");
    wethAddress = weth.address;
    console.log("✅ Found WETH9 at:", wethAddress);
  } catch (error) {
    // If WETH hasn't been deployed yet or is not accessible
    console.log("⚠️ WETH9 not found in deployments");
    // Use a placeholder address - REPLACE THIS with your actual WETH address
    wethAddress = process.env.WETH_ADDRESS || "0x0000000000000000000000000000000000000000";
    console.log("ℹ️ Using WETH address from environment:", wethAddress);
  }

  // Make sure we have valid addresses
  if (factoryAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ Factory address is not set! Please deploy UniswapV2Factory first or set FACTORY_ADDRESS env variable.");
  }

  if (wethAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ WETH address is not set! Please deploy WETH9 first or set WETH_ADDRESS env variable.");
  }

  console.log("🚀 Deploying UniswapV2Router with:");
  console.log("   Factory:", factoryAddress);
  console.log("   WETH:   ", wethAddress);

  // Deploy the router with constructor arguments
  const routerDeployment = await deploy("UniswapV2Router", {
    from: deployer,
    args: ["0xc12bd03902cb4e6f63a396ddfa90eeda56e25e1f", "0x009587ae715e8091465876f3416c15dc36485e4b"],
    log: true,
    autoMine: true,
  });

  console.log("🎉 UniswapV2Router deployed at:", routerDeployment.address);

  // Get the deployed contract to interact with it and verify it's working
  const routerContract = await hre.ethers.getContract<Contract>("UniswapV2Router", deployer);
  
  // Verify the contract parameters
  const deployedFactory = await routerContract.factory();
  const deployedWETH = await routerContract.WETH();
  
  console.log("\n📝 Contract Verification:");
  console.log("- Factory address:", deployedFactory);
  console.log("- WETH address:   ", deployedWETH);
  
  // Verify the addresses match
  if (deployedFactory.toLowerCase() !== factoryAddress.toLowerCase()) {
    console.warn("⚠️ WARNING: Deployed factory address doesn't match provided address!");
  } else {
    console.log("✅ Factory address verified correctly");
  }
  
  if (deployedWETH.toLowerCase() !== wethAddress.toLowerCase()) {
    console.warn("⚠️ WARNING: Deployed WETH address doesn't match provided address!");
  } else {
    console.log("✅ WETH address verified correctly");
  }

  console.log("\n🔄 You can now interact with the router at:", routerDeployment.address);
  console.log("✨ Next steps: Create pools through the factory and add liquidity through the router");
};

export default deployUniswapV2Router;

// Tags for selective deployment
deployUniswapV2Router.tags = ["UniswapV2Router"];
// Dependencies ensure Factory and WETH are deployed first
deployUniswapV2Router.dependencies = ["UniswapV2Factory", "WETH9"];