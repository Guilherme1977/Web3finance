// import { currentNetwork } from "../../store/network/networkSlice";
// import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import EditorAddressesToken from '../assets/EditorAddressesToken';

const RowToken = (props: any) => {
    // const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(false);
    // const network = useAppSelector(currentNetwork)
    const { isConnected } = useAccount()
    return (
        <div className={
            (isOpen ?
                " bg-blue-100 rounded-lg" :
                " hover:bg-blue-100 hover:rounded-xl cursor-pointer")
            + " mx-2 my-1 py-1 mb-3"
        }>
            <div
                className="cursor-pointer items-center  mx-2 my-1 py-3 rounded-xl flex flex-row hover:bg-blue-100"
                onClick={(e) => {
                    if (isConnected)
                        setIsOpen(!isOpen)
                }}
            >
                <div className='flex justify-left items-center pl-[25px] font-lg w-[25%]'>
                    <button className={`${ isOpen === true ? "bg-arrowUp" : "bg-arrowDown"} w-[15px] h-[15px] mr-2 bg-[length:15px_15px] rounded `}>
                     
                    </button>
                    {/* <img className='w-[35px] h-[35px]' src={require(`../../images/icons/${props.token.name}.png`)} alt={props.token.name} /> */}
                   <span className='pl-2'></span> 
                </div>
                <div className='flex justify-center font-lg  w-[25%]'>
                    {/* {props.token.tokenPrice === "0" ? <AnimatedDots /> : parseFloat(props.token.tokenPrice).toFixed(2)} */}
                </div>
                <div className='flex justify-center font-lg  w-[25%]'>
                    {/* {props.token.isNative ? "" : props.token.deposits === "0" ? <AnimatedDots /> : parseFloat(props.token.deposits).toFixed(2)} */}
                </div>
                <div className='flex justify-end pr-[35px] font-lg  w-[25%]'>
                    {/* {props.token.isNative ? "" : props.token.userBalanceDeposit === "0" ? <AnimatedDots /> : parseFloat(props.token.userBalanceDeposit).toFixed(2)} */}
                </div>
            </div>
            <div className={isOpen ? "isopen mr-3 ml-3 mt-2 bg-blue-200 rounded-md px-5 py-5 mb-5 flex" : "hidden isopen"}>
                <EditorAddressesToken />
            </div>
        </div>
    )
}
export default RowToken;