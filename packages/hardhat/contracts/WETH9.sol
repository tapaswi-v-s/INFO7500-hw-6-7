// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title WETH9
 * @dev Wrapped Ether (WETH) implementation
 * This contract allows users to wrap ETH (deposit) and unwrap ETH (withdraw)
 * It follows ERC20 standard for token operations
 */
contract WETH9 {
    string public name = "Wrapped Ether";
    string public symbol = "WETH";
    uint8 public decimals = 18;

    event Approval(address indexed src, address indexed guy, uint wad);
    event Transfer(address indexed src, address indexed dst, uint wad);
    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    /**
     * @dev Fallback function to handle ETH deposits
     */
    receive() external payable {
        deposit();
    }

    /**
     * @dev Deposit ETH and receive WETH tokens
     */
    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw ETH by burning WETH tokens
     * @param wad Amount of WETH to burn
     */
    function withdraw(uint wad) public {
        require(balanceOf[msg.sender] >= wad, "WETH: insufficient balance");
        balanceOf[msg.sender] -= wad;
        payable(msg.sender).transfer(wad);
        emit Withdrawal(msg.sender, wad);
    }

    /**
     * @dev Get total supply (equals ETH locked in contract)
     */
    function totalSupply() public view returns (uint) {
        return address(this).balance;
    }

    /**
     * @dev Approve spender to spend tokens
     * @param guy Address of the spender
     * @param wad Amount of tokens to approve
     */
    function approve(address guy, uint wad) public returns (bool) {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    /**
     * @dev Transfer tokens to another address
     * @param dst Destination address
     * @param wad Amount of tokens
     */
    function transfer(address dst, uint wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    /**
     * @dev Transfer tokens from one address to another
     * @param src Source address
     * @param dst Destination address
     * @param wad Amount of tokens
     */
    function transferFrom(address src, address dst, uint wad) public returns (bool) {
        require(balanceOf[src] >= wad, "WETH: insufficient balance");

        if (src != msg.sender && allowance[src][msg.sender] != type(uint).max) {
            require(allowance[src][msg.sender] >= wad, "WETH: insufficient allowance");
            allowance[src][msg.sender] -= wad;
        }

        balanceOf[src] -= wad;
        balanceOf[dst] += wad;

        emit Transfer(src, dst, wad);

        return true;
    }
}