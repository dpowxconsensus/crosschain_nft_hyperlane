// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {Router} from "@hyperlane-xyz/core/contracts/Router.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import {Message} from "./libs/Message.sol";

contract NFT is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721BurnableUpgradeable,
    OwnableUpgradeable,
    Router
{
    using TypeCasts for bytes32;
    using Message for bytes;

    event SendNFTCrossChain(
        address from,
        address to,
        uint256 dstId,
        uint256 tokenIdn
    );

    event NFTReceivedFromChain(
        address from,
        address to,
        uint256 _srcChainId,
        uint256 tokenId
    );

    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;

    function initialize(
        address _mailbox,
        address _interchainGasPaymaster
    ) public initializer {
        __HyperlaneConnectionClient_initialize(
            _mailbox,
            _interchainGasPaymaster
        );
        __ERC721_init("NFT", "SNFT");
        __ERC721URIStorage_init();
        __ERC721Burnable_init();
        __Ownable_init();
    }

    function _safeMint(address to, string memory uri) internal {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function safeMint(address to, string memory uri) public payable {
        require(msg.value >= 1 wei, "1 wei required to mint");
        _safeMint(to, uri);
    }

    // The following functions are overrides required by Solidity.

    function _burn(
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Sends a "hello world" message to an address on a remote chain.
     * @param _destination The ID of the chain we're sending the message to.
     * @param _recipient The address of the recipient we're sending the message to.
     * @param tokenId tokenid that need to transfer
     */
    function transferNFTCrossChain(
        uint32 _destination,
        bytes32 _recipient,
        uint256 tokenId
    ) external payable {
        require(
            _ownerOf(tokenId) == msg.sender,
            "ERC721: caller is not token owner"
        );
        // The message that we're sending.
        bytes memory metadata = abi.encode(tokenURI(tokenId), msg.sender);
        // Send the message!
        uint _gasAmount = 2100000;
        _dispatchWithGas(
            _destination,
            Message.format(_recipient, tokenId, metadata),
            _gasAmount,
            msg.value,
            msg.sender
        );
        _burn(tokenId); // burn the nft on src chain
        emit SendNFTCrossChain(
            msg.sender,
            _recipient.bytes32ToAddress(),
            _destination,
            tokenId
        );
    }

    /**
     * @notice Emits a HelloWorld event upon receipt of an interchain message
     * @param _origin The chain ID from which the message was sent
     * @param _sender The contract address that sent the message
     * @param _message The contents of the message
     */
    function _handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) internal override onlyMailbox {
        address recipient = (_message.recipient()).bytes32ToAddress();
        uint256 tokenId = _message.tokenId();
        (string memory tokenUri, address from) = abi.decode(
            _message.metadata(),
            (string, address)
        );
        _safeMint(recipient, tokenUri);
        emit NFTReceivedFromChain(from, recipient, _origin, tokenId);
    }

    receive() external payable {}
}
