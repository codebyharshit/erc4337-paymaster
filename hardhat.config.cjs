// // require("@nomicfoundation/hardhat-toolbox");
// // require("hardhat-gas-reporter");
// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: {
//     version: "0.8.15",
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 200, // Set the number of runs as required
//       },
//     },
//     network: {
//       localhost: "http://localhost:8545",
//     },
//   },
//   gasReporter: {
//     currency: "USD",
//     gasPrice: 100, // Set the gas price as required
//   },
// };

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [
        "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      ],
    },
  },
};
