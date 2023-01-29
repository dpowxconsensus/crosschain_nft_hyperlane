import { RouterContracts, RouterFactories } from "@hyperlane-xyz/sdk";

import { NFT, NFT__factory } from "../types";

export type NFTFactories = RouterFactories<NFT>;

export const nftFactories: NFTFactories = {
  router: new NFT__factory(),
};

export type NFTContracts = RouterContracts<NFT>;
