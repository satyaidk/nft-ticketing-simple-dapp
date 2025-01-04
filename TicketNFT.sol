// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Event {
        string name;
        uint256 price;
        uint256 totalSupply;
        uint256 availableSupply;
    }

    mapping(uint256 => Event) public events;
    mapping(uint256 => uint256) public ticketToEvent;

    constructor() ERC721("TicketNFT", "TNFT") {}

    function createEvent(string memory name, uint256 price, uint256 totalSupply) public onlyOwner {
        uint256 eventId = _tokenIds.current();
        events[eventId] = Event(name, price, totalSupply, totalSupply);
        _tokenIds.increment();
    }

    function mintTicket(uint256 eventId) public payable {
        Event storage event_ = events[eventId];
        require(event_.availableSupply > 0, "No more tickets available");
        require(msg.value >= event_.price, "Insufficient payment");

        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        ticketToEvent[newTokenId] = eventId;
        event_.availableSupply--;
        _tokenIds.increment();

        if (msg.value > event_.price) {
            payable(msg.sender).transfer(msg.value - event_.price);
        }
    }

    function resellTicket(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not the ticket owner");
        approve(address(this), tokenId);
        // Implement marketplace logic here
    }

    function getEventDetails(uint256 eventId) public view returns (Event memory) {
        return events[eventId];
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
