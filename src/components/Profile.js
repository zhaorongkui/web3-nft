import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import NFTTile from "./NFTTile";

export default function Profile () {
    const [data, updateData] = useState([]); // 存储用户持有的NFT列表数据
    const [dataFetched, updateFetched] = useState(false); // 标记数据是否已获取
    const [address, updateAddress] = useState("0x");  // 当前连接的钱包地址
    const [totalPrice, updateTotalPrice] = useState("0"); // 所有NFT的总价值

    async function getNFTData(tokenId) {
        const ethers = require("ethers");
        // 通过MetaMask等钱包创建区块链连接
        let sumPrice = 0;
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        // 获取当前登录的钱包账户（签名者）
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // 获取当前钱包的地址（用于后续展示和数据关联）
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)

        //create an NFT Token
        let transaction = await contract.getMyNFTs()

        /*
        * Below function takes the metadata from tokenURI and the data returned by getMyNFTs() contract function
        * and creates an object of information that is to be displayed
        */
        
        const items = await Promise.all(transaction.map(async i => {
            const tokenURI = await contract.tokenURI(i.tokenId);// 1. 获取NFT的元数据URI（通常是IPFS链接）
            let meta = await axios.get(tokenURI); // 2. 从URI加载元数据（JSON格式，包含图片、名称等）
            meta = meta.data;
            // 3. 格式化价格（从wei转换为ether）
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
            // 4. 构造NFT信息对象
            let item = {
                price,          // 价格（ether单位）
                tokenId: i.tokenId.toNumber(),  // NFT唯一标识
                seller: i.seller,  // 卖家地址
                owner: i.owner,    // 所有者地址（当前用户）
                image: meta.image, // 图片链接（来自元数据）
                name: meta.name,   // 名称（来自元数据）
                description: meta.description, // 描述（来自元数据）
            }
            // 累加计算所有NFT的总价值
            sumPrice += Number(price);
            return item;
        }))

        updateData(items);
        updateFetched(true);
        updateAddress(addr);
        updateTotalPrice(sumPrice.toPrecision(3));
    }

    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTData(tokenId);

    return (
        <div className="profileClass" style={{"minHeight":"100vh"}}>
            <Navbar></Navbar>
            <div className="profileClass">
            <div className="flex text-center flex-col mt-11 md:text-2xl text-white">
                <div className="mb-5">
                    <h2 className="font-bold">Wallet Address</h2>  
                    {address}
                </div>
            </div>
            <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                    <div>
                        <h2 className="font-bold">No. of NFTs</h2>
                        {data.length}
                    </div>
                    <div className="ml-20">
                        <h2 className="font-bold">Total Value</h2>
                        {totalPrice} ETH
                    </div>
            </div>
            <div className="flex flex-col text-center items-center mt-11 text-white">
                <h2 className="font-bold">Your NFTs</h2>
                <div className="flex justify-center flex-wrap max-w-screen-xl">
                    {data.map((value, index) => {
                    return <NFTTile data={value} key={index}></NFTTile>;
                    })}
                </div>
                <div className="mt-10 text-xl">
                    {data.length === 0 ? "Oops, No NFT data to display (Are you logged in?)":""}
                </div>
            </div>
            </div>
        </div>
    )
};