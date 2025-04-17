// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TestToken
 * @dev A simple ERC20 token for testing Uniswap V2 functionality
 */
contract TestToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /**
     * @dev Constructor that gives the msg.sender all existing tokens
     * @param _name Name of the token
     * @param _symbol Symbol of the token
     * @param _initialSupply Initial token supply (in tokens, not wei)
     */
    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        // Convert initial supply from tokens to wei (with 18 decimals)
        uint256 initialSupplyInWei = _initialSupply * 10**uint256(decimals);
        _mint(msg.sender, initialSupplyInWei);
    }
    
    /**
     * @dev Transfer tokens to a specified address
     * @param _to The address to transfer to
     * @param _value The amount to be transferred
     * @return success boolean indicating whether the operation succeeded
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        _transfer(msg.sender, _to, _value);
        return true;
    }
    
    /**
     * @dev Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @return success boolean indicating whether the operation succeeded
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        
        allowance[_from][msg.sender] -= _value;
        _transfer(_from, _to, _value);
        return true;
    }
    
    /**
     * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender
     * @param _spender The address which will spend the funds
     * @param _value The amount of tokens to be spent
     * @return success boolean indicating whether the operation succeeded
     */
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    /**
     * @dev Internal function to mint tokens
     * @param _to The address that will receive the minted tokens
     * @param _value The amount of tokens to mint
     */
    function _mint(address _to, uint256 _value) internal {
        require(_to != address(0), "ERC20: mint to the zero address");
        
        totalSupply += _value;
        balanceOf[_to] += _value;
        emit Transfer(address(0), _to, _value);
    }
    
    /**
     * @dev Public mint function (for testing purposes only)
     * In a real token, this would be restricted to an owner or have other access controls
     */
    function mint(address _to, uint256 _value) public {
        _mint(_to, _value);
    }
    
    /**
     * @dev Internal function to handle transfers
     */
    function _transfer(address _from, address _to, uint256 _value) internal {
        require(_to != address(0), "ERC20: transfer to the zero address");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(_from, _to, _value);
    }
}