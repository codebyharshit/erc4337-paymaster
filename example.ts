// import {
//   SimpleAccountFactory__factory,
//   EntryPoint__factory,
//   SimpleAccount__factory,
//   EntryPoint,
//   UserOperationStruct,
// } from "@account-abstraction/contracts";
// import { Provider, StaticJsonRpcProvider } from "@ethersproject/providers";
// import { BigNumber, Wallet, constants, utils } from "ethers";
// import { getERC20Paymaster } from "@pimlico/erc20-paymaster";
// import dotenv from "dotenv";
// import { paymaster } from "./abi/verifyingPaymaster.js";
// import { entryPointAbi } from "./abi/entryPointContract.js";
// import { hexConcat } from "@ethersproject/bytes";
// import { ethers } from "ethers";

// dotenv.config();

// // GENERATE THE INITCODE
// // const SIMPLE_ACCOUNT_FACTORY_ADDRESS =
// //   "0x9406Cc6185a346906296840746125a0E44976454";
// const SIMPLE_ACCOUNT_FACTORY_ADDRESS =
//   "0x726D28372eDCe13382BeBD7F91edD066045C1255";

// const lineaProvider = new StaticJsonRpcProvider(
//   "https://polygon-mumbai.g.alchemy.com/v2/vKN3SWGBGfPXo5afbsJN-wipI1An_cqm"
// );

// // const owner = new Wallet(
// //   "51a148bd30f99cc8d21d98c650f85c6071d3b5eac9ab1770283064ecb9f33459  2d1a8afe8263cf083b4b70428ef12082c83e8c47622cdaea7b4bb89f0faa59a7"
// // ).connect(lineaProvider);
// // console.log("Owner", owner);

// const privateKey =
//   "2d1a8afe8263cf083b4b70428ef12082c83e8c47622cdaea7b4bb89f0faa59a7";
// const owner = new Wallet(privateKey);
// console.log("address", owner.address);
// // const owner = Wallet.createRandom();
// // console.log("Generated wallet with private key:", owner.privateKey);

// const MOCK_VALID_UNTIL = "0x00000000deadbeef";
// const MOCK_VALID_AFTER = "0x0000000000001234";

// const simpleAccountFactory = SimpleAccountFactory__factory.connect(
//   SIMPLE_ACCOUNT_FACTORY_ADDRESS,
//   lineaProvider
// );
// const initCode = utils.hexConcat([
//   SIMPLE_ACCOUNT_FACTORY_ADDRESS,
//   simpleAccountFactory.interface.encodeFunctionData("createAccount", [
//     owner.address,
//     0,
//   ]),
// ]);

// console.log("Generated initCode:", initCode);

// // const alchemyUrl = process.env.ALCHEMY_URL;
// const provider = new ethers.providers.JsonRpcProvider(
//   "https://polygon-mumbai.g.alchemy.com/v2/vKN3SWGBGfPXo5afbsJN-wipI1An_cqm"
// );
// // console.log("provider", provider);

// // CALCULATE THE SENDER ADDRESS
// const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

// const verifyingPaymaterContract = "0x4ed8A35E1dF2Fa4F675371F2f1cD716273a033Cd";
// // const verifyingPaymaterContract *OLD* = "0xCCF621F6B06E42cD971D42c5B078fc8441c2d0A7";
// const VerifyingAbi = ethers.utils.defaultAbiCoder;

// const contract = new ethers.Contract(
//   verifyingPaymaterContract,
//   paymaster,
//   provider
// );
// // const EntryPointContract = new ethers.Contract(
// //   ENTRY_POINT_ADDRESS,
// //   entryPointAbi,
// //   provider
// // );

// const entryPoint = EntryPoint__factory.connect(
//   ENTRY_POINT_ADDRESS,
//   lineaProvider
// );

// console.log("entryPoint", entryPoint);

// const senderAddress = await entryPoint.callStatic
//   .getSenderAddress(initCode)
//   .then(() => {
//     throw new Error("Expected getSenderAddress() to revert");
//   })
//   .catch((e) => {
//     const data = e.message.match(/0x6ca7b806([a-fA-F\d]*)/)?.[1];
//     if (!data) {
//       return Promise.reject(new Error("Failed to parse revert data" + e));
//     }
//     const addr = utils.getAddress(`0x${data.slice(24, 64)}`);
//     return Promise.resolve(addr);
//   });

// console.log("Calculated sender address:", senderAddress);

