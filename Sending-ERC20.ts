import {
  SimpleAccountFactory__factory,
  EntryPoint__factory,
  SimpleAccount__factory,
  EntryPoint,
  UserOperationStruct,
} from "@account-abstraction/contracts";
import { Provider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { BigNumber, Wallet, constants, utils } from "ethers";
import { getERC20Paymaster } from "@pimlico/erc20-paymaster";
import dotenv from "dotenv";
import { paymaster } from "./abi/verifyingPaymaster.js";
import { entryPointAbi } from "./abi/entryPointContract.js";
import { hexConcat } from "@ethersproject/bytes";
import { ethers } from "ethers";
import { ERC20ABI } from "./abi/erc20Contract.js";

dotenv.config();

function getRandomInt(max: any) {
  return Math.floor(Math.random() * max);
}

// GENERATE THE INITCODE
const SIMPLE_ACCOUNT_FACTORY_ADDRESS =
  "0x06DE0387f27fDbB11c9972c5AB3b3BacD5a0C158";
const lineaProvider = new StaticJsonRpcProvider(
  "https://polygon-mumbai.g.alchemy.com/v2/vKN3SWGBGfPXo5afbsJN-wipI1An_cqm"
);

const privateKeyVPM =
  "2d1a8afe8263cf083b4b70428ef12082c83e8c47622cdaea7b4bb89f0faa59a7";
const paymasterSigner = new Wallet(privateKeyVPM);

// const owner = new Wallet(privateKeyUser);
const owner = Wallet.createRandom();
console.log("Generated wallet with private key:", owner.privateKey);

const MOCK_VALID_UNTIL = "0x00000000deadbeef";
const MOCK_VALID_AFTER = "0x0000000000001234";

const simpleAccountFactory = SimpleAccountFactory__factory.connect(
  SIMPLE_ACCOUNT_FACTORY_ADDRESS,
  lineaProvider
);

const initCode = utils.hexConcat([
  SIMPLE_ACCOUNT_FACTORY_ADDRESS,
  simpleAccountFactory.interface.encodeFunctionData("createAccount", [
    owner.address,
    0,
  ]),
]);

console.log("Generated initCode:", initCode);

const alchemyUrl = process.env.ALCHEMY_URL;
const provider = new ethers.providers.JsonRpcProvider(alchemyUrl);

// CALCULATE THE SENDER ADDRESS
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const verifyingPaymaterContract = "0x208dbF680ed0DB70A5b66d1dc1D998018e8CE2c1";
const VerifyingAbi = ethers.utils.defaultAbiCoder;

const contract = new ethers.Contract(
  verifyingPaymaterContract,
  paymaster,
  provider
);
const EntryPointContract = new ethers.Contract(
  ENTRY_POINT_ADDRESS,
  entryPointAbi,
  provider
);

const entryPoint = EntryPoint__factory.connect(
  ENTRY_POINT_ADDRESS,
  lineaProvider
);

const senderAddress = await entryPoint.callStatic
  .getSenderAddress(initCode)
  .then(() => {
    throw new Error("Expected getSenderAddress() to revert");
  })
  .catch((e) => {
    const data = e.message.match(/0x6ca7b806([a-fA-F\d]*)/)?.[1];
    if (!data) {
      return Promise.reject(new Error("Failed to parse revert data"));
    }
    const addr = utils.getAddress(`0x${data.slice(24, 64)}`);
    return Promise.resolve(addr);
  });

console.log("Calculated sender address:", senderAddress);

// let nonce = await provider.getTransactionCount(senderAddress);
//@ts-ignore

let nonce = await provider.getTransactionCount(senderAddress);
console.log("Nonce returned " + nonce);
nonce = nonce + 1;

//GENERATE CallData for Sending ERC20 Token
const ERC20_TOKEN_ADDRESS = "0x12607F63bac6d1BdC636AF4f4d0d97Cf93d02965"; // Replace with the actual ERC20 token address
const erc20Contract = new ethers.Contract(
  ERC20_TOKEN_ADDRESS,
  ERC20ABI,
  provider
); // Import the ERC20 contract ABI

const simpleAccount = SimpleAccount__factory.connect(
  senderAddress,
  lineaProvider
);

console.log("erc20Contract", erc20Contract);

// GENERATE THE CALLDATA for sending ERC20 tokens
const amount = ethers.utils.parseEther("1"); // Replace with the actual amount of tokens you want to send
console.log("amount", amount);
const transData = erc20Contract.interface.encodeFunctionData("mint", [
  "0x2eff40A72329026Ff9cB730D152017249c777D96", // Replace with the recipient's address
  amount,
]);

const callData = simpleAccount.interface.encodeFunctionData("execute", [
  erc20Contract.address,
  0,
  transData,
]);

console.log("Generated transfer callData for ERC20 token:", callData);

// FILL OUT REMAINING USER OPERATION VALUES
const gasPrice = await lineaProvider.getGasPrice();
console.log("gasPrice", gasPrice);

const userOperation = {
  sender: senderAddress,
  nonce: utils.hexlify(0),
  initCode,
  callData,
  callGasLimit: utils.hexlify(100_000), // hardcode it for now at a high value
  verificationGasLimit: utils.hexlify(400_000), // hardcode it for now at a high value
  preVerificationGas: utils.hexlify(50_000), // hardcode it for now at a high value
  maxFeePerGas: utils.hexlify(gasPrice),
  maxPriorityFeePerGas: utils.hexlify(gasPrice),
  paymasterAndData: "0x",
  signature: "0x",
};

console.log("userOps", userOperation);

const chain = "mumbai";
const apiKey = process.env.PIMLICO_API_KEY;

const pimlicoEndpoint = `http://localhost:3000/rpc`;

console.log("pimlicoEndpoint", pimlicoEndpoint);

const pimlicoProvider = new StaticJsonRpcProvider(pimlicoEndpoint);

console.log("pimlicoProvider", pimlicoProvider);

const hash = await contract.getHash(
  userOperation,
  MOCK_VALID_UNTIL,
  MOCK_VALID_AFTER
);

console.log("hash", hash);

const sig = await paymasterSigner.signMessage(utils.arrayify(hash));
console.log("sig", sig);
console.log("sig", sig.length);

const paymasterAndData = hexConcat([
  verifyingPaymaterContract,
  utils.solidityPack(
    ["uint256", "uint256", "bytes"],
    [MOCK_VALID_UNTIL, MOCK_VALID_AFTER, sig]
  ),
]);

userOperation.paymasterAndData = paymasterAndData;

console.log("Pimlico paymasterAndData:", paymasterAndData);

// SIGN THE USER OPERATION
const chainId = 80001;

const finalUseropHash = await entryPoint.getUserOpHash(userOperation);
console.log("finalUseropHash", finalUseropHash);

const signature = await owner.signMessage(utils.arrayify(finalUseropHash));

userOperation.signature = signature;

console.log("UserOperation signature:", signature);
console.log("UserOperation:", userOperation);

// SUBMIT THE USER OPERATION TO BE BUNDLED
const userOperationHash = await pimlicoProvider.send("eth_sendUserOperation", [
  userOperation,
  ENTRY_POINT_ADDRESS,
]);

console.log("UserOperation hash:", userOperationHash);

// let's also wait for the userOperation to be included, by continually querying for the receipts
console.log("Querying for receipts...");
let receipt = null;
while (receipt === null) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  receipt = await pimlicoProvider.send("eth_getUserOperationReceipt", [
    userOperationHash,
  ]);
  console.log(receipt === null ? "Still waiting..." : receipt);
}

const txHash = receipt.receipt.transactionHash;

console.log(
  `UserOperation included: https://goerli.lineascan.build/tx/${txHash}`
);
