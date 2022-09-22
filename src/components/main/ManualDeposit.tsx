import { useCodeMirror } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { Web3State } from '../../Web3DataContext';
import ExampleManual from './ExampleManual';
function ManualDeposit(props: any){
    const {
        addressesFromFile,
        setAddressesFromFile
     } = Web3State();

    const [isValid, setIsValid] = useState<boolean>(true);
    const [showExampleManual, setShowExampleManual] = useState<boolean>(false);
    const [arrayOfAddrAmounts, setArrayOfAddrAmounts] = useState<object[]>([]);
    const [element, setElement] = useState<string>();
    const onChange = useCallback((value: any, viewUpdate: any) => {
        localStorage.setItem("filteredLang", value);
        setElement(value);

    }, []);
    const getListFromFile = () =>{
        let newArr = [];
        let newElems = "";
        if(addressesFromFile.length > 0){
            for (let index = 0; index < addressesFromFile.length; index++) {
                if (index === addressesFromFile.length - 1) {
                    newElems += addressesFromFile[index][0] + "," + addressesFromFile[index][1];
                }
                else {
                    newElems += addressesFromFile[index][0] + "," + addressesFromFile[index][1] + "\n";
                }
                const newElement = {
                    address: addressesFromFile[index][0],
                    amount: addressesFromFile[index][1],
                    errorAddress: !ethers.utils.isAddress(addressesFromFile[index][0]) ? "is not valid" : "",
                    errorAmount: isNaN(addressesFromFile[index][1]) === true ? "is not valid" : "",
                    row: index + 1
                }
                newArr.push(newElement);
            }
            localStorage.setItem("filteredLang", newElems);
            setArrayOfAddrAmounts(newArr);
            setElement(newElems);
            setAddressesFromFile([]);
        }
        
        // deleteInvalidLines();
    }
    const editor = useRef() as React.MutableRefObject<HTMLInputElement>;
    const { setContainer, view, state } = useCodeMirror({
        container: editor.current,
        extensions: [javascript({ jsx: true })],
        value: element,
        height: "200px",
        placeholder: "Enter your deposit address and amount",
        onChange: onChange,
    });
    const deleteInvalidLines = () => {
        let newElems = "";

        const newArray = arrayOfAddrAmounts.filter((element: any, index: number) => {
            if (element.errorAddress === "" && element.errorAmount === "") {
                return element
            }
        })
        newArray.forEach((element: any, index: number) => {
            if (index === newArray.length - 1) {
                newElems += element.address + "," + element.amount;
            }
            else {
                newElems += element.address + "," + element.amount + "\n";
            }
        })
        setElement(newElems)
    }
    const showExample = ()=>{
        console.log("showExample")
        setShowExampleManual(false);
    }
    const validateinputs = async () => {
        const arrayOfElements = element!.split("\n");
        const arrayOfElementsWithoutEmpty: { address: string; amount: number; errorAddress: string; errorAmount: string; }[] = [];
        arrayOfElements.forEach(async (element: any, index: number) => {
            const newElement = {
                address: element.split(",")[0],
                amount: element.split(",")[1],
                errorAddress: !ethers.utils.isAddress(element.split(",")[0]) ? "is not valid" : "",
                errorAmount: isNaN(element.split(",")[1]) === true ? "is not valid" : "",
                row: index + 1
            }
            arrayOfElementsWithoutEmpty.push(newElement);
        })
        let flag = true;
        for (let i = 0; i < arrayOfElementsWithoutEmpty.length; i++) {
            if (arrayOfElementsWithoutEmpty[i].errorAddress !== "" || arrayOfElementsWithoutEmpty[i].errorAmount !== "") {
                flag = false;
                break;
            }
            else {
                flag = true;
            }
        }
        setIsValid(flag)
        setArrayOfAddrAmounts(arrayOfElementsWithoutEmpty);
    }
    useEffect(() => {
        getListFromFile();
        localStorage.getItem("filteredLang") !== "" ? setElement(localStorage.getItem("filteredLang") || "") : setElement("");
        if (editor.current) {
            setContainer(editor.current);
            localStorage.getItem("filteredLang") !== null ? setElement(localStorage.getItem("filteredLang") || "") : setElement("");
        }
        if (element !== "" && element !== undefined) {
            validateinputs()
        }
    }, [element, addressesFromFile,showExampleManual])
    return (
        <div className="px-5 py-5">
            <div className="flex justify-between items-center mb-2">
                <h3>Addresses with Amounts</h3> <span onClick={() => { props.switchDepoist(false) }} className="underline  cursor-pointer">Upload file</span>
            </div>
            <div>
                <div id="listAddress" className="flex flex-row bg-white overflow-auto ">
                    <div className='w-full' ref={editor}></div>
                </div>
            </div>
            <div className="mt-2 flex flex-row justify-between"><span>Separated by comma</span>
                <button className="underline cursor-pointer" onClick={showExample}>Show examples</button>
                <ExampleManual hidden={showExampleManual}/>
            </div>
            <div className={ isValid === true ? "hidden" : ""}>
                <div className="flex flex-row justify-between">
                    <span className="text-red-500">The below addresses cannot be processed</span>
                    <button onClick={deleteInvalidLines} className="underline text-red-500">Delete them</button>
                </div>
                <div className="border-2 px-3 py-3 border-red-500 w-full min-h-[50px] bg-white rounded-md">
                    {
                        arrayOfAddrAmounts?.map((element: any, index: number) => {
                            return (
                                (element.errorAddress !== "" || element.errorAmount !== "") ? <div className="text-red-500" key={index}>
                                    Line {element.row} address or amount is not valid
                                </div> : ""
                            )
                        })
                    }
                </div>

            </div>
            <button onClick={() => {
                validateinputs().then(() => {
                    if (isValid) {
                        console.log(isValid)
                        props.changeModalContent(isValid, arrayOfAddrAmounts);
                    }

                })
            }} className="text-white font-bold py-2 px-4 rounded-full bg-slate-500">Next</button>
        </div>
    );
}
export default ManualDeposit;