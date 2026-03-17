// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MemeCoinLaunchPad} from "src/Counter.sol";

contract MemeCoinLaunchPadTest is Test {
    MemeCoinLaunchPad public launchpad;
    
    // FIXED: Safely generate fresh EOA (Externally Owned Account) wallets!
    address public dev = makeAddr("dev");
    address public alice = makeAddr("alice"); 
    address public bob = makeAddr("bob");   
    address public charlie = makeAddr("charlie"); 

    function setUp() public {
        // 1. Give our fake users 1000 test ETH each
        vm.deal(alice, 1000 ether);
        vm.deal(bob, 1000 ether);
        vm.deal(charlie, 1000 ether);

        // 2. Pretend to be the 'dev' wallet and deploy the Launchpad
        vm.startPrank(dev);
        launchpad = new MemeCoinLaunchPad();
        vm.stopPrank();
    }

    function testCreateCoin() public {
        vm.startPrank(alice);
        // Alice pays 0.01 ETH to launch her coin
        address newCoin = launchpad.createCoin{value: 0.01 ether}("Test Coin", "TST", 1000000);
        
        // Assert that the address is NOT 0x000... (meaning it successfully deployed)
        assertTrue(newCoin != address(0));
        vm.stopPrank();
    }

    function testEarlyAdopterDiscount() public {
        // --- PHASE 1: LAUNCH ---
        vm.prank(alice);
        address coinAddr = launchpad.createCoin{value: 0.01 ether}("Doge Clone", "DOGEC", 1000000);

        // --- PHASE 2: EARLY ADOPTER BUYS ---
        vm.startPrank(bob);
        // Bob buys 100 tokens early. We send 50 ETH just to be safe, the contract refunds the excess!
        launchpad.buyTokens{value: 50 ether}(coinAddr, 100);
        vm.stopPrank();

        // --- PHASE 3: REACHING MATURITY ---
        vm.startPrank(charlie);
        // Charlie buys 900 tokens. (100 + 900 = 1000 tokens sold). The coin is now Matured!
        launchpad.buyTokens{value: 900 ether}(coinAddr, 900);
        vm.stopPrank();

        // --- PHASE 4: THE DISCOUNT TEST ---
        vm.startPrank(bob);
        
        // We check Bob's ETH balance right before he buys
        uint256 ethBefore = bob.balance;
        
        // Bob buys 1 single token post-maturity. 
        // Normal price is 3.0 ETH. Bob should only pay 2.7 ETH (10% off).
        launchpad.buyTokens{value: 3 ether}(coinAddr, 1);
        
        uint256 ethAfter = bob.balance;
        uint256 amountSpent = ethBefore - ethAfter;

        // The Ultimate Proof: Did Bob pay exactly 2.7 ETH?
        assertEq(amountSpent, 2.7 ether);
        console.log("Success! Bob only paid 2.7 ETH instead of 3.0 ETH.");
        
        vm.stopPrank();
    }
}