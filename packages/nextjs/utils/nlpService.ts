import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// Token type for our system
interface Token {
  address: string;
  symbol: string;
}

// Define the operations our NLP system can handle
type Operation = "swap" | "deposit" | "redeem";

// Define structured output format using Zod schema
const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    operation: z.enum(["swap", "deposit", "redeem"]).describe("The operation to perform (swap, deposit, or redeem)"),
    tokens: z.array(
      z.object({
        symbol: z.string().describe("The token symbol mentioned in the request"),
        amount: z.number().optional().describe("The amount of token to use")
      })
    ).describe("Array of tokens mentioned in the request with their amounts"),
    slippage: z.number().optional().describe("Slippage tolerance if specified, default is 0.5%")
  })
);

// The format instructions that tell the model how to format its response
const formatInstructions = parser.getFormatInstructions();

// Initialize the language model
const initializeLanguageModel = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenAI API key is not set. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment variables.");
  }
  
  return new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: "gpt-4.1-nano-2025-04-14",
    temperature: 0
  });
};

// Create prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
You are an assistant that helps users interact with a Uniswap-like DeFi interface.
Parse the user request and extract the operation, tokens, and amounts.

Available operations:
- swap: Exchange one token for another
- deposit: Add liquidity to a token pair pool
- redeem: Remove liquidity from a token pair pool

Available tokens in the system:
- WETH (Wrapped Ether)
- TEST (Test Token)
- Any other token symbols the user might mention

Examples:
- "swap 10 WETH for TEST" would mean swapping 10 WETH tokens for TEST tokens
- "deposit 5 WETH and 20 TEST" would mean adding liquidity with 5 WETH and 20 TEST
- "redeem 50% of my WETH-TEST position" would mean removing 50% of liquidity from the WETH-TEST pool
- "swap 100 usdc for eth" would mean swapping 100 USDC tokens for ETH/WETH

User request: {userInput}

{formatInstructions}
`);

/**
 * Process a natural language request for Uniswap operations
 * @param userInput The natural language input from the user
 * @param availableTokens List of available tokens in the system
 * @returns Structured data about the operation to perform
 */
export async function processNaturalLanguageRequest(userInput: string, availableTokens: Token[]) {
  try {
    const model = initializeLanguageModel();
    
    // Create the prompt with user input and available tokens
    const tokenList = availableTokens.map(t => `- ${t.symbol} (${t.address})`).join('\n');
    const input = await promptTemplate.format({
      userInput,
      formatInstructions,
    });
    
    // Call the language model
    const response = await model.invoke(input);
    
    // Parse the structured output
    const parsedOutput = await parser.parse(response.content);
    
    // Map token symbols to actual token objects
    const mappedTokens = parsedOutput.tokens.map(token => {
      const foundToken = availableTokens.find(
        t => t.symbol.toLowerCase() === token.symbol.toLowerCase()
      );
      
      if (!foundToken && token.symbol.toLowerCase() === "eth") {
        // Special case for ETH, map to WETH
        const weth = availableTokens.find(
          t => t.symbol.toLowerCase() === "weth"
        );
        
        if (weth) {
          return {
            ...token,
            symbol: "WETH",
            address: weth.address,
          };
        }
      }
      
      return {
        ...token,
        address: foundToken?.address || "",
      };
    });
    
    return {
      ...parsedOutput,
      tokens: mappedTokens,
    };
  } catch (error) {
    console.error("Error processing natural language request:", error);
    throw new Error(`Failed to process request: ${error.message}`);
  }
}