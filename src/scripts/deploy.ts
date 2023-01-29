import { ethers, network, upgrades } from 'hardhat';
import { access, constants, mkdir } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

import {
  HyperlaneCore,
  MultiProvider,
  getChainToOwnerMap,
  objMap,
  serializeContracts,
} from '@hyperlane-xyz/sdk';

import { prodConfigs } from '../deploy/config';
import { NFTDeployer } from '../deploy/deploy';

const { Wallet } = ethers;

const { abi, bytecode } = require('../../artifacts/contracts/nft.sol/NFT.json');

const hyperlaneConstant = require('./../constants/hyperlaneEndpoints.json');

const isFileExist = (path: string) => {
  return new Promise((resolve, reject) => {
    access(path, constants.F_OK, (err) => {
      if (err) return resolve(false);
      resolve(true);
    });
  });
};

async function main() {
  console.info('Deployment Started ...');
  const NFT = await ethers.getContractFactory('NFT');
  const mailbox = hyperlaneConstant[network.name].mailbox;
  const interchainGasPaymaster =
    hyperlaneConstant[network.name].interchainGasPaymaster;

  const nftGoerliProxy = await upgrades.deployProxy(NFT, [
    mailbox,
    interchainGasPaymaster,
  ]);
  await nftGoerliProxy.deployed();
  console.log(nftGoerliProxy.address);

  // storing address of deployment for future testing
  const path = `${__dirname}/artifacts`;

  if (!(await isFileExist(`${path}`))) {
    await new Promise((resolve, reject) => {
      mkdir(path, { recursive: true }, (err) => {
        if (err) return reject('erro while creating dir');
        resolve('created');
      });
    });
  }

  if (!(await isFileExist(`${path}/deploy.json`))) {
    await writeFile(`${path}/deploy.json`, '{}');
  }

  const prevDetails = await readFile(`${path}/deploy.json`, {
    encoding: 'utf8',
  });

  const prevDetailsJson: { [network: string]: string } = await JSON.parse(
    prevDetails,
  );
  let newDeployData = {
    ...prevDetailsJson,
    [network.name]: nftGoerliProxy.address,
  };
  await writeFile(`${path}/deploy.json`, JSON.stringify(newDeployData));
  console.log('Deploy file updated successfully!');
}

main()
  .then(() => console.info('Deploy complete !!'))
  .catch(console.error);
