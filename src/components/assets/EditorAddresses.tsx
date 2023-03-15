import { useState } from "react";
import EditorFile from "./EditorFile";
import 'react-toastify/dist/ReactToastify.css';
import EditorManual from "./EditorManual";
import PreviewResult from "./PreviewResult";
import DepositWithdraw from "./DepositWithdraw";
import ToogleFee from "./multisend/ToogleFee";
import { addressesToSend } from "../../store/multiDeposit/multiDepositSlice";
const EditorAddresses = (props: any) => {
    const [isManual, setIsManual] = useState(true);
    const [isPreview, setIsPreview] = useState(true);
    const [isNativeFee, setIsNativeFee] = useState(false);
    const showNext = () => {
        if (addressesToSend.length > 0) {
            setIsPreview(!isPreview);
        }
        else {
            // const idToast = toast( "No addresses and amounts added", {type: "error", autoClose: 2000, isLoading: false, position: toast.POSITION.TOP_CENTER })
        }
    }
    const toogleNativeFee = () => {
        setIsNativeFee(!isNativeFee);
    }
    const showManual = () => {
        setIsManual(!isManual);
    }
    const showPrev = () => {
        setIsNativeFee(false);
        setIsPreview(!isPreview);
    }
    return (
        <>
            {
                isPreview ?
                    <div className="flex flex-row md:flex-col md:w-full w-[100%]">
                        <div className="md:flex mr-5 md:mr-0 md:flex-col w-[100%]">
                            <div className="flex flex-row md:flex-col sm:flex-row justify-between mb-1 sm:mb-0">
                                <span className="mr-2 text-sm line leading-0 sm:text-xs">Addresses with Amounts</span>
                                <div className="underline cursor-pointer pl-1 text-gray-400 hover:text-gray-900 text-sm" onClick={() => (setIsManual(!isManual))}> {isManual ? "Upload file" : "Insert manually"}</div>
                            </div>
                            <div>
                                {
                                    isManual ? <EditorManual /> : <EditorFile showManual={showManual} />
                                }
                                <button className="bg-blue-500 sm:w-full text-white font-bold px-3 py-1 sm:mt-2 sm:mb-2 rounded-md" onClick={(e) => { e.preventDefault(); showNext() }}>Next</button>
                            </div>
                        </div>
                        {props.token.isNative ? <></> :
                            <div className="w-[380px] sm:w-auto">
                                <div className="flex-row">
                                    <div className="flex-col">
                                      
                                        <ToogleFee tokenName={props.token.name} isNativeFee={isNativeFee} setIsNativeFee={toogleNativeFee} />
                                    </div>
                                    <DepositWithdraw isNativeFee={isNativeFee}  token={props.token} />
                                </div>
                            </div>

                        }
                    </div> :
                    <PreviewResult isNativeFee={isNativeFee} token={props.token} isNative={props.isNative} showPrev={showPrev} />
            }
        </>
    )
}
export default EditorAddresses;