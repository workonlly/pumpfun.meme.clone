// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // Added for security

contract MemeCoin is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply, address launchPad) ERC20(name, symbol) {
        _mint(launchPad, initialSupply * 10 ** decimals());
    }
}

contract MemeCoinLaunchPad is Ownable, ReentrancyGuard {
    uint256 public listingFee = 0.01 ether;
    address public dev;

    // The Curve Parameters
    uint256 public constant START_PRICE = 0.1 ether;
    uint256 public constant MATURITY_PRICE = 3.0 ether;
    uint256 public constant MATURITY_TARGET = 1000; // Represents WHOLE tokens

    struct CoinDetails {
        address creator;
        uint256 tokensSold; // Tracks WHOLE tokens
        bool isMatured;
    }

    mapping(address => CoinDetails) public coins;
    mapping(address => mapping(address => bool)) public isEarlyAdopter;
    mapping(address => mapping(address => bool)) public hasClaimedDiscount;

    event CoinPurchased(address indexed coin, address indexed buyer, uint256 amount, uint256 cost);
    event CoinMatured(address indexed coin);
    event CoinCreated(address indexed tokenAddress, address indexed creator, string name, string symbol);

    constructor() Ownable(msg.sender) {
        dev = msg.sender;
    }

    function createCoin(string memory name, string memory symbol, uint256 initialSupply) external payable returns (address) {
        require(msg.value >= listingFee, "Insufficient fee");
        
        MemeCoin newCoin = new MemeCoin(name, symbol, initialSupply, address(this));
        
        coins[address(newCoin)] = CoinDetails({
            creator: msg.sender,
            tokensSold: 0,
            isMatured: false
        });

        (bool feeSuccess, ) = dev.call{value: listingFee}("");
        require(feeSuccess, "Fee transfer failed");
        
        emit CoinCreated(address(newCoin), msg.sender, name, symbol);

        return address(newCoin);
    }

    // Helper function to calculate the exact curve price at a specific supply
    function getPriceAtSupply(uint256 supply) public pure returns (uint256) {
        if (supply >= MATURITY_TARGET) return MATURITY_PRICE;
        return START_PRICE + ((MATURITY_PRICE - START_PRICE) * supply) / MATURITY_TARGET;
    }

    // Added nonReentrant to protect the ETH refund at the bottom
    function buyTokens(address coinAddress, uint256 amountToBuy) external payable nonReentrant {
        CoinDetails storage coin = coins[coinAddress];
        require(coin.creator != address(0), "Coin does not exist");
        require(amountToBuy > 0, "Must buy at least 1 token");

        uint256 totalCost = 0;

        // PHASE 1: Pre-Maturity
        if (!coin.isMatured) {
            // Prevent buying past the target in a single transaction to keep math safe
            require(coin.tokensSold + amountToBuy <= MATURITY_TARGET, "Amount exceeds maturity target");
            
            isEarlyAdopter[coinAddress][msg.sender] = true;

            // FIXED MATH: Average price of the batch using arithmetic progression
            uint256 priceAtStart = getPriceAtSupply(coin.tokensSold);
            uint256 priceAtEnd = getPriceAtSupply(coin.tokensSold + amountToBuy);
            uint256 averagePrice = (priceAtStart + priceAtEnd) / 2;
            
            totalCost = averagePrice * amountToBuy;
            coin.tokensSold += amountToBuy;

            if (coin.tokensSold == MATURITY_TARGET) {
                coin.isMatured = true;
                emit CoinMatured(coinAddress);
            }
        } 
        // PHASE 2: Post-Maturity
        else {
            uint256 currentPrice = MATURITY_PRICE;

            if (isEarlyAdopter[coinAddress][msg.sender] && !hasClaimedDiscount[coinAddress][msg.sender]) {
                currentPrice = (MATURITY_PRICE * 90) / 100; 
                hasClaimedDiscount[coinAddress][msg.sender] = true; 
            }

            totalCost = currentPrice * amountToBuy;
        }

        require(msg.value >= totalCost, "Not enough ETH sent");

        // FIXED DECIMALS: Multiply the whole token amount by 1e18 for the ERC20 transfer!
        uint256 actualTokensToTransfer = amountToBuy * 1 ether; 
        MemeCoin(coinAddress).transfer(msg.sender, actualTokensToTransfer);

        if (msg.value > totalCost) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalCost}("");
            require(refundSuccess, "Refund failed");
        }

        emit CoinPurchased(coinAddress, msg.sender, amountToBuy, totalCost);
    }
}