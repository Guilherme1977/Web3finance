import {  useState } from 'react';
import ModalMultiDeposit from './ModalMultiDeposit';
import rightArrow from '../../images/right-arrow.png'
import sortUpIcon from '../../images/sort-up.png';
import sortDownIcon from '../../images/sort-down.png';
import { Contract, ethers } from 'ethers';
import AnimatedDots from '../AnimatedDots';
import { ToastContainer, toast } from 'react-toastify';
const TableElement = (props: any) => {
    // const contractsAddresses = require("../../contracts/AddressesContracts.json")
    // const BalanceOfAbi = require("../../contracts/balanceOfAbi.json");
    // const FeeShareAbi = require("../../contracts/FeeShare.json");
    // const RTokenAbi = require("../../contracts/RTokenAbi.json");
    // const [isOpen, setIsOpen] = useState(false);
    // const [amountDeposit, setAmountDeposit] = useState<number>(0);
    // const [userTokenBalance, setUserTokenBalance] = useState("0");
    // const [userRTokenBalance, setUserRTokenBalance] = useState("0");
    // const [userDepositBalance, setUserDepositBalance] = useState("0");
    // const [userNativeBalance, setUserNativeBalance] = useState("0");
    // const changeOpen = (e: any, isOpen: boolean) => {
    //     setIsOpen(!isOpen);
    //     e.stopPropagation();
    //     e.nativeEvent.stopImmediatePropagation();

    // }
    // const { isFeeInToken,
    //     setIsFeeInToken } = Web3State();
    // const handleAmountChange = (event: any) => {
    //     setAmountDeposit(parseFloat(event.target.value));
    // };
    // const getUserDepositBalance = () => {
    //     if (active) {
    //         const contract = new Contract(contractsAddresses[props.network.name][0]["r" + props.token.name], RTokenAbi, library?.getSigner());
    //         contract.balanceOf(account).then((res: any) => {
    //             setUserDepositBalance(ethers.utils.formatUnits(res._hex, props.token.decimal));
    //         });
    //     }

    // }
    // const getUserBalanceRToken = () => {
    //     if (active) {
    //         let contract = new Contract(contractsAddresses[props.network.name][0]["r" + props.token.name], RTokenAbi, library?.getSigner());
    //         contract.balanceOf(account).then((res: any) => {
    //             setUserRTokenBalance(ethers.utils.formatUnits(res._hex, props.token.decimal));
    //             props.token.userBalance = ethers.utils.formatUnits(res._hex, props.token.decimal);
    //             // props.updateTokens(ethers.utils.formatUnits(res._hex, props.token.decimal), props.token.name)
    //         });
    //     }

    // }
    // const getTokenBalance = async () => {
    //     if (active) {
    //         const balanceOf = new Contract(props.token.address, BalanceOfAbi, library.getSigner());
    //         const price = await balanceOf.balanceOf(account);
    //         setUserTokenBalance(ethers.utils.formatUnits(price._hex, props.token.decimal));
    //     }
    // }
    // const getNativeBalance = async () => {
    //     if(active){
    //         const balance = await library?.getSigner().getBalance();
    //         console.log(balance)
    //         setUserNativeBalance(ethers.utils.formatEther(balance))
    //     }
      
    // }
    // getNativeBalance();
    // // const getTotalDeposidedInUSD = () => {
    // //     return (parseFloat(props.token.deposites) * parseFloat(props.token.tokenPrice)).toFixed(2);
    // // }
    // const getPriceInUsd = () => {
    //     if (userTokenBalance && props.token.tokenPrice) {
    //         return (parseFloat(userTokenBalance) * parseFloat(props.token.tokenPrice)).toFixed(4)
    //     }
    //     return <AnimatedDots />
    // }
    // const setMaxPrice = () => {
    //     setAmountDeposit(parseFloat(userTokenBalance));
    // }
    // const depositAmount = async () => {
    //     let contract = new Contract(contractsAddresses[props.network.name][0][props.token.name], RTokenAbi, library?.getSigner());

    //     let checkAllowance = await contract.allowance(account, contractsAddresses[props.network.name][0].FeeShare);
    //     let feeShare = new Contract(contractsAddresses[props.network.name][0].FeeShare, FeeShareAbi, library?.getSigner());
    //     if (parseFloat(ethers.utils.formatUnits(checkAllowance._hex, props.token.decimal)) <= amountDeposit!) {
    //         const idToast = toast.loading("Approving please wait...")
    //         await contract?.approve(contractsAddresses[props.network.name][0].FeeShare, ethers.utils.parseUnits(amountDeposit!.toString(), props.token.decimal), { gasLimit: 200000 })
    //             .then((res: any) => {
    //                 res.wait().then(async (receipt: any) => {
    //                     toast.update(idToast, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //                     const idToast2 = toast.loading("Depositing please wait...")
    //                     await feeShare.deposit(contractsAddresses[props.network.name][0][props.token.name], ethers.utils.parseUnits(amountDeposit!.toString(), props.token.decimal), { gasLimit: 200000 }).then((result: any) => {
    //                         result.wait().then(async (recept: any) => {
    //                             getUserBalanceRToken();
    //                             getTokenBalance();
    //                             toast.update(idToast2, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //                         })
    //                     }).catch((err: any) => {
    //                         toast.update(idToast2, { render: "Your transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //                     })
    //                 })
    //             }).catch((err: any) => {
    //                 toast.update(idToast, { render: "Your transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //             })
    //     }
    //     else {
    //         const idToast2 = toast.loading("Depositing please wait...")
    //         feeShare.deposit(contractsAddresses[props.network.name][0][props.token.name], ethers.utils.parseUnits(amountDeposit!.toString(), props.token.decimal), { gasLimit: 200000 }).then((result: any) => {
    //             result.wait().then(async (recept: any) => {
    //                 getUserBalanceRToken();
    //                 getTokenBalance();
    //                 toast.update(idToast2, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //             })
    //         }).catch((err: any) => {
    //             toast.update(idToast2, { render: "Your transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //         }).catch((err: any) => {
    //             toast.update(idToast2, { render: "Your transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //         })
    //     }
    // }
    // const witdrawDeposit = async () => {
    //     let feeShare = new Contract(contractsAddresses[props.network.name][0].FeeShare, FeeShareAbi, library?.getSigner());
    //     const idToast = toast.loading("Processing transaction please wait...")
    //     if (amountDeposit! > parseFloat(userDepositBalance) || amountDeposit! === undefined) {
    //         toast.update(idToast, { render: "Input amount to withdraw", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //     }
    //     else {
    //         feeShare.withdraw(contractsAddresses[props.network.name][0][props.token.name], ethers.utils.parseUnits(amountDeposit!.toString(), props.token.decimal), { gasLimit: "210000" }).then((result: any) => {
    //             result.wait().then(async (recept: any) => {
    //                 toast.update(idToast, { render: "Withdraw succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //                 getUserBalanceRToken();
    //                 getTokenBalance();
    //             }).catch((err: any) => {
    //                 console.log(err, "err");
    //             })
    //         }).catch((err: any) => {
    //             toast.update(idToast, { render: "Transaction rejected", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
    //         });
    //     }

    // }
    // const changeFeeType = () => {
    //     setIsFeeInToken(!isFeeInToken);
    // }
    // // getUserBalanceRToken();
    // // getUserDepositBalance();
    // // getTokenBalance();
    // // useEffect(() => {
    // //     getUserBalanceRToken();
    // //     getUserDepositBalance();
    // //     getTokenBalance();
    // // });
   
    //     getUserBalanceRToken();
    //     getUserDepositBalance();
    //     getTokenBalance();
    return (
        <></>
        // TODO Fixe styles tailwind
        // <div className={
        //     (isOpen ?
        //         " bg-blue-100 " :
        //         " hover:bg-blue-100 hover:rounded-lg cursor-pointer")
        //     + "flex flex-col rounded-lg mb-4 py-2"
        // }>
        //     <div onClick={(e) => { changeOpen(e, isOpen) }}
        //         className=' flex font-bold flex-row justify-between px-5 cursor-pointer'>
        //         <div className='flex relative ml-10 font-bold w-[150px]'>
        //             <button className=''>
        //                 <img alt="img"
        //                     className='absolute left-[-40px] top-[-3px]'
        //                     src={isOpen ? sortUpIcon : sortDownIcon} />
        //             </button>{props.token.name}
        //         </div>
        //         <div className='mr-[-10px] flex font-bold w-[150px] justify-left'>{props.token.tokenPrice !== "0" ? props.token.tokenPrice.slice(0, 8) : <AnimatedDots />}</div>
        //         <div className='w-[150px] flex justify-center'>{props.token.deposits !== "0" ? parseFloat((props.token.deposits * props.token.tokenPrice).toString()).toFixed(2) : <AnimatedDots />} $</div>
        //         <div className='w-[150px] flex justify-center'>{props.token.userBalance !== "0" ? props.token.userBalance : <AnimatedDots />}</div>
        //     </div>
        //     <ToastContainer />
        //     {/* //TODO Move this modal to components folder */}
        //     <div className={isOpen ? "isopen mr-3 ml-3 mt-2 bg-blue-200 rounded-md px-5 py-5 mb-5" : "hidden isopen"}>
        //         <div className='flex flex-row justify-between'>
        //             <div className='flex flex-col w-[60%] '>
        //                 <div className='flex justify-between mb-3'>
        //                     <label>Balance <span className='font-bold'>{props.token.name}</span></label>
        //                     <span>   {
        //                        props.token.isNative ? userNativeBalance !== "0" ? userNativeBalance :  <AnimatedDots /> : userTokenBalance !== "0" ? userTokenBalance : <AnimatedDots />
        //                     }
        //                      ($ {getPriceInUsd()})
        //                     </span>
        //                 </div>
        //                 <div className='relative w-[100%] flex flex-row'>
        //                     <input
        //                         value={amountDeposit}
        //                         onChange={handleAmountChange}
        //                         disabled={userTokenBalance !== "0" ? false : true}
        //                         step={"0.01"}
        //                         type="number"
        //                         className={userTokenBalance !== "0" ? "rounded-lg py-1 text-[20px] disabled:opacity-75 border-2 pr-[60px] border-gray-400 w-[100%]" : "cursor-not-allowed w-[100%] rounded-lg px-3 py-3 text-[20px] disabled:opacity-75 border-2 border-gray-400"}
        //                     ></input>
        //                     <button
        //                         disabled={userTokenBalance !== "0" ? false : true}
        //                         className={userTokenBalance !== "0" ?
        //                             "absolute  right-2 bottom-1 rounded-xl bg-gray-300 px-2 py-1"
        //                             : "text-gray-400 font-bold absolute cursor-not-allowed right-2 bottom-1 rounded-xl bg-gray-300 px-2 py-1"}
        //                         onClick={() => { setMaxPrice() }}>MAX</button>
        //                 </div>
        //             </div>
        //             <div className='flex flex-col w-[40%] ml-4'>

        //                 {props.token.isNative ? null: <button onClick={(e) => { e.preventDefault(); depositAmount() }} disabled={amountDeposit !== undefined ? false : true} className={amountDeposit !== undefined ? "mt-2 hover:bg-gray-600 bg-gray-500 text-white font-bold h-[40px] rounded-md" : "mt-2 cursor-not-allowed bg-gray-400 text-white font-bold h-[40px] rounded-md"}>Deposit</button>}
                        

        //                 <ModalMultiDeposit network={props.network} token={props.token} userTokenBalance={userTokenBalance} />
        //             </div>
        //         </div>
        //         <div className='mt-5 flex justify-between items-center'>
        //             <span>Vault Details</span>
        //             {
        //                 props.token.isNative ? "" :

        //                     <label className="inline-flex mt-3 relative items-center cursor-pointer">
        //                         <input type="checkbox" onChange={changeFeeType} value={isFeeInToken.toString()} id="default-toggle" className="sr-only peer" />
        //                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        //                         <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Pay fee in token</span>
        //                     </label>
        //             }
        //            {props.token.isNative ? null :  <button
        //                 onClick={() => { witdrawDeposit() }}
        //                 disabled={parseFloat(userRTokenBalance) > 0 ? false : true}
        //                 className={parseFloat(userRTokenBalance) > 0 ? "flex justify-between items-center w-[20%] hover:bg-gray-600 bg-gray-500 text-white font-bold h-[40px] rounded-md px-3" : "flex justify-between items-center cursor-not-allowed w-[20%] bg-gray-400 text-white font-bold h-[40px] rounded-md px-3"} >Withdraw <img className='w-[30px]' src={rightArrow} alt="rightArrow" /></button>} 
                   
        //         </div>
        //     </div>
        // </div>
    );
}
export default TableElement;