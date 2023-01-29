import { ethers, network } from 'hardhat';

import { utils } from '@hyperlane-xyz/utils';

import { abi, bytecode } from '../../artifacts/contracts/nft.sol/NFT.json';

import hyperlaneConstant from './../constants/hyperlaneEndpoints.json';
import deploy from './artifacts/deploy.json';

async function main() {
  console.info('Enrollment started ...');
  // setting remote for current network
  const nftAddress = deploy[network.name];
  const [signer] = await ethers.getSigners();
  const nftContract = await ethers.getContractAt(abi, nftAddress, signer);
  // hard coding for fuji here
  let domain, router;
  if (network.name == 'fuji')
    (domain = hyperlaneConstant['goerli'].domainid),
      (router = deploy['goerli']);
  else (domain = hyperlaneConstant['fuji'].domainid), (router = deploy['fuji']);

  await nftContract.enrollRemoteRouter(domain, utils.addressToBytes32(router));
}

main()
  .then(() => console.info('Enrollmented completed !!'))
  .catch(console.error);
