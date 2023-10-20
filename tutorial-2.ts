import {
  SimpleAccountFactory__factory,
  EntryPoint__factory,
  SimpleAccount__factory,
} from "@account-abstraction/contracts";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { Wallet, utils } from "ethers";
import dotenv from "dotenv";
import { hexConcat } from "@ethersproject/bytes";
import { ethers } from "ethers";
import { createClient, http } from "viem";
import { polygonMumbai } from "viem/chains";
import { bundlerActions } from "permissionless";

import { entryPointAbi } from "./abi/entryPointContract.js";
import { paymasterABI } from "./abi/verifyingPaymaster.js";
import {
  pimlicoBundlerActions,
  pimlicoPaymasterActions,
} from "permissionless/actions/pimlico";

dotenv.config();

const callData = {
  to: "0x16c6078cce90Dd48316c74d71c8C4d67a98Eeb52",
  value: 10,
  data: "0x68656c6c6f", // "hello" encoded to utf-8 bytes
};

const Config = {
  CALL_DATA: callData,
  INFURA_URL: process.env.INFURA_URL || "",
  PIMLICO_URL: process.env.PIMLICO_URL || "",
  PRIVATE_KEY: process.env.PRIVATE_KEY || "",
  VerifyingAbi: ethers.utils.defaultAbiCoder,
  MOCK_VALID_UNTIL: "0x00000000deadbeef",
  MOCK_VALID_AFTER: "0x0000000000001234",
  ENTRY_POINT_ADDRESS: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  PAYMASTER_CONTRACT_ADDRESS: "0x3DB36D8a420d3fE96bf1F8e84053C39Eee49b830",
  SIMPLE_ACCOUNT_FACTORY_ADDRESS: "0x9406Cc6185a346906296840746125a0E44976454",
};

const getContractInstance = ({ contractAddress, abi }: any) => {
  const provider = new ethers.providers.JsonRpcProvider(Config.INFURA_URL);
  return new ethers.Contract(contractAddress, abi, provider);
};

const lineaProvider = new StaticJsonRpcProvider(Config.INFURA_URL);
const pimlicoProvider = new StaticJsonRpcProvider(Config.PIMLICO_URL);

const getOwnerAddress = () => {
  const owner = new Wallet(Config.PRIVATE_KEY);
  return owner;
};

const generateInitCode = () => {
  const owner: any = getOwnerAddress();
  const simpleAccountFactory = SimpleAccountFactory__factory.connect(
    Config.SIMPLE_ACCOUNT_FACTORY_ADDRESS,
    lineaProvider
  );

  const initCode = utils.hexConcat([
    Config.SIMPLE_ACCOUNT_FACTORY_ADDRESS,
    simpleAccountFactory.interface.encodeFunctionData("createAccount", [
      owner.address,
      0,
    ]),
  ]);

  return initCode;
};

const getContract = () => {
  const paymasterContract = getContractInstance({
    contractAddress: Config.PAYMASTER_CONTRACT_ADDRESS,
    abi: paymasterABI,
  });

  const entryPointContract = getContractInstance({
    contractAddress: Config.ENTRY_POINT_ADDRESS,
    abi: entryPointAbi,
  });

  const entryPoint = EntryPoint__factory.connect(
    Config.ENTRY_POINT_ADDRESS,
    lineaProvider
  );

  return {
    paymasterContract,
    entryPointContract,
    entryPoint,
  };
};

const getSenderAddress = async ({ contract, initCode }: any) => {
  let add;
  try {
    const address = await contract.entryPoint.callStatic.getSenderAddress(
      initCode
    );
    add = address;
  } catch (e: any) {
    const data = e.message.match(/0x6ca7b806([a-fA-F\d]*)/)?.[1];
    const addr = utils.getAddress(`0x${data.slice(24, 64)}`);
    add = addr;
  }
  return add;
};

const generateCallData = ({ address }: any) => {
  const simpleAccount = SimpleAccount__factory.connect(address, lineaProvider);
  try {
    const callData = simpleAccount.interface.encodeFunctionData("execute", [
      Config.CALL_DATA.to,
      Config.CALL_DATA.value,
      Config.CALL_DATA.data,
    ]);
    return callData;
  } catch (e) {
    console.log(JSON.stringify(e, null, 2));
  }
};

