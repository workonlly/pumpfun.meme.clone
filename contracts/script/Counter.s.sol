// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {MemeCoinLaunchPad} from "src/Counter.sol";

contract CounterScript is Script {
    MemeCoinLaunchPad public launchpad;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        launchpad = new MemeCoinLaunchPad();

        vm.stopBroadcast();
    }
}
