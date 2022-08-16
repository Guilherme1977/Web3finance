import { useEffect, useState } from "react";
import iconSort from '../../images/sort_icon.svg';
import { useWeb3React } from "@web3-react/core";
import { Buffer } from 'buffer';
import TableElement from "./TableElement";
import { Contract, ethers } from "ethers";
import sortIcon from "../../images/sort.svg";
import sortAscIcon from "../../images/asc.svg";
import sortDescIcon from "../../images/desc.svg";
Buffer.from('anything', 'base64');
const TableResponsive = () => {
    const { active, account, library } = useWeb3React();
    const rinkebyTokens = require("../../tokens/rinkeby.json");
    const ethereumTokens = require("../../tokens/ethereum.json");
    const bscTokens = require("../../tokens/bsc.json");
    const polygonTokens = require("../../tokens/polygon.json");
    const searchIcon = require("../../images/search.png");
    const contractsAddresses = require("../../contracts/AddressesContracts.json");
    const FeeShareAbi = require("../../contracts/FeeShare.json");
    const RTokenAbi = require("../../contracts/RTokenAbi.json");
    const OracleAbi = require("../../contracts/oracle/Oracle.json");
    // const sortedIcon = require("../../images/sort_icon.svg");
    const [filters, setFilters] = useState([
        {
            name: "All",
            isSelected: true
        },
        {
            name: "Token Price",
            isSelected: false
        },
        {
            name: "Some Filter 2",
            isSelected: false
        },
        {
            name: "Some Filter 3",
            isSelected: false
        },
        {
            name: "Some Filter 4",
            isSelected: false
        },
        {
            name: "Some Filter 5",
            isSelected: false
        }
    ]);
    const [networks, setNetworks] = useState([
        {
            name: "Ethereum",
            icon: require("../../images/ethereum.png"),
            isSelected: false
        },
        {
            name: "Polygon",
            icon: require("../../images/polygon.png"),
            isSelected: false
        },
        {
            name: "Rinkeby Testnet",
            icon: require("../../images/ethereum.png"),
            isSelected: true
        },
        {
            name: "BSC",
            icon: require("../../images/binance.png"),
            isSelected: false
        }
    ]);
    const [sortName, setSortName] = useState("");
    const [sortPrice, setSortPrice] = useState("");
    const [sortDeposits, setSortDeposits] = useState("");
    const [sortUserDeposit, setSortUserDeposit] = useState("");
    const [currentNetwork, setCurrentNetwork] = useState("Rinkeby Testnet");
    const [tokens, setTokens] = useState(rinkebyTokens.Tokenization);
    const updateNetwork = (network: any) => {
        const newState = networks.map(obj => {
            if (obj.name === network.name) {
                setCurrentNetwork(network.name);
                switch (network.name) {
                    case "Ethereum":
                        setTokens(ethereumTokens.Tokenization);
                        break;
                    case "Polygon":
                        setTokens(polygonTokens.Tokenization);
                        break;
                    case "Rinkeby Testnet":
                        setTokens(rinkebyTokens.Tokenization);
                        break;
                    case "BSC":
                        setTokens(bscTokens.Tokenization);
                        break;
                    default:
                        setTokens([]);
                }
                return { ...obj, isSelected: true };
            }
            else {
                return { ...obj, isSelected: false };
            }
        });
        setNetworks(newState);
    };
    const updateState = (button: any) => {
        const newState = filters.map(obj => {
            if (obj.name === button.name) {
                return { ...obj, isSelected: true };
            }
            else {
                return { ...obj, isSelected: false };
            }
        });
        setFilters(newState);
    };
    const sortByName = () => {
        const res = [...tokens].sort((a: any, b: any) => {
            if (sortName === "asc") {
                return a.name > b.name ? 1 : -1;
            }
            else {
                return a.name < b.name ? 1 : -1;
            }
        });
        setSortPrice("");
        setSortDeposits("");
        setSortUserDeposit("");
        setSortName(sortName === "asc" ? "desc" : "asc");
        setTokens(res);
    }
    const sortByPrice = () => {
        const res = [...tokens].sort((a: any, b: any) => {
            if (sortPrice === "asc") {
                return a.tokenPrice > b.tokenPrice ? 1 : -1;
            }
            else {
                return a.tokenPrice < b.tokenPrice ? 1 : -1;
            }
        });
        setSortName("");
        setSortDeposits("");
        setSortUserDeposit("");
        setSortPrice(sortPrice === "asc" ? "desc" : "asc");
        setTokens(res);
    }
    const sortByDeposits = () => {
        const res = [...tokens].sort((a: any, b: any) => {
            if (sortDeposits === "asc") {
                return a.deposits > b.deposits ? 1 : -1;
            }
            else {
                return a.deposits < b.deposits ? 1 : -1;
            }
        });
        setSortPrice("");
        setSortName("");
        setSortUserDeposit("");
        setSortDeposits(sortDeposits === "asc" ? "desc" : "asc");
        setTokens(res);
    }
    const sortByUserDeposit = () => {
        const res = [...tokens].sort((a: any, b: any) => {
            if (sortUserDeposit === "asc") {
                return a.userBalance > b.userBalance ? 1 : -1;
            }
            else {
                return a.userBalance < b.userBalance ? 1 : -1;
            }
        });
        setSortPrice("");
        setSortName("");
        setSortDeposits("");
        setSortUserDeposit(sortUserDeposit === "asc" ? "desc" : "asc");
        setTokens(res);
    }
    useEffect(() => {
        if (active) {
            tokens.map((token: any) => {
                const contract = new Contract(contractsAddresses["r" + token.name], RTokenAbi, library?.getSigner());
                contract.totalSupply().then((res: any) => {
                    token.deposits = ethers.utils.formatUnits(res._hex, token.decimal);
                });
                contract.balanceOf(account).then((res: any) => {
                    token.userBalance = ethers.utils.formatUnits(res._hex, token.decimal);
                });
                const contractOracle = new Contract(contractsAddresses.oracle, OracleAbi, library?.getSigner())
                contractOracle.getAssetPrice(token.address).then((res: any) => {
                    token.tokenPrice = ethers.utils.formatUnits(res._hex, 8)
                });

            });
            console.log(tokens);
            // updateNetwork(currentNetwork);
        }
    }, [account, active])

    return (
        <div className="">
            <div className="flex justify-between items-center border-b-[1px] border-gray-300">
                {
                    networks.map((network, index) => {
                        return (
                            network.isSelected ?
                                <div key={index} className="group w-full h-full cursor-not-allowed flex flex-row items-center justify-center border-b-4 px-10 py-10 border-orange-400">
                                    <img className="w-[40px] mr-5" src={network.icon} alt={network.name} />
                                    <h2 className="group-hover:underline text-xl font-bold">{network.name}</h2>
                                </div> :
                                <div key={index} onClick={() => updateNetwork(network)} className="group w-full h-full cursor-pointer px-10 py-10 flex flex-row items-center justify-center">
                                    <img className="w-[40px] mr-5" src={network.icon} alt={network.name} />
                                    <h2 className="group-hover:underline text-xl font-bold">{network.name}</h2>
                                </div>
                        )
                    })
                }
            </div>
            <div className="flex flex-row justify-between px-5 py-[15px] border-b-[1px] border-gray-300">
                <div className="flex justify-between items-center">
                    {
                        filters.map((button, index) => {
                            return (
                                button.isSelected ?
                                    <button key={index} className="min-w-[50px] px-2 h-[50px] mr-5 border-2 rounded-xl border-orange-400 bg-yellow-200">{button.name}</button> :
                                    <button key={index} onClick={() => updateState(button)} className="min-w-[50px] px-2 h-[50px] mr-5 border-2 rounded-xl border-gray-400 bg-white">{button.name}</button>
                            )
                        })
                    }
                </div>
                <div className="flex flex-col mr-10 relative">
                    <img src={searchIcon} className="absolute left-2 top-1 w-[35px]" alt="icon" />
                    <input className="rounded-full pl-[50px] text-lg py-[5px] border-2 border-gray-400 focus:outline-none" placeholder="Search" />

                    <label htmlFor="default-toggle" className="inline-flex relative items-center cursor-pointer mt-3">
                        <input type="checkbox" value="" id="default-toggle" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none  dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-bold text-gray-900 dark:text-gray-300">Deposited only</span>
                    </label>
                </div>
            </div>
            <div className="px-5 py-2 justify-between flex flex-row border-gray-300">
                <div onClick={() => sortByName()} className="flex cursor-pointer justify-center w-[150px] font-lg">Asset
                    <img className="ml-2 w-[16px]" src={sortName === "" ? sortIcon : sortName === "asc" ? sortAscIcon : sortDescIcon} alt="icon" />
                </div>
                <div onClick={() => sortByPrice()} className="flex cursor-pointer justify-center w-[150px]">Token Price
                    <img className="ml-2 w-[16px]" src={sortPrice === "" ? sortIcon : sortPrice === "asc" ? sortAscIcon : sortDescIcon} alt="icon" />
                </div>
                <div onClick={() => sortByDeposits()} className="flex cursor-pointer justify-center w-[150px]">Deposit ($)
                    <img className="ml-2 w-[16px]" src={sortDeposits === "" ? sortIcon : sortDeposits === "asc" ? sortAscIcon : sortDescIcon} alt="icon" />
                </div>
                <div onClick={() => sortByUserDeposit()} className="flex cursor-pointer justify-center w-[150px]">Your balance
                    <img className="ml-2 w-[16px]" src={sortUserDeposit === "" ? sortIcon : sortUserDeposit === "asc" ? sortAscIcon : sortDescIcon} alt="icon" />
                </div>
            </div>
            {
                tokens && tokens.map((token: any, index: any) => {
                    return (
                        <TableElement token={token} key={index + currentNetwork} network={currentNetwork} />
                    )
                })
            }
            {/* {
                <TokensList tokens={tokens}/>
            } */}
        </div>
    );
}
export default TableResponsive;