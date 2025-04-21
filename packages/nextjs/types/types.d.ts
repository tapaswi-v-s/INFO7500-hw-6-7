// Add Ethereum provider to the window object type
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
  };
  
  // NLP integration values
  nlpSwapAmount?: string;
  nlpDepositAmount0?: string;
  nlpDepositAmount1?: string;
  nlpRedeemPercentage?: string;
}