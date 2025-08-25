import Navbar from "./Navbar";
import { useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import Marketplace from '../Marketplace.json';

export default function SellNFT () {
    const [formParams, updateFormParams] = useState({ name: '', description: '', price: ''}); // 存储用户输入的 NFT 基本信息（name名称、description描述、price价格）。
    const [fileURL, setFileURL] = useState(null); // 存储 NFT 图片上传到 IPFS 后的访问链接（链下存储的关键标识）
    const ethers = require("ethers");
    const [message, updateMessage] = useState(''); // 用于向用户展示实时状态（如 “上传中”“请填写完整信息” 等）

    async function disableButton() {
        const listButton = document.getElementById("list-button")
        listButton.disabled = true
        listButton.style.backgroundColor = "grey";
        listButton.style.opacity = 0.3;
    }

    async function enableButton() {
        const listButton = document.getElementById("list-button")
        listButton.disabled = false
        listButton.style.backgroundColor = "#A500FF";
        listButton.style.opacity = 1;
    }

    //This function uploads the NFT image to IPFS
    async function OnChangeFile(e) {
        var file = e.target.files[0];  // 获取用户选择的图片文件
        //check for file extension
        try {
            //upload the file to IPFS
            disableButton(); // 禁用发布按钮，防止重复操作
            updateMessage("Uploading image.. please dont click anything!") // 提示用户图片上传中
            const response = await uploadFileToIPFS(file); // 调用工具函数将图片上传到IPFS（通过Pinata等IPFS服务）
            if(response.success === true) {
                enableButton(); // 上传成功，恢复按钮可用
                updateMessage(""); // 清空提示
                console.log("Uploaded image to Pinata: ", response.pinataURL)
                setFileURL(response.pinataURL); // 保存图片在IPFS的访问链接
            }
        }
        catch(e) {
            console.log("Error during file upload", e);
        }
    }

    // 为什么用 IPFS？：NFT 的图片属于大容量数据，直接存储在区块链上成本极高。IPFS（分布式文件系统）是链下存储的常用方案，通过哈希值唯一标识文件，确保不可篡改。
    // 这里的uploadFileToIPFS是一个工具函数（未展示），实际作用是将图片上传到 Pinata（IPFS 网关服务），返回可直接访问的 URL（如https://gateway.pinata.cloud/ipfs/...）。

    //This function uploads the metadata to IPFS
    async function uploadMetadataToIPFS() {
        const {name, description, price} = formParams;
        //Make sure that none of the fields are empty // 校验：确保用户填写了所有必要信息（名称、描述、价格）且图片已上传
        if( !name || !description || !price || !fileURL)
        {
            updateMessage("Please fill all the fields!")
            return -1; // 校验失败，返回错误标识
        }

        // 构建NFT元数据JSON（包含关键信息）
        const nftJSON = {
            name, description, price, image: fileURL // NFT名称/NFT描述// 价格图片在IPFS的链接（步骤1返回的URL）
        }

        try {
            //upload the metadata JSON to IPFS 调用工具函数将元数据JSON上传到IPFS
            const response = await uploadJSONToIPFS(nftJSON);
            if(response.success === true){
                console.log("Uploaded JSON to Pinata: ", response)
                return response.pinataURL; // 返回元数据在IPFS的访问链接
            }
        }
        catch(e) {
            console.log("error uploading JSON metadata:", e)
        }
    }

    async function listNFT(e) {
        e.preventDefault();

        //Upload data to IPFS
        try {
            const metadataURL = await uploadMetadataToIPFS();
            if(metadataURL === -1)
                return;
            //After adding your Hardhat network to your metamask, this code will get providers and signers // 连接用户钱包（如MetaMask）
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();  // 获取当前钱包的签名者（用于后续交易签名）
            disableButton();
            updateMessage("Uploading NFT(takes 5 mins).. please dont click anything!")

            //Pull the deployed contract instance // 初始化NFT市场合约实例
            let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer)

            //massage the params to be sent to the create NFT request // 处理价格单位：将用户输入的ether转换为区块链最小单位wei（1 ether = 10^18 wei）
            const price = ethers.utils.parseUnits(formParams.price, 'ether')
            let listingPrice = await contract.getListPrice() // 获取平台挂牌费用（由合约定义，发布NFT需支付的手续费）
            listingPrice = listingPrice.toString()

            //actually create the NFT // 调用合约的createToken方法，铸造NFT并发布到市场 // 步骤2返回的元数据IPFS链接（链上存储的核心标识）  // NFT的售价（wei单位）
            let transaction = await contract.createToken(metadataURL, price, { value: listingPrice }) // 附加挂牌费用（作为交易的value发送）
            await transaction.wait() // 等待区块链确认交易（挖矿打包）

            alert("Successfully listed your NFT!");
            enableButton();
            updateMessage("");
            updateFormParams({ name: '', description: '', price: ''});
            window.location.replace("/")
        }
        catch(e) {
            console.log( "Upload error"+e );
            alert( "Upload error"+e ) 
            
        }
    }

    console.log("Working", process.env);

/*  用户上传 NFT 图片 → 图片被上传到 IPFS，返回fileURL。
    用户填写 NFT 信息（名称、描述、价格） → 系统校验信息完整性。
    系统将 NFT 元数据（含fileURL）上传到 IPFS，返回metadataURL。
    连接用户钱包，初始化市场合约 → 准备上链操作。
    调用合约createToken方法，传入metadataURL和价格，支付挂牌费用 → 区块链铸造 NFT 并记录信息。
    交易确认后，提示成功并跳转首页。

    整个流程的核心是 “链下存储（IPFS）+ 链上记录（区块链）” 的结合：IPFS 存储大容量数据（图片、元数据），
    区块链仅记录关键标识（元数据 URL、所有权、价格），兼顾效率与安全性。 
    */
   
    return (
        <div className="">
        <Navbar></Navbar>
        <div className="flex flex-col place-items-center mt-10" id="nftForm">
            <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
            <h3 className="text-center font-bold text-purple-500 mb-8">Upload your NFT to the marketplace</h3>
                <div className="mb-4">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">NFT Name</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Axie#4563" onChange={e => updateFormParams({...formParams, name: e.target.value})} value={formParams.name}></input>
                </div>
                <div className="mb-6">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
                    <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" cols="40" rows="5" id="description" type="text" placeholder="Axie Infinity Collection" value={formParams.description} onChange={e => updateFormParams({...formParams, description: e.target.value})}></textarea>
                </div>
                <div className="mb-6">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="price">Price (in ETH)</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" placeholder="Min 0.01 ETH" step="0.01" value={formParams.price} onChange={e => updateFormParams({...formParams, price: e.target.value})}></input>
                </div>
                <div>
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="image">Upload Image (&lt;500 KB)</label>
                    <input type={"file"} onChange={OnChangeFile}></input>
                </div>
                <br></br>
                <div className="text-red-500 text-center">{message}</div>
                <button onClick={listNFT} className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg" id="list-button">
                    List NFT
                </button>
            </form>
        </div>
        </div>
    )
}