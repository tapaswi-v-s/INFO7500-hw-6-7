// contracts.ts
import { Address } from "viem";

/**
 * This file contains the contract addresses and ABIs for your project.
 * Update the addresses with your deployed contracts.
 */

// Update these with your contract addresses
export const contractAddresses = {
  weth: process.env.NEXT_PUBLIC_WETH_ADDRESS as Address,
  testToken: process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS as Address,
  testToken2: process.env.NEXT_PUBLIC_TEST_TOKEN2_ADDRESS as Address,
  factory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address,
  router: process.env.NEXT_PUBLIC_ROUTER_ADDRESS as Address,
};

// Verify that all required addresses are defined
Object.entries(contractAddresses).forEach(([name, address]) => {
  if (!address) {
    console.warn(`⚠️ The ${name} address is not set in environment variables!`);
  }
});

export default contractAddresses;