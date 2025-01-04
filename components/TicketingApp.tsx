'use client'

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const contractABI = [
  "function createEvent(string memory name, uint256 price, uint256 totalSupply) public",
  "function mintTicket(uint256 eventId) public payable",
  "function getEventDetails(uint256 eventId) public view returns (tuple(string name, uint256 price, uint256 totalSupply, uint256 availableSupply))",
  "function balanceOf(address owner) public view returns (uint256)"
];

export default function TicketingApp() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [newEventName, setNewEventName] = useState('');
  const [newEventPrice, setNewEventPrice] = useState('');
  const [newEventSupply, setNewEventSupply] = useState('');

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined' && contractAddress) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = web3Provider.getSigner();
        const ticketContract = new ethers.Contract(contractAddress, contractABI, signer);

        setProvider(web3Provider);
        setContract(ticketContract);

        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }

        // Load events
        await loadEvents(ticketContract);
      }
    };

    init();
  }, []);

  const loadEvents = async (ticketContract: ethers.Contract) => {
    try {
      const eventCount = await ticketContract.balanceOf(contractAddress);
      const loadedEvents = [];
      for (let i = 0; i < eventCount.toNumber(); i++) {
        const event = await ticketContract.getEventDetails(i);
        loadedEvents.push(event);
      }
      setEvents(loadedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const connectWallet = async () => {
    if (provider) {
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
    }
  };

  const createEvent = async () => {
    if (contract && account) {
      try {
        const tx = await contract.createEvent(newEventName, ethers.utils.parseEther(newEventPrice), newEventSupply);
        await tx.wait();
        // Refresh events
        await loadEvents(contract);
      } catch (error) {
        console.error("Error creating event:", error);
      }
    }
  };

  const buyTicket = async (eventId: number) => {
    if (contract && account) {
      try {
        const event = await contract.getEventDetails(eventId);
        const tx = await contract.mintTicket(eventId, { value: event.price });
        await tx.wait();
        // Refresh events
        await loadEvents(contract);
      } catch (error) {
        console.error("Error buying ticket:", error);
      }
    }
  };

  return (
    <div>
      {!account ? (
        <Button onClick={connectWallet}>Connect Wallet</Button>
      ) : (
        <p>Connected: {account}</p>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Event Name"
            value={newEventName}
            onChange={(e) => setNewEventName(e.target.value)}
            className="mb-2"
          />
          <Input
            type="number"
            placeholder="Ticket Price (ETH)"
            value={newEventPrice}
            onChange={(e) => setNewEventPrice(e.target.value)}
            className="mb-2"
          />
          <Input
            type="number"
            placeholder="Total Supply"
            value={newEventSupply}
            onChange={(e) => setNewEventSupply(e.target.value)}
            className="mb-2"
          />
          <Button onClick={createEvent}>Create Event</Button>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Events</h2>
      {events.map((event, index) => (
        <Card key={index} className="mb-4">
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Price: {ethers.utils.formatEther(event.price)} ETH</p>
            <p>Available: {event.availableSupply.toString()} / {event.totalSupply.toString()}</p>
            <Button onClick={() => buyTicket(index)} disabled={event.availableSupply.toNumber() === 0}>
              Buy Ticket
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

