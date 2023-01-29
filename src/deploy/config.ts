import { RouterConfig, chainConnectionConfigs } from '@hyperlane-xyz/sdk';

export type NFTConfig = RouterConfig;

// SET DESIRED NETWORKS HERE
export const prodConfigs = {
  goerli: chainConnectionConfigs.goerli,
  fuji: chainConnectionConfigs.fuji,
};
