import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";

export default function NFTPage(props) {

    const [data, updateData] = useState({}); // 存储当前NFT的详细信息（图片、名称、价格等）
    const [dataFetched, updateDataFetched] = useState(false); // 标记NFT数据是否已加载完成
    const [message, updateMessage] = useState(""); // 展示操作状态提示（如“购买中...”）
    const [currAddress, updateCurrAddress] = useState("0x"); // 当前连接的钱包地址

    async function getNFTData(tokenId) {
        const ethers = require("ethers");
        // 通过MetaMask等钱包创建区块链连接, After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        // 获取当前钱包签名者（用户身份）
        const signer = provider.getSigner();
        // 获取当前钱包地址（用于后续权限判断，如“是否是所有者”）
        const addr = await signer.getAddress();
        //Pull the deployed contract instance
        let contract = new ethers.Contract(
                MarketplaceJSON.address, // NFT市场合约地址
                MarketplaceJSON.abi, // 合约接口定义
                signer // 当前用户签名者
            )
        //create an NFT Token // 1. 获取NFT的元数据URI（链上存储的关键标识，指向链下元数据）
        var tokenURI = await contract.tokenURI(tokenId);
        // 3. 从合约获取NFT的链上交易数据（卖家、所有者等）, 卖家地址（seller）、当前所有者地址（owner）等，由合约直接管理。
        const listedToken = await contract.getListedTokenForId(tokenId);
        // 转换IPFS链接为可直接访问的URL（如从ipfs://xxx转换为https://xxx）
        tokenURI = GetIpfsUrlFromPinata(tokenURI);
        // 2. 从链下加载元数据（JSON格式，包含图片、名称等）
        let meta = await axios.get(tokenURI);
        meta = meta.data;
        console.log(listedToken);

        // 构造完整的NFT信息对象
        let item = {
            price: meta.price, // 价格（来自元数据）
            tokenId: tokenId, // NFT唯一标识
            seller: listedToken.seller, // 卖家地址（来自链上数据）
            owner: listedToken.owner, // 所有者地址（来自链上数据）
            image: meta.image, // 图片链接（来自元数据）
            name: meta.name, // 名称（来自元数据）
            description: meta.description, // 描述（来自元数据）
        };
        console.log(item);
        // 更新状态，供UI渲染
        updateData(item); // 存储NFT详情
        updateDataFetched(true); // 标记数据加载完成
        console.log("address", addr)
        updateCurrAddress(addr); // 存储当前钱包地址
    }

    async function buyNFT(tokenId) {
        try {
            const ethers = require("ethers");
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            // 连接区块链和签名者（同数据加载步骤）
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            //Pull the deployed contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            // 格式化价格：将元数据中的ether价格转换为区块链最小单位wei
            const salePrice = ethers.utils.parseUnits(data.price, 'ether')
            updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")  // 提示用户交易中
            //run the executeSale function  调用合约的购买方法，传入NFT的tokenId和支付金额
            let transaction = await contract.executeSale(tokenId, { value: salePrice }); // salePrice支付的金额（必须等于NFT价格）
            await transaction.wait(); // 等待区块链确认交易（挖矿打包）

            alert('You successfully bought the NFT!'); // 交易成功：提示用户并清空状态
            updateMessage("");
        }
        catch (e) {
            alert("Upload Error" + e)
        }
    }
    
    // 获取路由参数中的tokenId（从URL中提取，如/nft/123中的123）
    const params = useParams();
    const tokenId = params.tokenId;
    if (!dataFetched)
        getNFTData(tokenId);
    if (typeof data.image == "string")
        data.image = GetIpfsUrlFromPinata(data.image);

    return (
        <div style={{ "min-height": "100vh" }}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Price: <span className="">{data.price + " ETH"}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div>
                        {currAddress !== data.owner && currAddress !== data.seller ?
                            <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                            : <div className="text-emerald-700">You are the owner of this NFT</div>
                        }

                        <div className="text-green text-center mt-3">{message}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}