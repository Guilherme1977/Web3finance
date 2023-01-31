import sortUpIcon from '../../images/sort-up.png';
import sortDownIcon from '../../images/sort-down.png';
import EditorAddresses from '../assets/EditorAddresses';
import AnimatedDots from '../AnimatedDots';
import { openElement } from '../../store/token/tokenSlice';
import { currentNetwork } from "../../store/network/networkSlice";
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAccount } from 'wagmi';

const Row = (props: any) => {
    const dispatch = useAppDispatch();
    const network = useAppSelector(currentNetwork)
    const { isConnected } = useAccount()
    return (
        <div className={
            (props.token.isOpen ?
                " bg-blue-100 rounded-lg" :
                " hover:bg-blue-100 hover:rounded-xl cursor-pointer")
            + " mx-2 my-1 py-1 mb-3"
        }>
            <div
                className="cursor-pointer items-center  mx-2 my-1 py-3 rounded-xl justify-between flex flex-row hover:bg-blue-100"
                onClick={(e) => {
                    if (isConnected)
                        dispatch(openElement({ chainId: network.chainId, name: props.token.name }))
                }}
            >
                <div className='flex justify-center items-center font-lg w-[150px]'>
                    <button className=''>
                        <img alt="img"
                            className={`${props.token.isOpen ? "bg-orange-600" : ""} w-[17px] h-[17px] mr-2 hover:bg-orange-600 rounded`}
                            src={props.token.isOpen ? sortUpIcon : sortDownIcon} />
                    </button>
                    <img className='w-[35px] h-[35px]' src={require(`../../images/icons/${props.token.name}.png`)} alt={props.token.name} />
                    {props.token.name}
                </div>
                <div className='flex justify-center font-lg w-[150px]'>
                    {props.token.tokenPrice === "0" ? <AnimatedDots /> : parseFloat(props.token.tokenPrice).toFixed(2)}
                </div>
                <div className='flex justify-center font-lg w-[150px]'>
                    {props.token.isNative ? "" : props.token.deposits === "0" ? <AnimatedDots /> : props.token.deposits}
                </div>
                <div className='flex justify-center font-lg w-[150px]'>
                    {props.token.isNative ? "" : props.token.userBalanceDeposit === "0" ? <AnimatedDots /> : props.token.userBalanceDeposit}
                </div>
            </div>
            <div className={props.token.isOpen ? "isopen mr-3 ml-3 mt-2 bg-blue-200 rounded-md px-5 py-5 mb-5 flex" : "hidden isopen"}>
                <EditorAddresses token={props.token} isNative={props.token.isNative} />
            </div>
        </div>
    )
}
export default Row;