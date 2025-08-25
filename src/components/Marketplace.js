import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

export default function Marketplace() {
  const sampleData = [];
  const [data, updateData] = useState(sampleData);
  const [dataFetched, updateFetched] = useState(false);

  // get all
  async function getAllNFTs() {
    console.log('getAllNFTs22222');
    const ethers = require("ethers");
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log(33333, provider);
    const signer = provider.getSigner();
    console.log(44444, signer);
    //Pull the deployed contract instance
    console.log(55555, MarketplaceJSON.address)
    console.log(66666, MarketplaceJSON.abi)
    const contract = new ethers.Contract(
      
      MarketplaceJSON.address,
      MarketplaceJSON.abi,
      signer
    );
    //create an NFT Token
    const transaction = await contract.getAllNFTs(); // 调用合约的getAllNFTs方法，从区块链上获取所有 NFT 的原始数据（通常包含 tokenId、价格、卖家、所有者等信息）。
    console.log(88888, transaction);
    //Fetch all the details of every NFT from the contract and display
    const items = await Promise.all( // 并行处理所有 NFT 的数据，提高效率。
      transaction.map(async (i) => {
        var tokenURI = await contract.tokenURI(i.tokenId); // 1. 获取NFT的元数据URI（通常是IPFS链接）
        console.log("getting this tokenUri", tokenURI);
        tokenURI = GetIpfsUrlFromPinata(tokenURI); // 2. 处理IPFS链接（转换为可直接访问的URL）
        let meta = await axios.get(tokenURI);  // 3. 从URI加载元数据（JSON格式）
        meta = meta.data;

        let price = ethers.utils.formatUnits(i.price.toString(), "ether");  // 4. 格式化价格（从wei转换为ether，以太坊的单位转换）

         // 5. 构造NFT信息对象
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),  // NFT的唯一标识
          seller: i.seller,  // 卖家地址
          owner: i.owner,    // 所有者地址
          image: meta.image, // 图片链接（来自元数据）
          name: meta.name,   // 名称（来自元数据）
          description: meta.description, // 描述（来自元数据）
        };
        return item;
      })
    );

    updateFetched(true);
    updateData(items);
  }
  if (!dataFetched) getAllNFTs();

  return (
    <div>
      <Navbar />
      <div className="flex flex-col place-items-center mt-20">
        <div className="md:text-xl font-bold text-white">Top NFTs</div>
        <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
          {data.map((value, index) => {
            return <NFTTile data={value} key={index}></NFTTile>;
          })}
        </div>
      </div>
    </div>
  );
}