const generatePaymasterAndData = async ({ hash }: any) => {
  const owner = getOwnerAddress();
  const sig = await owner.signMessage(utils.arrayify(hash));

  const paymasterAndData = hexConcat([
    Config.PAYMASTER_CONTRACT_ADDRESS,
    utils.solidityPack(
      ["uint256", "uint256", "bytes"],
      [Config.MOCK_VALID_UNTIL, Config.MOCK_VALID_AFTER, sig]
    ),
  ]);
  return paymasterAndData;
};

const generateSignature = async ({ contract, userOperation }: any) => {
  const chainId = 80001;
  const userOpHash = await contract.entryPoint.getUserOpHash(userOperation);
  const owner = getOwnerAddress();

  const finalUseropHash = hexConcat([
    utils.solidityPack(
      ["bytes", "address", "uint256"],
      [utils.arrayify(userOpHash), Config.ENTRY_POINT_ADDRESS, chainId]
    ),
  ]);
  const signature = await owner.signMessage(finalUseropHash);
  return signature;
};

const generateUserOperation = async () => {
  const contract = getContract();
  const initCode = generateInitCode();
  const address: any = await getSenderAddress({ contract, initCode });

  const callData = generateCallData({ address });

  const gasPrice = await lineaProvider.getGasPrice();

  const userOperation = {
    sender: address,
    nonce: utils.hexlify(2),
    initCode,
    callData,
    callGasLimit: utils.hexlify(100_0000), // hardcode it for now at a high value
    verificationGasLimit: utils.hexlify(400_0000), // hardcode it for now at a high value
    preVerificationGas: utils.hexlify(50_0000), // hardcode it for now at a high value
    maxFeePerGas: utils.hexlify(gasPrice),
    maxPriorityFeePerGas: utils.hexlify(gasPrice),
    paymasterAndData: "0x",
    signature: "0x",
  };

  const hash = await contract.paymasterContract.getHash(
    userOperation,
    Config.MOCK_VALID_UNTIL,
    Config.MOCK_VALID_AFTER
  );

  userOperation.paymasterAndData = await generatePaymasterAndData({ hash });
  userOperation.signature = await generateSignature({
    contract,
    userOperation,
  });
  return userOperation;
};

const getPimlicoBundlerClient = () => {
  const client = createClient({
    transport: http(Config.PIMLICO_URL),
    chain: polygonMumbai,
  })
    .extend(bundlerActions)
    .extend(pimlicoBundlerActions);

  // const paymasterClient = createClient({
  //   // ⚠️ using v2 of the API ⚠️
  //   transport: http(Config.PIMLICO_URL),
  //   chain: polygonMumbai,
  // }).extend(pimlicoPaymasterActions);

  return client;
};

const main = async () => {
  try {
    const sponsoredUserOperation: any = await generateUserOperation();
    console.log(`sponsoredUserOperation`, sponsoredUserOperation);

    const bundlerClient = getPimlicoBundlerClient();

    // USE the pimlicoProvider if using the 'StaticJsonRpcProvider' to create the provider
    // USE the bundlerClient if using the 'createClient' from viem

    // const hash = await pimlicoProvider.send("eth_sendUserOperation", [
    //   sponsoredUserOperation,
    //   Config.ENTRY_POINT_ADDRESS,
    // ]);

    const hash = await bundlerClient.sendUserOperation({
      userOperation: sponsoredUserOperation,
      entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    });

    console.log(`hash`, hash);

    console.log("Querying for receipts...");

    let receipt = null;
    while (receipt === null) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      receipt = await bundlerClient.getUserOperationReceipt({ hash });
      console.log(
        receipt === null
          ? "Still waiting..."
          : `Receipt received: ${receipt.success ? "success" : "failure"}`
      );
    }

    const txHash = receipt.receipt.transactionHash;
    console.log(`txHash`, txHash);
  } catch (e) {
    console.log(JSON.stringify(e, null, 2));
  }
};
main();
