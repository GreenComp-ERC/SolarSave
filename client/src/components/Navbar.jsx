import React, { useContext, useState } from "react";
import { HiMenuAlt4 } from "react-icons/hi";
import { AiOutlineClose } from "react-icons/ai";
import { TransactionContext } from "../context/TransactionContext";
import logo from "../../images/logo.png";
import { shortenAddress } from "../utils/shortenAddress";
import SolarToken from "./Wallet";
import Store from "./Store";
import TestPanels from "./TestPanels";

const NavBarItem = ({ title, classprops, onClick }) => (
  <li
    className={`mx-4 cursor-pointer text-lg text-white transition-all duration-300 hover:text-[#ffcc00] ${classprops}`}
    onClick={onClick}
  >
    {title}
  </li>
);

const Navbar = ({ logoSize = "w-16" }) => {
  const [toggleMenu, setToggleMenu] = useState(false);

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isTestPanelsModalOpen, setIsTestPanelsModalOpen] = useState(false);

  const { currentAccount, connectWallet } = useContext(TransactionContext);

  return (
    <nav className="w-full flex md:justify-between justify-between items-center p-4 bg-black shadow-lg relative z-[10001] navbar">
      <div className="md:flex-[0.5] flex-initial justify-center items-center">
        <img
          src={logo}
          alt="logo"
          className={`${logoSize} cursor-pointer hover:scale-105 transition-transform duration-300`}
        />
      </div>

        <ul className="text-white md:flex hidden list-none flex-row justify-between items-center flex-initial">
            {["关于", "博客", "通讯", "文档", "区块浏览器"].map((item, index) => (
                <NavBarItem key={item + index} title={item}/>
            ))}

            <li className="relative group cursor-pointer mx-4 text-lg text-white transition-all duration-300 hover:text-[#ffcc00]">
                测试工具
                <ul
                    className="absolute left-0 mt-2 w-32 bg-black shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300"
                >
                    <li
                        className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                        onClick={() => setIsTokenModalOpen(true)}
                    >
                        代币测试
                    </li>
                    <li
                        className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                        onClick={() => setIsStoreModalOpen(true)}
                    >
                        商店测试
                    </li>
                    <li
                        className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                        onClick={() => setIsTestPanelsModalOpen(true)}
                    >
                        交易测试
                    </li>
                </ul>
            </li>


            {!currentAccount ? (
                <li
                    className="bg-[#2952e3] py-2 px-7 mx-4 rounded-full cursor-pointer hover:bg-[#2546bd] transition-all duration-300"
                    onClick={connectWallet}
                >
                    连接钱包
                </li>
            ) : (
                <li
                    className="text-white bg-[#2952e3] py-2 px-7 mx-4 rounded-full cursor-pointer hover:bg-[#2546bd] transition-all duration-300"
                    onClick={() => setIsTokenModalOpen(true)}
                >
                    {shortenAddress(currentAccount)}
                </li>
            )}
        </ul>

        <div className="flex relative">
            {!toggleMenu && (
                <HiMenuAlt4
                    fontSize={28}
                    className="text-white md:hidden cursor-pointer hover:text-[#ffcc00]"
                    onClick={() => setToggleMenu(true)}
                />
            )}
            {toggleMenu && (
                <>
                    <AiOutlineClose
                        fontSize={28}
                        className="text-white md:hidden cursor-pointer hover:text-[#ffcc00]"
                        onClick={() => setToggleMenu(false)}
                    />
                    <ul
                        className="z-10 fixed top-0 right-0 p-3 w-[70vw] h-screen bg-black shadow-2xl md:hidden list-none
              flex flex-col justify-start items-end rounded-md text-white animate-slide-in"
                    >
                    <li className="text-xl w-full my-2">
                <AiOutlineClose onClick={() => setToggleMenu(false)} />
              </li>
              {["关于", "博客", "通讯", "文档", "区块浏览器"].map((item, index) => (
                <NavBarItem key={item + index} title={item} classprops="my-2 text-lg" />
              ))}
            </ul>
          </>
        )}
      </div>

      {isTokenModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[10003]">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-96 relative z-[10004]">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setIsTokenModalOpen(false)}
            >
              ✖
            </button>
            <SolarToken />
          </div>
        </div>
      )}

      {isStoreModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[10003]">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-[80%] h-[80%] relative z-[10004] overflow-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setIsStoreModalOpen(false)}
            >
              ✖
            </button>
            <Store />
          </div>
        </div>
      )}

      {isTestPanelsModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-[10003]">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-[80%] h-[80%] relative z-[10004] overflow-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setIsTestPanelsModalOpen(false)}
            >
              ✖
            </button>
            <TestPanels />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
