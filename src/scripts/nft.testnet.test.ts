import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert } from 'console';

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
import { chainConnectionConfigs } from '@hyperlane-xyz/sdk';

import { NFTConfig } from '../deploy/config';
import { NFTDeployer } from '../deploy/deploy';

import deploy from './artifacts/deploy.json';

const { ethers, upgrades } = require('hardhat');
const { utils } = require('@hyperlane-xyz/utils');

const { abi, bytecode } = require('../../artifacts/contracts/nft.sol/NFT.json');

async function main() {
  const localChain = 'goerli';
  const remoteChain = 'fuji';
  const localDomain = ChainNameToDomainId[localChain];
  const remoteDomain = ChainNameToDomainId[remoteChain];

  let signerOrigin: SignerWithAddress;
  let signerRemote: SignerWithAddress;

  let nftSrcContract;
  let nftDstContract;

  let signer: SignerWithAddress;
  let multiProvider;
  let coreApp: TestCoreApp;
  let config: ChainMap<TestChainNames, NFTConfig>;

  const setup = async () => {
    signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);

    const goerli = chainConnectionConfigs.goerli;
    const fuji = chainConnectionConfigs.fuji;

    multiProvider = new MultiProvider({ goerli, fuji });

    signerOrigin = signer.connect(multiProvider.chainMap[localChain].provider);
    signerRemote = signer.connect(multiProvider.chainMap[remoteChain].provider);

    nftSrcContract = await ethers.getContractAt(
      abi,
      deploy[localChain],
      signerOrigin,
    );

    nftDstContract = await ethers.getContractAt(
      abi,
      deploy[remoteChain],
      signerRemote,
    );
  };

  const testNFTFLOW = async () => {
    // const tx = await nftSrcContract
    //   .connect(signerOrigin)
    //   .safeMint(signerOrigin.address, 'URI', {
    //     value: ethers.utils.parseEther('0.01'),
    //   });
    // console.log('tx sent successfully with tx hash: ', tx.hash);
    // const txReceipt = await tx.wait();
    // console.log(txReceipt);

    // before sending
    let nftOwner = await nftSrcContract.connect(signerOrigin).ownerOf(0); // should be equal to signerOrigin.address

    assert(
      nftOwner == signerOrigin.address,
      'srcchain: minted to someone else',
    );

    // await nftSrcContract.connect(signerOrigin).transferNFTCrossChain(
    //   remoteDomain,
    //   utils.addressToBytes32(signerOrigin.address), // trasferring to owner
    //   0,
    //   {
    //     value: ethers.utils.parseEther('0.25'),
    //   },
    // );

    /*
        after it recceived on destination chain
    */
    nftOwner = await nftDstContract.ownerOf(0);
    assert(
      nftOwner == signerOrigin.address,
      'srcchain: minted to someone else',
    );
  };

  setup()
    .then(async () => {
      console.log('Setup completed !!');
      await testNFTFLOW();
    })
    .catch(console.log);
}

main()
  .then(() => console.info('Test completed cross chain !!'))
  .catch(console.error);
