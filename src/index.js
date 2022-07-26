import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ethers } from "ethers";

import { Bridge, Tokens, ChainId, Networks } from "@synapseprotocol/sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { parseUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.onload = function () {
  const connectButton = document.getElementById("connectButton");
  const approveButton = document.getElementById("signApprove");
  const bridgeButton = document.getElementById("signBridge");
  // Initialize dummy Ethers Provider
  const AVAX_PROVIDER = new JsonRpcProvider(
    "https://api.avax.network/ext/bc/C/rpc"
  );
  // Use SDK Data about different chains
  const AVAX_NETWORK = Networks.AVALANCHE;

  // Initialize Bridge
  const SYNAPSE_BRIDGE = new Bridge.SynapseBridge({
    network: AVAX_NETWORK,
  });

  // Set up some variables to prepare a Avalanche USDC -> BSC USDT quote
  const TOKEN_IN = Tokens.USDC,
    TOKEN_OUT = Tokens.USDT,
    ON_CHAIN = ChainId.AVALANCHE,
    CHAIN_OUT = ChainId.BSC,
    INPUT_AMOUNT = parseUnits(
      "1000",
      BigNumber.from(TOKEN_IN.decimals(ON_CHAIN))
    );

  const isMetaMaskInstalled = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  const MetaMaskClientCheck = () => {
    let populatedApproveTxn;
    let populatedBridgeTokenTxn;
    let provider;
    let estimate;
    let signer;
    let signer_address;

    // Check if Metamask is installed
    if (!isMetaMaskInstalled()) {
      alert("Install Metamask in your browser");
    } else {
      const onClickConnect = async () => {
        try {
          // Will open the MetaMask UI
          provider = new ethers.providers.Web3Provider(window.ethereum, "any");

          // Switch to Avalanche chain
          await provider.send("wallet_switchEthereumChain", [
            { chainId: "0x" + AVAX_NETWORK.chainId.toString(16) },
          ]);
          signer = provider.getSigner();
          signer_address = await signer.getAddress();
        } catch (error) {
          // handle error if one occurs
        }
      };
      const onClickApprove = async () => {
        try {
          // Create a populated transaction for approving token spending
          populatedApproveTxn = await SYNAPSE_BRIDGE.buildApproveTransaction({
            token: TOKEN_IN,
          });
        } catch (e) {
          // handle error if one occurs
        }
        // Sign and send the transaction
        await signer.sendTransaction(populatedApproveTxn);
      };
      const onClickBridge = async () => {
        // Get a quote for amount to receive from the bridge
        estimate = await SYNAPSE_BRIDGE.estimateBridgeTokenOutput({
          tokenFrom: TOKEN_IN, // token to send from the source chain, in this case USDT on Avalanche
          chainIdTo: CHAIN_OUT, // Chain ID of the destination chain, in this case BSC
          tokenTo: TOKEN_OUT, // Token to be received on the destination chain, in this case USDC
          amountFrom: INPUT_AMOUNT,
        });
        try {
          // Create a populated transaction for bridging
          populatedBridgeTokenTxn =
            await SYNAPSE_BRIDGE.buildBridgeTokenTransaction({
              tokenFrom: TOKEN_IN, // token to send from the source chain, in this case nUSD on Avalanche
              chainIdTo: CHAIN_OUT, // Chain ID of the destination chain, in this case BSC
              tokenTo: TOKEN_OUT, // Token to be received on the destination chain, in this case USDC
              amountFrom: INPUT_AMOUNT, // Amount of `tokenFrom` being sent
              amountTo: estimate.amountToReceive, // minimum desired amount of `tokenTo` to receive on the destination chain
              addressTo: signer_address, // the address to receive the tokens on the destination chain
            });
        } catch (e) {
          // handle error if one occurs
        }
        // Sign and send the transaction
        await signer.sendTransaction(populatedBridgeTokenTxn);
      };
      connectButton.onclick = onClickConnect;
      approveButton.onclick = onClickApprove;
      bridgeButton.onclick = onClickBridge;
    }
  };
  MetaMaskClientCheck();
};
