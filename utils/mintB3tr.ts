import {
  FunctionFragment,
  clauseBuilder,
  coder,
  TransactionUtils,
  TransactionBody,
  TESTNET_NETWORK,
  TransactionHandler,
  mnemonic,
    
} from "@vechain/sdk-core";

import {ethers} from "ethers"

import { ThorClient } from "@vechain/sdk-network";
// First way to initialize thor client
const testnetUrl = "https://testnet.vechain.org/";

// Second way to initialize thor client
const thorClient = ThorClient.fromUrl(testnetUrl);

const mitnABi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const mintB3tr = async (address: string, amount: string) => {
    const parsedAmount = ethers.parseEther(amount);
  // 2 - Create a clause to call setValue(123)
  const clause = clauseBuilder.functionInteraction(
    "0x4b6883ee39447ea10c93e0ac9bd630a18d357f38", // just a sample deployed contract address
    coder.createInterface(mitnABi).getFunction("mint") as FunctionFragment,
    [address, parsedAmount]
  );

  const clauses = [clause];

  // 2 - Calculate intrinsic gas of clauses

  const gas = TransactionUtils.intrinsicGas(clauses);

  // 2 - Get latest block

const latestBlock = await thorClient.blocks.getBestBlockCompressed();

  // 3 - Body of transaction

  const body: TransactionBody = {
    chainTag: TESTNET_NETWORK.chainTag,
    blockRef: latestBlock !== null ? latestBlock.id.slice(0, 18) : '0x0',
    expiration: 0,
    clauses,
    gasPriceCoef: 128,
    gas,
    dependsOn: null,
    nonce: 12345678,
  };

  // 4 - Sign transaction
  const _mnemonic =
    "supreme position hammer gravity swim lawsuit pulp apart album assault ranch rich";
  const mnemonicArray = _mnemonic.split(" ");

  // Defined for VET at https://github.com/satoshilabs/slips/blob/master/slip-0044.md
  const privateKey = mnemonic.derivePrivateKey(mnemonicArray);

  const signedTransaction = TransactionHandler.sign(
    body,
    Buffer.from(privateKey)
  ).encoded;

  

  // 6 - Send transaction

  const send = await thorClient.transactions.sendRawTransaction(
    `0x${signedTransaction.toString("hex")}`
  );

  // 7 - Get transaction details and receipt

  const transactionDetails = await thorClient.transactions.getTransaction(
    send.id
  );
  const transactionReceipt =
    await thorClient.transactions.getTransactionReceipt(send.id);

    console.log("transaction details", transactionDetails);
    console.log("transaction receipt", transactionReceipt);
    console.log("send", send);

  return {
    id: send.id,
    details: transactionDetails,
    receipt: transactionReceipt,
  };
};
