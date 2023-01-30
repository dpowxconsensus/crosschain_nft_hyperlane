import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

import {
  ChainMap,
  ChainNameToDomainId,
  MultiProvider,
  TestChainNames,
  TestCoreApp,
  TestCoreDeployer,
  getChainToOwnerMap,
  getTestMultiProvider,
  testChainConnectionConfigs,
} from '@hyperlane-xyz/sdk';

import { NFTConfig } from '../deploy/config';
import { NFTDeployer } from '../deploy/deploy';

const { ethers, upgrades } = require('hardhat');
const { utils } = require('@hyperlane-xyz/utils');

describe('Hyperlane', async () => {
  const localChain = 'test1';
  const remoteChain = 'test2';
  const localDomain = ChainNameToDomainId[localChain];
  const remoteDomain = ChainNameToDomainId[remoteChain];

  let signerOrigin: SignerWithAddress;
  let signerRemote: SignerWithAddress;

  let signer: SignerWithAddress;
  let multiProvider: MultiProvider<TestChainNames>;
  let coreApp: TestCoreApp;
  let config: ChainMap<TestChainNames, NFTConfig>;
  before(async () => {
    [signer] = await ethers.getSigners();

    multiProvider = getTestMultiProvider(signer);

    const coreDeployer = new TestCoreDeployer(multiProvider);
    const coreContractsMaps = await coreDeployer.deploy();
    coreApp = new TestCoreApp(coreContractsMaps, multiProvider);
    config = coreApp.extendWithConnectionClientConfig(
      getChainToOwnerMap(testChainConnectionConfigs, signer.address),
    );

    // console.log(Object.keys(coreApp.contractsMap[localChain]));
  });

  beforeEach(async function () {
    const nft = new NFTDeployer(multiProvider, config, coreApp);
    const deployedNFTS = await nft.deploy();
    this.nftSrcProxy = deployedNFTS[localChain].router;
    this.nftDstProxy = deployedNFTS[remoteChain].router;
  });

  it('should be able to send nft crosschain', async function () {
    const [owner, ...otherAccounts] = await ethers.getSigners();

    // let's mint from second account as first account is owner of proxy contract
    await this.nftSrcProxy
      .connect(otherAccounts[0])
      .safeMint(otherAccounts[0].address, 'URI', {
        value: 1, // 1 wei
      }); // due to TransparentProxy provided by sdk, admin can't control nft contract

    // before sending
    expect(await this.nftSrcProxy.ownerOf(0)).to.be.equal(
      otherAccounts[0].address,
    );

    await this.nftSrcProxy.connect(otherAccounts[0]).transferNFTCrossChain(
      remoteDomain,
      utils.addressToBytes32(owner.address), // trasferring to owner
      0,
      {
        value: ethers.utils.parseEther('1.0'),
      },
    );

    await coreApp.processOutboundMessages(localChain);

    // after it recceived on destination chain
    expect(await this.nftDstProxy.ownerOf(0)).to.be.equal(owner.address);
  });
});
