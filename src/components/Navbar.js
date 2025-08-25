import fullLogo from "../full_logo.png";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

const usedChainId = "0x7a69"; // localhost ----> 31337

function Navbar() {
  const [connected, toggleConnect] = useState(false); // 标记钱包是否已连接
  const location = useLocation();// 获取当前路由信息
  const [currAddress, updateAddress] = useState("0x");  // 存储当前连接的钱包地址

  // 获取当前连接的钱包地址
  async function getAddress() {
    const ethers = require("ethers");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    updateAddress(addr);
  }

  function updateButton() {
    const ethereumButton = document.querySelector(".enableEthereumButton");
    // 修改按钮文本为"Connected"
    ethereumButton.textContent = "Connected";
    ethereumButton.classList.remove("hover:bg-blue-70");  // 移除蓝色相关样式
    ethereumButton.classList.remove("bg-blue-500");
    ethereumButton.classList.add("hover:bg-green-70");  // 添加绿色相关样式（表示已连接）
    ethereumButton.classList.add("bg-green-500");
  }

  async function connectWebsite() { // 处理钱包连接逻辑,这是核心函数，负责与 MetaMask 等钱包交互，主要步骤：
    const chainId = await window.ethereum.request({ method: "eth_chainId" }); // 1. 获取当前钱包连接的区块链网络ID.
    console.log(8888888, chainId, usedChainId);
    if (chainId !== usedChainId) {  // 2. 检查网络是否匹配（是否为预期的本地测试网）
      //alert('Incorrect network! Switch your metamask network to Rinkeby');
      await window.ethereum.request({ // 如果网络不匹配，请求切换到目标网络
        method: "wallet_switchEthereumChain", // 小狐狸钱包的标准，提供的api, MetaMask 提供的标准 API，用于请求用户切换到指定网络。
        params: [{ chainId: usedChainId }],
      });
    }
     // 3. 请求用户授权连接钱包
    await window.ethereum
      .request({ method: "eth_requestAccounts" }) // 发送请求，会返回账户的数量.then(accounts) =>{通过判断accounts > 0 来判断账户数量}, 请求用户授权访问其钱包账户（会触发 MetaMask 弹窗）。
      .then(() => {
        updateButton(); // 更新按钮样式
        getAddress();  // 获取并更新钱包地址
        window.location.replace(location.pathname); // 刷新当前页面（保持在当前路由）
      });
  }

  useEffect(() => {
    if (!window.ethereum) return;  // 如果浏览器中没有安装钱包（window.ethereum不存在），直接返回
    let val = window.ethereum.isConnected();  // 检查钱包是否已连接
    if (val) {
      getAddress(); // 获取地址
      toggleConnect(val); // 更新连接状态
      updateButton(); // 更新按钮样式
    }

     // 监听钱包账户变化事件
    window.ethereum.on("accountsChanged", function (accounts) {
      // 当账户切换时，刷新当前页面
      window.location.replace(location.pathname);
    });
  }, [location.pathname]);  // 依赖当前路由，路由变化时重新执行

  return (
    <div className="">
      <nav className="w-screen">
        <ul className="flex items-end justify-between py-3 bg-transparent text-white pr-5">
          <li className="flex items-end ml-5 pb-2">
            <Link to="/">
              <img
                src={fullLogo}
                alt=""
                width={120}
                height={120}
                className="inline-block -mt-2"
              />
              <div className="inline-block font-bold text-xl ml-2">
                NFT Marketplace
              </div>
            </Link>
          </li>
          <li className="w-2/6">
            <ul className="lg:flex justify-between font-bold mr-10 text-lg">
              {location.pathname === "/" ? (
                <li className="border-b-2 hover:pb-0 p-2">
                  <Link to="/">Marketplace</Link>
                </li>
              ) : (
                <li className="hover:border-b-2 hover:pb-0 p-2">
                  <Link to="/">Marketplace</Link>
                </li>
              )}
              {location.pathname === "/sellNFT" ? (
                <li className="border-b-2 hover:pb-0 p-2">
                  <Link to="/sellNFT">List My NFT</Link>
                </li>
              ) : (
                <li className="hover:border-b-2 hover:pb-0 p-2">
                  <Link to="/sellNFT">List My NFT</Link>
                </li>
              )}
              {location.pathname === "/profile" ? (
                <li className="border-b-2 hover:pb-0 p-2">
                  <Link to="/profile">Profile</Link>
                </li>
              ) : (
                <li className="hover:border-b-2 hover:pb-0 p-2">
                  <Link to="/profile">Profile</Link>
                </li>
              )}
              <li>
                <button
                  className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                  onClick={connectWebsite}
                >
                  {connected ? "Connected" : "Connect Wallet"}
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
      <div className="text-white text-bold text-right mr-10 text-sm">
        {currAddress !== "0x"
          ? "Connected to"
          : "Not Connected. Please login to view NFTs"}{" "}
        {currAddress !== "0x" ? currAddress.substring(0, 15) + "..." : ""}
      </div>
    </div>
  );
}

export default Navbar;