// // const senderAddress = "0xe221Dc82074cdd869229CCdC21288fA32EEFabd7";

// // GENERATE THE CALLDATA
// const to = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik
// const value = 0;
// const data = "0x68656c6c6f"; // "hello" encoded to utf-8 bytes

// const simpleAccount = SimpleAccount__factory.connect(
//   senderAddress,
//   lineaProvider
// );

// const callData = simpleAccount.interface.encodeFunctionData("execute", [
//   to,
//   value,
//   data,
// ]);

// console.log("Generated callData:", callData);

// // FILL OUT REMAINING USER OPERATION VALUES
// const gasPrice = await lineaProvider.getGasPrice();
// console.log("gasPrice", gasPrice);

// const userOperation = {
//   sender: senderAddress,
//   nonce: utils.hexlify(2),
//   initCode: "0x",
//   callData,
//   callGasLimit: utils.hexlify(100_000), // hardcode it for now at a high value
//   verificationGasLimit: utils.hexlify(400_000), // hardcode it for now at a high value
//   preVerificationGas: utils.hexlify(50_000), // hardcode it for now at a high value
//   maxFeePerGas: utils.hexlify(gasPrice),
//   maxPriorityFeePerGas: utils.hexlify(gasPrice),
//   paymasterAndData: "0x",
//   signature: "0x",
// };

// console.log("userOps", userOperation);

// // const chain = "mumbai";
// // const apiKey = process.env.PIMLICO_API_KEY;

// // const pimlicoEndpoint = `https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`;
// const pimlicoEndpoint = `http://localhost:3000/rpc`;

// console.log("pimlicoEndpoint", pimlicoEndpoint);

// const pimlicoProvider = new StaticJsonRpcProvider(pimlicoEndpoint);

// console.log("pimlicoProvider", pimlicoProvider);
// // const sponsorUserOperationResult = await pimlicoProvider.send(
// //   "pm_sponsorUserOperation",
// //   [
// //     userOperation,
// //     {
// //       entryPoint: ENTRY_POINT_ADDRESS,
// //     },
// //   ]
// // );

// // console.log("sponsorUserOperationResult", sponsorUserOperationResult);
// //   {
// //     sender: walletAddress,
// //   },
// //   walletOwner,
// //   entryPoint,
// //   "nonce"
// // );

// const hash = await contract.getHash(
//   userOperation,
//   MOCK_VALID_UNTIL,
//   MOCK_VALID_AFTER
// );

// console.log("hash", hash);

// const sig = await owner.signMessage(utils.arrayify(hash));
// console.log("sig", sig);
// console.log("sig", sig.length);

// // const paymasterData = abi.encode(
// //   ["uint256", "uint256", "bytes"],
// //   [MOCK_VALID_UNTIL, MOCK_VALID_AFTER, sig]
// // );

// const paymasterAndData = hexConcat([
//   verifyingPaymaterContract,
//   utils.solidityPack(
//     ["uint256", "uint256", "bytes"],
//     [MOCK_VALID_UNTIL, MOCK_VALID_AFTER, sig]
//   ),
// ]);

// // console.log("paymasterData", paymasterData);
// // console.log("paymasterData", paymasterData.length);
// // const paymasterAndData = hexConcat([verifyingPaymaterContract, paymasterData]);

// userOperation.paymasterAndData = paymasterAndData;

// console.log("Pimlico paymasterAndData:", paymasterAndData);

// // SIGN THE USER OPERATION
// const chainId = 80001;

// // const finalUseropHash = hexConcat([
// //   utils.solidityPack(
// //     ["bytes", "address", "uint256"],
// //     [
// //       utils.arrayify(await entryPoint.getUserOpHash(userOperation)),
// //       ENTRY_POINT_ADDRESS,
// //       chainId,
// //     ]
// //   ),
// // ]);
// const finalUseropHash = await entryPoint.getUserOpHash(userOperation);
// console.log("finalUseropHash", finalUseropHash);

// // const signature = await owner.signMessage(
// //   utils.arrayify(await entryPoint.getUserOpHash(userOperation))
// // );

// const signature = await owner.signMessage(utils.arrayify(finalUseropHash));

// userOperation.signature = signature;

// console.log("UserOperation signature:", signature);
// console.log("UserOperation:", userOperation);

