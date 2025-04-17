# Uniswap V2 UI Setup Instructions

Follow these steps to set up your Uniswap V2 UI project using Scaffold-ETH.

## 1. Clone and Install Scaffold-ETH

```bash
# Clone the repository
git clone https://github.com/scaffold-eth/scaffold-eth-2.git uniswap-v2-ui

# Navigate to the project
cd uniswap-v2-ui

# Install dependencies
yarn install
```

## 2. Add the Contract Files and Components

1. Create the directories for your components:
   ```bash
   mkdir -p packages/nextjs/components/uniswap
   ```

2. Copy all the component files provided to `packages/nextjs/components/uniswap/`:
   - Header.tsx
   - AmountInput.tsx
   - TokenSelector.tsx
   - PoolSelector.tsx
   - SwapForm.tsx
   - AddLiquidity.tsx
   - RemoveLiquidity.tsx

3. Copy all the page files to `packages/nextjs/pages/`:
   - index.tsx
   - select-pool.tsx
   - swap.tsx
   - deposit.tsx
   - redeem.tsx

4. Create the config directory and add the contracts config:
   ```bash
   mkdir -p packages/nextjs/config
   ```
   - Add `contracts.ts` to this directory

5. Copy the `.env.local` file to the root of your project

## 3. Update Environment Variables

1. Edit the `.env.local` file with your actual contract addresses:
   ```
   NEXT_PUBLIC_WETH_ADDRESS=0x... # Your WETH9 address
   NEXT_PUBLIC_TEST_TOKEN_ADDRESS=0x... # Your TEST token address
   NEXT_PUBLIC_TEST_TOKEN2_ADDRESS=0x... # Your TEST2 token address
   NEXT_PUBLIC_FACTORY_ADDRESS=0x... # Your UniswapV2Factory address
   NEXT_PUBLIC_ROUTER_ADDRESS=0x... # Your UniswapV2Router address
   TENDERLY_RPC_URL=https://rpc.tenderly.co/fork/YOUR_FORK_ID
   ```

## 4. Configure Scaffold-ETH for Your Network

1. Update your RPC URL in `packages/nextjs/scaffold.config.ts`:
   ```typescript
   targetNetwork: chains.sepolia,  // Use Sepolia for Tenderly fork
   ```

2. Update `packages/nextjs/utils/scaffold-eth/networks.ts` to include your Tenderly fork URL.

## 5. Add Contract ABIs

1. Create a directory for your ABIs:
   ```bash
   mkdir -p packages/nextjs/generated/deployedContracts
   ```

2. Create a JSON file containing your contract ABIs in the proper format required by Scaffold-ETH.

## 6. Start the Development Server

```bash
# Start the development server
yarn start
```

## 7. Connect MetaMask to Your Tenderly Fork

1. Open MetaMask
2. Add a new network with your Tenderly fork RPC URL
3. Import your test account with test ETH

## 8. Test Your Application

1. First, navigate to the Deposit page and create a liquidity pool
2. Then, test swapping tokens in the Swap page
3. Finally, test removing liquidity in the Redeem page

## Troubleshooting

If you encounter any issues:

1. Check console errors in your browser
2. Verify your contract addresses in `.env.local`
3. Ensure your MetaMask is connected to the correct network
4. Verify you have test tokens and ETH in your wallet