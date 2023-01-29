import {
  ChainMap,
  ChainName,
  HyperlaneCore,
  HyperlaneRouterDeployer,
  MultiProvider,
} from '@hyperlane-xyz/sdk';

import { NFTContracts, NFTFactories, nftFactories } from '../app/contracts';

import { NFTConfig } from './config';

export class NFTDeployer<
  Chain extends ChainName,
> extends HyperlaneRouterDeployer<
  Chain,
  NFTConfig,
  NFTContracts,
  NFTFactories
> {
  constructor(
    multiProvider: MultiProvider<Chain>,
    configMap: ChainMap<Chain, NFTConfig>,
    protected core: HyperlaneCore<Chain>,
  ) {
    super(multiProvider, configMap, nftFactories, {});
  }

  // Custom contract deployment logic can go here
  // If no custom logic is needed, call deployContract for the router
  async deployContracts(chain: Chain, config: NFTConfig) {
    const router = await this.deployContract(chain, 'router', []);
    await router.initialize(config.mailbox, config.interchainGasPaymaster);
    return {
      router,
    };
  }
}