// // SUBMIT THE USER OPERATION TO BE BUNDLED
// const userOperationHash = await pimlicoProvider.send("eth_sendUserOperation", [
//   userOperation,
//   ENTRY_POINT_ADDRESS,
// ]);

// console.log("UserOperation hash:", userOperationHash);

// // let's also wait for the userOperation to be included, by continually querying for the receipts
// console.log("Querying for receipts...");
// let receipt = null;
// while (receipt === null) {
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   receipt = await pimlicoProvider.send("eth_getUserOperationReceipt", [
//     userOperationHash,
//   ]);
//   console.log(receipt === null ? "Still waiting..." : receipt);
// }

// const txHash = receipt.receipt.transactionHash;

// console.log(
//   `UserOperation included: https://goerli.lineascan.build/tx/${txHash}`
// );

// *** SECOND IMPLEMENTATION *** //

// import {
//   SimpleAccountFactory__factory,
//   EntryPoint__factory,
//   SimpleAccount__factory,
//   EntryPoint,
//   UserOperationStruct,
// } from "@account-abstraction/contracts";
// import { Provider, StaticJsonRpcProvider } from "@ethersproject/providers";
// import { BigNumber, Wallet, constants, utils } from "ethers";
// import { getERC20Paymaster } from "@pimlico/erc20-paymaster";
// import dotenv from "dotenv";
// import { paymaster } from "./abi/verifyingPaymaster.js";
// import { entryPointAbi } from "./abi/entryPointContract.js";
// import { hexConcat } from "@ethersproject/bytes";
// import { ethers } from "ethers";

// dotenv.config();

// function getRandomInt(max: any) {
//   return Math.floor(Math.random() * max);
// }

// // GENERATE THE INITCODE
// const SIMPLE_ACCOUNT_FACTORY_ADDRESS =
//   "0x06DE0387f27fDbB11c9972c5AB3b3BacD5a0C158";
// const lineaProvider = new StaticJsonRpcProvider(
//   "https://polygon-mumbai.g.alchemy.com/v2/vKN3SWGBGfPXo5afbsJN-wipI1An_cqm"
// );

// const privateKey =
//   "2d1a8afe8263cf083b4b70428ef12082c83e8c47622cdaea7b4bb89f0faa59a7";
// const owner = new Wallet(privateKey);
// // const owner = Wallet.createRandom();
// console.log("Generated wallet with private key:", owner.privateKey);

// const MOCK_VALID_UNTIL = "0x00000000deadbeef";
// const MOCK_VALID_AFTER = "0x0000000000001234";

// const simpleAccountFactory = SimpleAccountFactory__factory.connect(
//   SIMPLE_ACCOUNT_FACTORY_ADDRESS,
//   lineaProvider
// );

// const initCode = utils.hexConcat([
//   SIMPLE_ACCOUNT_FACTORY_ADDRESS,
//   simpleAccountFactory.interface.encodeFunctionData("createAccount", [
//     owner.address,
//     0,
//   ]),
// ]);

// console.log("Generated initCode:", initCode);

// const alchemyUrl = process.env.ALCHEMY_URL;
// const provider = new ethers.providers.JsonRpcProvider(alchemyUrl);

// // CALCULATE THE SENDER ADDRESS
// const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

// // const verifyingPaymaterContract = "0xd9f6D814DAAFbDacd5d260d781AD3A73ABD3aa8b";
// const verifyingPaymaterContract = "0x94a9cFEe99c9770135f6eAF2eD83396024e65cC8";

// const contract = new ethers.Contract(
//   verifyingPaymaterContract,
//   paymaster,
//   provider
// );

// const EntryPointContract = new ethers.Contract(
//   ENTRY_POINT_ADDRESS,
//   entryPointAbi,
//   provider
// );

// const entryPoint = EntryPoint__factory.connect(
//   ENTRY_POINT_ADDRESS,
//   lineaProvider
// );

// const senderAddress = await entryPoint.callStatic
//   .getSenderAddress(initCode)
//   .then(() => {
//     throw new Error("Expected getSenderAddress() to revert");
//   })
//   .catch((e) => {
//     const data = e.message.match(/0x6ca7b806([a-fA-F\d]*)/)?.[1];
//     if (!data) {
//       return Promise.reject(new Error("Failed to parse revert data"));
//     }
//     const addr = utils.getAddress(`0x${data.slice(24, 64)}`);
//     return Promise.resolve(addr);
//   });

// console.log("Calculated sender address:", senderAddress);

// // let nonce = await provider.getTransactionCount(senderAddress);
// // console.log("nonce", nonce);
// //@ts-ignore

// let nonce = await provider.getTransactionCount(senderAddress);
// console.log("Nonce returned " + nonce);
// nonce = nonce + 1;

// // GENERATE THE CALLDATA
// const to = "0x303e4174cE81eC5d3dE9eE4749F5455a91AB1b25"; // vitalik
// const value = 0;
// const data = "0x68656c6c6f"; // "hello" encoded to utf-8 bytes

// const simpleAccount = SimpleAccount__factory.connect(
//   senderAddress,
//   lineaProvider
// );

// const callData = simpleAccount.interface.encodeFunctionData("execute", [
//   to,
//   value,
//   data,
// ]);

// console.log("Generated callData:", callData);

// // FILL OUT REMAINING USER OPERATION VALUES
// const gasPrice = await lineaProvider.getGasPrice();
// console.log("gasPrice", gasPrice);

// const userOperation = {
//   sender: senderAddress,
//   nonce: utils.hexlify(nonce),
//   initCode,
//   callData,
//   callGasLimit: utils.hexlify(100_000), // hardcode it for now at a high value
//   verificationGasLimit: utils.hexlify(400_000), // hardcode it for now at a high value
//   preVerificationGas: utils.hexlify(50_000), // hardcode it for now at a high value
//   maxFeePerGas: utils.hexlify(gasPrice),
//   maxPriorityFeePerGas: utils.hexlify(gasPrice),
//   paymasterAndData: "0x",
//   signature: "0x",
// };

// console.log("userOps", userOperation);

// const chain = "mumbai";
// const apiKey = process.env.PIMLICO_API_KEY;

// const pimlicoEndpoint = `http://localhost:3000/rpc`;

// console.log("pimlicoEndpoint", pimlicoEndpoint);

// const pimlicoProvider = new StaticJsonRpcProvider(pimlicoEndpoint);

// console.log("pimlicoProvider", pimlicoProvider);

// const hash = await contract.getHash(
//   userOperation,
//   MOCK_VALID_UNTIL,
//   MOCK_VALID_AFTER
// );

// console.log("hash", hash);

// const sig = await owner.signMessage(utils.arrayify(hash));
// console.log("sig", sig);
// console.log("sig", sig.length);

// const paymasterAndData = hexConcat([
//   verifyingPaymaterContract,
//   utils.solidityPack(
//     ["uint256", "uint256", "bytes"],
//     [MOCK_VALID_UNTIL, MOCK_VALID_AFTER, sig]
//   ),
// ]);

// userOperation.paymasterAndData = paymasterAndData;

// console.log("Pimlico paymasterAndData:", paymasterAndData);

// // SIGN THE USER OPERATION
// const chainId = 80001;

// // const finalUseropHash = hexConcat([
// //   utils.solidityPack(
// //     ["bytes", "address", "uint256"],
// //     [
// //       utils.arrayify(await entryPoint.getUserOpHash(userOperation)),
// //       ENTRY_POINT_ADDRESS,
// //       chainId,
// //     ]
// //   ),
// // ]);
// const finalUseropHash = await entryPoint.getUserOpHash(userOperation);
// console.log("finalUseropHash", finalUseropHash);

// // const signature = await owner.signMessage(
// //   utils.arrayify(await entryPoint.getUserOpHash(userOperation))
// // );

// const signature = await owner.signMessage(utils.arrayify(finalUseropHash));

// userOperation.signature = signature;

// console.log("UserOperation signature:", signature);
// console.log("UserOperation:", userOperation);

// // SUBMIT THE USER OPERATION TO BE BUNDLED
// const userOperationHash = await pimlicoProvider.send("eth_sendUserOperation", [
//   userOperation,
//   ENTRY_POINT_ADDRESS,
// ]);

// console.log("UserOperation hash:", userOperationHash);

// // let's also wait for the userOperation to be included, by continually querying for the receipts
// console.log("Querying for receipts...");
// let receipt = null;
// while (receipt === null) {
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   receipt = await pimlicoProvider.send("eth_getUserOperationReceipt", [
//     userOperationHash,
//   ]);
//   console.log(receipt === null ? "Still waiting..." : receipt);
// }

// const txHash = receipt.receipt.transactionHash;

// console.log(
//   `UserOperation included: https://goerli.lineascan.build/tx/${txHash}`
// );