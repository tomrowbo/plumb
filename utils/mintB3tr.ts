import {
  FunctionFragment,
  clauseBuilder,
  coder,
  TransactionUtils,
  TransactionBody,
  TESTNET_NETWORK,
  TransactionHandler,
  mnemonic,
  unitsUtils,
} from "@vechain/sdk-core";

import { ethers } from "ethers";

import {
  ProviderInternalBaseWallet,
  ThorClient,
  VeChainProvider,
  signerUtils,
} from "@vechain/sdk-network";

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
  const clause = clauseBuilder.functionInteraction(
    "0x4b6883ee39447ea10c93e0ac9bd630a18d357f38", // just a sample deployed contract address
    coder.createInterface(mitnABi).getFunction("mint") as FunctionFragment,
    [address, parsedAmount]
  );

  const _mnemonic =
  "supreme position hammer gravity swim lawsuit pulp apart album assault ranch rich";

  const mnemonicArray = _mnemonic.split(" ");

  const privateKey = mnemonic.derivePrivateKey(mnemonicArray);
  const privateKeyBuffer = Buffer.from(privateKey);

  const provider = new VeChainProvider(
    // Thor client used by the provider
    thorClient,

    // Internal wallet used by the provider (needed to call the getSigner() method)
    new ProviderInternalBaseWallet([
      {
        privateKey: privateKeyBuffer,
        address: address,
      },
    ]),

    // Disable fee delegation (BY DEFAULT IT IS DISABLED)
    false
  );


  // 2 - Calculate intrinsic gas of clauses
const transaction = {
    clauses: [
       clause
    ],
    simulateTransactionOptions: {
        caller: address
    }
};


  const gasResult = await thorClient.gas.estimateGas(
    transaction.clauses,
    transaction.simulateTransactionOptions.caller
);


  // 3 - Body of transaction

  const body = await thorClient.transactions.buildTransactionBody(
    transaction.clauses,
    gasResult.totalGas
);

  // 4 - Sign transaction

  // Defined for VET at https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 

  const signer = await provider.getSigner(address);

  const rawSignedTransaction = await signer!!.signTransaction(
    signerUtils.transactionBodyToTransactionRequestInput(body, address)
  );

  const signedTransaction = TransactionHandler.decode(
    Buffer.from(rawSignedTransaction.slice(2), "hex"),
    true
  );

  // 6 - Send transaction

  const sendTransactionResult = await thorClient.transactions.sendTransaction(
    signedTransaction
  );

  // 6 - Wait for transaction receipt
  const txReceipt = await thorClient.transactions.waitForTransaction(
    sendTransactionResult.id
  );

  return txReceipt;
};
