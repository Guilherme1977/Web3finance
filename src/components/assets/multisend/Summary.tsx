import { Contract, ethers, Wallet } from "ethers";
import { useCallback, useEffect, useState } from "react";
import MultiSendError from "./MultiSendError";
import {
    addressesToSend,
    calculateTotalAmountTokens,
    removeSendedAddress,
    selectedSpeed,
    
} from "../../../store/multiDeposit/multiDepositSlice";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { currentNetwork } from "../../../store/network/networkSlice";
import { useAccount, useProvider, useNetwork } from "wagmi";
import { fetchSigner, signTypedData } from '@wagmi/core';
import contractsAddresses from "./../../../contracts/AddressesContracts.json";
import FeeShareAbi from "./../../../contracts/FeeShare.json";
import RTokenAbi from "./../../../contracts/RTokenAbi.json";
import MinimalForwarderAbi from "./../../../contracts/MinimalForwarderAbi.json";
import { toast } from "react-toastify";
import { fetchUserBalanceSingleToken } from "../../../store/token/tokenSlice";

interface TxInformation {
    method: any;
    token: any;
    addressesToSend: any[];
    finalAmount: any[];
    txInfo: {
        value: any;
    };
    isApproved: boolean;
}
export function Summary(props: any) {
    const dispatch = useAppDispatch();
    const networkSpeed = useAppSelector(selectedSpeed)
    const provider = useProvider();
    const network = useAppSelector(currentNetwork);
    const { chain } = useNetwork();
    const { address, isConnected } = useAccount();
    //Preloader
    const [loading, setLoading] = useState(true);
    //Balance Native currency
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [txFee, setTxFee] = useState("0");
    const [gasPrice, setGasPrice] = useState("0");
    const [totalFee, setTotalFee] = useState("0");
    //Totak ammount of tokens to send 
    const [ammount, setAmmount] = useState("0");
    //Transaction information
    const [txToSend, setTxToSend] = useState<TxInformation>();
    const [totalAddressesPerTx, setTotalAddressesPerTx] = useState(0);
    //Signed transaction
    const [signedTxToSend, setSignedTxToSend] = useState<any>();
    //Array of addresses and amounts to send
    const addressesAndAmounts = useAppSelector(addressesToSend);
    const totalAmmountTokensToSend = useAppSelector(calculateTotalAmountTokens);
    //Errors
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [isCalculated, setIsCalculated] = useState(false);
    const returnAddressesAndAmounts = (isNative) => {
        let addressesArray = [];
        let amountsArray = [];
        if (isNative) {
            if (addressesAndAmounts.length > 254) {
                addressesArray = addressesAndAmounts.slice(0, 254).map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.slice(0, 254).map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
            else {
                addressesArray = addressesAndAmounts.map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
        }
        else {
            if (addressesAndAmounts.length > 255) {
                addressesArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
            else {
                addressesArray = addressesAndAmounts.map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
        }
        return { addressesArray, amountsArray }
    }
    const calculateNative = async () => {
        setIsCalculated(false)
        setError(false);
        setErrorMessage('');
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const feePerAddressNative = await feeShare["calculateFee()"]();
        addressesAndAmounts.length === 0 ? setTotalTransactions(0) : setTotalTransactions(addressesAndAmounts.length / 254 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 254));
        if (addressesAndAmounts.length === 0) {
            setError(true);
            setErrorMessage("You need to add at least one address and amount to send");
            setLoading(false);
            setIsCalculated(true);
        }
        const { addressesArray, amountsArray } = returnAddressesAndAmounts(props.token.isNative);
        setTotalAddressesPerTx(addressesArray.length + 1);
        const totalTokensToSend = addressesArray.length;
        //in for loop total amount of tokens to send

        const finalAmount = amountsArray.map((item: any) => {
            return ethers.utils.parseEther(item);
        });
        const total = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
        finalAmount.unshift(total);
        addressesArray.unshift(contractsAddresses[network.name][0].FeeShare);
        const msgValue = feePerAddressNative.mul(totalTokensToSend).add(total);

        const txInfo = {
            value: msgValue,
            "maxPriorityFeePerGas": ethers.utils.parseUnits(networkSpeed.maxPriorityFeePerGas.toFixed(1), "gwei"),
            "maxFeePerGas": ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), "gwei")
        }

        const txInform = {
            method: "multiSend(address[],uint256[])",
            token: props.token.address,
            addressesToSend: addressesArray,
            finalAmount,
            txInfo,
            isApproved: true
        }
        try {
            if (addressesAndAmounts.length === 0) {
                setGasPrice("0");
                setTxFee("0");
                setTotalFee("0");
                setTxToSend(txInform);
                setAmmount("0");
                setLoading(false);
                setIsCalculated(true);
            }
            else {
                const unitsUsed = await feeShare.estimateGas["multiSend(address[],uint256[])"](addressesArray, finalAmount, txInfo);

                setGasPrice(unitsUsed.mul(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), "gwei")).toString());
                setTxFee(ethers.utils.formatUnits(feePerAddressNative.mul(totalTokensToSend)))
                setTotalFee(ethers.utils.formatUnits(feePerAddressNative.mul(totalTokensToSend).add(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), "gwei").mul(unitsUsed))));
                setTxToSend(txInform);
                setAmmount(ethers.utils.formatUnits(total, 18));
                setLoading(false);
                setIsCalculated(true);
            }

        }
        catch {
            setError(true);
            setErrorMessage(`You don't have enough balance to pay fee. Your token balance is ${!props.isNativeFee ? parseFloat(props.token.userBalance).toFixed(4) + props.token.name : parseFloat(props.token.userBalanceDeposit).toFixed(4) + props.token.name}`)
            setLoading(false);
            setIsCalculated(true);
        }
    }

   

    const calculateNativePolygon = useCallback(async () => {
        setIsCalculated(false)
        setError(false);
        setErrorMessage('');
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const feePerAddressNative = await feeShare["calculateFee()"]();
        addressesAndAmounts.length === 0 ? setTotalTransactions(0) : setTotalTransactions(addressesAndAmounts.length / 254 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 254));
        if (addressesAndAmounts.length === 0) {
            setGasPrice("0");
            setTxFee("0");
            setTotalFee("0");
            setAmmount("0");
            setLoading(false);
            setIsCalculated(true);
            setError(true);
            setErrorMessage("You need to add at least one address to send tokens");
        }
        const { addressesArray, amountsArray } = returnAddressesAndAmounts(props.token.isNative);
        setTotalAddressesPerTx(addressesArray.length);
        const totalTokensToSend = addressesArray.length;
        //in for loop total amount of tokens to send

        const finalAmount = amountsArray.map((item: any) => {
            return ethers.utils.parseEther(item);
        });
        const total = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
        finalAmount.unshift(total);
        addressesArray.unshift(contractsAddresses[network.name][0].FeeShare);
        const msgValue = feePerAddressNative.mul(totalTokensToSend).add(total);

        const maxFeePerGas = ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei');
        const maxPriorityFeePerGas = ethers.utils.parseUnits(networkSpeed.maxPriorityFeePerGas.toFixed(1), 'gwei');
        const txInfo = {
            value: msgValue,
            maxPriorityFeePerGas,
            maxFeePerGas
        }

        const txInform = {
            method: "multiSend(address[],uint256[])",
            token: props.token.address,
            addressesToSend: addressesArray,
            finalAmount,
            txInfo,
            isApproved: true
        }
        try {
            const unitsUsed = await feeShare.estimateGas["multiSend(address[],uint256[])"](addressesArray, finalAmount, {value:msgValue});
            setGasPrice(unitsUsed.mul(maxFeePerGas).toString());
            setTxFee(ethers.utils.formatUnits(feePerAddressNative.mul(totalTokensToSend)))
            setTotalFee(ethers.utils.formatUnits(feePerAddressNative.mul(totalTokensToSend).add(maxFeePerGas.mul(unitsUsed))));
            setTxToSend(txInform);
            setAmmount(ethers.utils.formatUnits(total, props.token.decimals));
            setLoading(false);
            setIsCalculated(true);

        }
        catch {
            setError(true);
            setErrorMessage(`You don't have enough balance to pay fee. Your token balance is ${!props.isNativeFee ? parseFloat(props.token.userBalance).toFixed(4) + props.token.name : parseFloat(props.token.userBalanceDeposit).toFixed(4) + props.token.name}`)
            setLoading(false);
            setIsCalculated(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.token.isNative, props.token.address, networkSpeed, props.contractsAddresses, props.addressesAndAmounts]);

    // rest of component code
    const calculateNativeBSC = async () => {
        setIsCalculated(false)
        setError(false);
        setErrorMessage('');
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const feePerAddressNative = await feeShare["calculateFee()"]();
        if (addressesAndAmounts.length === 0) {
            setTotalTransactions(0)
        }
        else {
            setTotalTransactions(addressesAndAmounts.length / 254 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 254));
        }
        const { addressesArray, amountsArray } = returnAddressesAndAmounts(props.token.isNative);
        setTotalAddressesPerTx(addressesArray.length + 1);
        const totalTokensToSend = addressesArray.length;
        // for(let i = 0; i < amountsArray.length; i++){
        //     totalAmmountTokens += parseFloat((amountsArray[i] * 100000).toString());
        // }
        // const totalAmmountTokens = amountsArray.reduce((acc: any, b: any) => (parseFloat(acc) + parseFloat(b)), 0);
        const finalAmount = amountsArray.map((item: any) => {
            return ethers.utils.parseUnits(item.toString(), props.token.decimals);
        });
        const totalAmmountTokens = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
        finalAmount.unshift(totalAmmountTokens);
        addressesArray.unshift(contractsAddresses[network.name][0].FeeShare);
        const msgValue = feePerAddressNative.mul(totalTokensToSend).add(totalAmmountTokens);
        const gasPrice = await provider.getGasPrice();
        const txInfo = {
            value: msgValue,
            gasPrice
        }

        const txInform = {
            method: "multiSend(address[],uint256[])",
            token: props.token.address,
            addressesToSend: addressesArray,
            finalAmount,
            txInfo,
            isApproved: true
        }
        try {
            if (addressesAndAmounts.length === 0) {
                setGasPrice("0");
                setTxFee("0");
                setTotalFee("0");
                setTxToSend(txInform);
                setAmmount("0");
                setLoading(false);
                setIsCalculated(true);
            }
            else {
                const unitsUsed = await feeShare.estimateGas["multiSend(address[],uint256[])"](addressesArray, finalAmount, txInfo);
                setGasPrice(unitsUsed.mul(gasPrice).toString());
                setTxFee(ethers.utils.formatUnits(feePerAddressNative.mul(totalTokensToSend)))
                setTotalFee(ethers.utils.formatUnits(feePerAddressNative.mul(totalTokensToSend).add(gasPrice.mul(unitsUsed))));
                setTxToSend(txInform);
                setAmmount(ethers.utils.formatUnits(totalAmmountTokens, props.token.decimals));
                setLoading(false);
                setIsCalculated(true);
            }

        }
        catch {
            setError(true);
            setErrorMessage(`You don't have enough balance to pay fee.Your token balance is ${!props.isNativeFee ? parseFloat(props.token.userBalance).toFixed(4) + props.token.name : parseFloat(props.token.userBalanceDeposit).toFixed(4) + props.token.name}`)
            setLoading(false);
            setIsCalculated(true);
        }
    }
    const calculateNativeOptimism = async () => {
        setIsCalculated(false)
        setError(false);
        setErrorMessage('');
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const feePerAddressNative = await feeShare["calculateFee()"]();
        setTotalTransactions(addressesAndAmounts.length / 254 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 254));
        const { addressesArray, amountsArray } = returnAddressesAndAmounts(props.token.isNative);
        setTotalAddressesPerTx(addressesArray.length + 1);
        const totalTokensToSend = addressesArray.length;
        const finalAmount = amountsArray.map((item: any) => {
            return ethers.utils.parseUnits(item.toString(), props.token.decimals);
        });
        const totalAmmountTokens = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
        finalAmount.unshift(totalAmmountTokens.toString());
        addressesArray.unshift(contractsAddresses[network.name][0].FeeShare);
        const msgValue = feePerAddressNative.mul(totalTokensToSend).add(totalAmmountTokens);
        const gasPrice = await provider.getGasPrice();
        const txInfo = {
            value: msgValue,
            gasPrice: gasPrice
        }
        const txInform = {
            method: "multiSend(address[],uint256[])",
            token: props.token.address,
            addressesToSend: addressesArray,
            finalAmount,
            txInfo,
            isApproved: true
        }
        try {
            if (addressesAndAmounts.length === 0) {
                setGasPrice("0");
                setTxFee("0");
                setTotalFee("0");
                setTxToSend(txInform);
                setAmmount("0");
                setLoading(false);
                setIsCalculated(true);
            }
            else {
                const unitsUsed = await feeShare.estimateGas["multiSend(address[],uint256[])"](addressesArray, finalAmount, txInfo);

                setGasPrice(unitsUsed.mul(gasPrice).toString());
                setTxFee(ethers.utils.formatUnits(feePerAddressNative.mul(totalTokensToSend)))
                setTotalFee(ethers.utils.formatUnits(feePerAddressNative.mul(totalTokensToSend).add(gasPrice.mul(unitsUsed))));
                setTxToSend(txInform);
                setAmmount(ethers.utils.formatUnits(totalAmmountTokens, props.token.decimals));
                setLoading(false);
                setIsCalculated(true);
            }

        }
        catch {
            setError(true);
            setErrorMessage(`You don't have enough balance to pay fee.Your token balance is ${!props.isNativeFee ? parseFloat(props.token.userBalance).toFixed(4) + props.token.name : parseFloat(props.token.userBalanceDeposit).toFixed(4) + props.token.name}`)
            setLoading(false);
            setIsCalculated(true);
        }
    }
    const sendNativeTx = async () => {
        //openAi version
        const idToastNative = toast.loading("Sending transaction please wait...", { position: toast.POSITION.TOP_CENTER, autoClose: 10000 });
        try {
            const signer = await fetchSigner()
            const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
            const tx = await feeShare[txToSend.method](txToSend.addressesToSend, txToSend.finalAmount, txToSend.txInfo);
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                toast.update(idToastNative, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
                dispatch(removeSendedAddress(txToSend.addressesToSend.length));
                setIsCalculated(true);
                await dispatch(fetchUserBalanceSingleToken({ address: address, roken: props.token, networkName: network.name, provider }))
                if (network.id === 137) {
                    calculateNativePolygon();
                }
                else if (network.id === 10) {
                    calculateNativeOptimism();
                }
                else if (network.id === 56) {
                    calculateNativeBSC();
                }
                else {
                    calculateNative();
                }
            }
            else {
                toast.update(idToastNative, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
            }
        } catch (err) {
            toast.update(idToastNative, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
        }

    }
    const calculateTokenAndPayNative = async () => {
        setIsCalculated(false);
        setLoading(false);
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const feePerAddressNative = await feeShare["calculateFee()"]();
        const { addressesArray, amountsArray } = returnAddressesAndAmounts(props.token.isNative);
        if (addressesAndAmounts.length === 0) {

            setGasPrice("0");
            setTxFee("0");
            setTotalFee("0");
            setTotalTransactions(0);
            setAmmount("0");
            setLoading(false);
            setIsCalculated(true);
        }
        else {

            setTotalAddressesPerTx(addressesArray.length);

            const msgValue = feePerAddressNative.mul(addressesArray.length);
            const txInfo = {
                value: msgValue,
                "maxPriorityFeePerGas": ethers.utils.parseUnits(networkSpeed.maxPriorityFeePerGas.toFixed(1), 'gwei'),
                "maxFeePerGas": ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei')
            }
            const finalAmount = amountsArray.map((item: any) => {
                return ethers.utils.parseUnits(item, props.token.decimals);
            });
            const ammountT = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
            setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals));
            const tokenContract = new Contract(props.token.address, RTokenAbi, signer);
            const isApproved = await tokenContract.allowance(address, contractsAddresses[network.name][0].FeeShare);
            if (ethers.utils.formatUnits(ammountT, props.token.decimals) > props.token.userBalance) {
                setError(true);
                setErrorMessage(`You don't have enough balance to pay fee. Your token balance is  ${!props.isNativeFee ? parseFloat(props.token.userBalance).toFixed(4) + props.token.name : parseFloat(props.token.userBalanceDeposit).toFixed(4) + props.token.name}`)
                setLoading(false);
                setIsCalculated(true);
            }
            if (+ethers.utils.formatUnits(isApproved, props.token.decimals) >= +ethers.utils.formatUnits(ammountT, props.token.decimals)) {
                const txInform = {
                    method: "multiSend(address,address[],uint256[])",
                    token: props.token.address,
                    addressesToSend: addressesArray,
                    finalAmount,
                    txInfo,
                    isApproved: true
                }
                if (addressesAndAmounts.length === 0) {
                    setGasPrice("0");
                    setTxFee("0");
                    setTotalFee("0");
                    setTxToSend(txInform);
                    setAmmount("0");
                    setLoading(false);
                    setIsCalculated(true);
                }
                else {
                    try {
                        const unitsUsed = await feeShare.estimateGas["multiSend(address,address[],uint256[])"](props.token.address, addressesArray, finalAmount, txInfo);
                        setTxToSend(txInform);
                        setGasPrice(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei').mul(unitsUsed).toString());
                        setTxFee(ethers.utils.formatUnits(feePerAddressNative.mul(addressesArray.length)))
                        setTotalFee(ethers.utils.formatEther(feePerAddressNative.mul(addressesArray.length).add(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei').mul(unitsUsed))));
                        setIsCalculated(true);
                        setLoading(false);
                    }
                    catch (err) {
                        setError(true);
                        setErrorMessage("Error calculating gas fee. Please try again later");
                        setLoading(false);
                        setIsCalculated(true);
                    }

                }
                if (addressesAndAmounts.length === 0) {
                    setTotalTransactions(0)
                }
                else {
                    setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 255));
                }
            }
            else {
                try {
                    const txInform = {
                        method: "multiSend(address,address[],uint256[])",
                        token: props.token.address,
                        addressesToSend: addressesArray,
                        finalAmount,
                        txInfo,
                        isApproved: false
                    }
                    const dataToApprove = addressesAndAmounts.map((item: any) => {
                        return ethers.utils.parseUnits(item.amount.trim(), props.token.decimals);
                    }).reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
                    const unitsUsed = await tokenContract.estimateGas.approve(contractsAddresses[network.name][0].FeeShare, dataToApprove);

                    setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals));
                    setGasPrice(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei').mul(unitsUsed).toString());
                    setTotalFee(ethers.utils.formatUnits(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei').mul(unitsUsed)));
                    setTxToSend(txInform);
                    setLoading(false);
                    setIsCalculated(true);
                    if (addressesAndAmounts.length === 0) {
                        setTotalTransactions(0)
                    }
                    else {
                        setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 2 : Math.ceil(addressesAndAmounts.length / 255) + 1);
                    }
                }
                catch (err) {
                    setError(true);
                    setErrorMessage("Not enough allowance. Please try again later");
                    setLoading(false);
                    setIsCalculated(true);
                }

            }
            setLoading(false);
        }

    }
    const calculateTokenAndPayNativePolygon = async () => {
        setIsCalculated(false);
        setLoading(false);
        setErrorMessage("");
        setError(false);
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const feePerAddressNative = await feeShare["calculateFee()"]();
        let addressesArray = [];
        let amountsArray = [];
        if (addressesAndAmounts.length === 0) {
            addressesArray = [];
            amountsArray = [];
            setGasPrice("0");
            setTxFee("0");
            setTotalFee("0");
            setTotalTransactions(0);
            setAmmount("0");
            setLoading(false);
            setIsCalculated(true);
            setError(true);
        }
        else {
            if (addressesAndAmounts.length > 255) {
                addressesArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
            else {
                addressesArray = addressesAndAmounts.map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
            setTotalAddressesPerTx(addressesArray.length);

            const msgValue = feePerAddressNative.mul(amountsArray.length);
            const txInfo = {
                value: msgValue,
                "maxPriorityFeePerGas": ethers.utils.parseUnits(networkSpeed.maxPriorityFeePerGas.toFixed(1), 'gwei'),
            }
            const finalAmount = amountsArray.map((item: any) => {
                return ethers.utils.parseUnits(item, props.token.decimals);
            });
            const ammountT = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
            setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals));
            const tokenContract = new Contract(props.token.address, RTokenAbi, signer);
            const isApproved = await tokenContract.allowance(address, contractsAddresses[network.name][0].FeeShare);
            if (ethers.utils.formatUnits(ammountT, props.token.decimals) > props.token.userBalance) {
                setError(true);
                setErrorMessage(`You don't have enough balance to pay fee. Your token balance is  ${!props.isNativeFee ? parseFloat(props.token.userBalance).toFixed(4) + props.token.name : parseFloat(props.token.userBalanceDeposit).toFixed(4) + props.token.name}`)
                setLoading(false);
                setIsCalculated(true);
            }
            if (+ethers.utils.formatUnits(isApproved, props.token.decimals) >= +ethers.utils.formatUnits(ammountT, props.token.decimals)) {
                const txInform = {
                    method: "multiSend(address,address[],uint256[])",
                    token: props.token.address,
                    addressesToSend: addressesArray,
                    finalAmount,
                    txInfo,
                    isApproved: true
                }
                if (addressesAndAmounts.length === 0) {
                    setGasPrice("0");
                    setTxFee("0");
                    setTotalFee("0");
                    setTxToSend(txInform);
                    setAmmount("0");
                    setLoading(false);
                    setIsCalculated(true);
                }
                else {
                    try {
                        const unitsUsed = await feeShare.estimateGas["multiSend(address,address[],uint256[])"](props.token.address, addressesArray, finalAmount);
                        setTxToSend(txInform);
                        setGasPrice(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei').mul(unitsUsed).toString());
                        setTxFee(ethers.utils.formatUnits(feePerAddressNative.mul(addressesArray.length)))
                        setTotalFee(ethers.utils.formatEther(feePerAddressNative.mul(addressesArray.length).add(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei').mul(unitsUsed))));
                        setIsCalculated(true);
                        setLoading(false);
                    }
                    catch (err) {
                        setError(true);
                        setErrorMessage("Error calculating gas fee. Please try again later");
                        setLoading(false);
                        setIsCalculated(true);
                    }

                }
                if (addressesAndAmounts.length === 0) {
                    setTotalTransactions(0)
                }
                else {
                    setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 255));
                }
            }
            else {
                try {
                    const txInform = {
                        method: "multiSend(address,address[],uint256[])",
                        token: props.token.address,
                        addressesToSend: addressesArray,
                        finalAmount,
                        txInfo,
                        isApproved: false
                    }
                    const dataToApprove = addressesAndAmounts.map((item: any) => {
                        return ethers.utils.parseUnits(item.amount.trim(), props.token.decimals);
                    }).reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
                    const unitsUsed = await tokenContract.estimateGas.approve(contractsAddresses[network.name][0].FeeShare, dataToApprove);

                    setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals));
                    setGasPrice(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei').mul(unitsUsed).toString());
                    setTotalFee(ethers.utils.formatUnits(ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei').mul(unitsUsed)));
                    setTxToSend(txInform);
                    setLoading(false);
                    setIsCalculated(true);
                    if (addressesAndAmounts.length === 0) {
                        setTotalTransactions(0)
                    }
                    else {
                        setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 2 : Math.ceil(addressesAndAmounts.length / 255) + 1);
                    }
                }
                catch (err) {
                    setError(true);
                    setError(true);
                    setErrorMessage("Error calculating gas fee. Please try again later");
                    setLoading(false);
                    setIsCalculated(true);
                }

            }
            setLoading(false);
        }

    }
    const calculateTokenAndPayNativeBSC = async () => {
        setIsCalculated(false);
        setLoading(false);
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const feePerAddressNative = await feeShare["calculateFee()"]();
        let addressesArray = [];
        let amountsArray = [];
        if (addressesAndAmounts.length === 0) {
            addressesArray = [];
            amountsArray = [];
            setGasPrice("0");
            setTxFee("0");
            setTotalFee("0");
            setTotalTransactions(0);
            setAmmount("0");
            setLoading(false);
            setIsCalculated(true);
        }
        else {
            if (addressesAndAmounts.length > 255) {
                addressesArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
            else {
                addressesArray = addressesAndAmounts.map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
            setTotalAddressesPerTx(addressesArray.length);
            const finalAmount = amountsArray.map((item: any) => {
                return ethers.utils.parseUnits(item, props.token.decimals);
            });
            const ammountT = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
            setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals));
            const tokenContract = new Contract(props.token.address, RTokenAbi, signer);
            const isApproved = await tokenContract.allowance(address, contractsAddresses[network.name][0].FeeShare);
            const msgValue = feePerAddressNative.mul(addressesAndAmounts.length);
            const gasPrice = await signer.provider.getGasPrice();
            // setMaxFeePerGas(gasPrice.maxFeePerGas.sub(gasPrice.maxPriorityFeePerGas).add(networkSpeed.maxPriorityFeePerGas))
            // const feePerGas = gasPrice.maxFeePerGas.sub(gasPrice.maxPriorityFeePerGas).add(networkSpeed.maxPriorityFeePerGas)
            const txInfo = {
                value: msgValue,
                gasPrice
            }
            if (ethers.utils.formatUnits(ammountT, props.token.decimals) > props.token.userBalance) {
                setError(true);
                setErrorMessage(`You don't have enough balance to pay fee. Your token balance is  ${!props.isNativeFee ? parseFloat(props.token.userBalance).toFixed(4) + props.token.name : parseFloat(props.token.userBalanceDeposit).toFixed(4) + props.token.name}`)
                setLoading(false);
                setIsCalculated(true);
            }
            if (ethers.utils.formatUnits(isApproved, props.token.decimals) >= ethers.utils.formatUnits(ammountT, props.token.decimals)) {
                const txInform = {
                    method: "multiSend(address,address[],uint256[])",
                    token: props.token.address,
                    addressesToSend: addressesArray,
                    finalAmount,
                    txInfo,
                    isApproved: true
                }
                if (addressesAndAmounts.length === 0) {
                    setGasPrice("0");
                    setTxFee("0");
                    setTotalFee("0");
                    setTxToSend(txInform);
                    setAmmount("0");
                    setLoading(false);
                    setIsCalculated(true);
                }
                else {
                    const unitsUsed = await feeShare.estimateGas["multiSend(address,address[],uint256[])"](props.token.address, addressesArray, finalAmount, txInfo);
                    setTxToSend(txInform);
                    setGasPrice(gasPrice.mul(unitsUsed).toString());
                    setTxFee(ethers.utils.formatUnits(feePerAddressNative.mul(addressesArray.length)))
                    setTotalFee(ethers.utils.formatEther(feePerAddressNative.mul(addressesArray.length).add(gasPrice.mul(unitsUsed))));
                    setIsCalculated(true);
                    setLoading(false);
                }
                if (addressesAndAmounts.length === 0) {
                    setTotalTransactions(0)
                }
                else {
                    setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 255));
                }
            }
            else {
                try {
                    const txInform = {
                        method: "multiSend(address,address[],uint256[])",
                        token: props.token.address,
                        addressesToSend: addressesArray,
                        finalAmount,
                        txInfo,
                        isApproved: false
                    }
                    const dataToApprove = addressesAndAmounts.map((item: any) => {
                        return ethers.utils.parseUnits(item.amount.trim(), props.token.decimals);
                    }).reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
                    const unitsUsed = await tokenContract.estimateGas.approve(contractsAddresses[network.name][0].FeeShare, dataToApprove);
                    setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals));
                    setGasPrice(gasPrice.mul(unitsUsed).toString());
                    setTotalFee(ethers.utils.formatUnits(gasPrice.mul(unitsUsed)));
                    setTxToSend(txInform);
                    setLoading(false);
                    setIsCalculated(true);
                    if (addressesAndAmounts.length === 0) {
                        setTotalTransactions(0)
                    }
                    else {
                        setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 2 : Math.ceil(addressesAndAmounts.length / 255) + 1);
                    }
                }
                catch (err) {
                    setGasPrice("0");
                    setTxFee("0");
                    setTotalFee("0");
                    setAmmount("0");
                    setLoading(false);
                    setIsCalculated(true);
                }

            }
            setLoading(false);
        }
    }
    const calculateTokenAndPayNativeOptimism = async () => {
        setIsCalculated(false);
        setLoading(false);
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const feePerAddressNative = await feeShare["calculateFee()"]();
        let addressesArray = [];
        let amountsArray = [];
        if (addressesAndAmounts.length === 0) {
            addressesArray = [];
            amountsArray = [];
            setGasPrice("0");
            setTxFee("0");
            setTotalFee("0");
            setTotalTransactions(0);
            setAmmount("0");
            setLoading(false);
            setIsCalculated(true);
        }
        else {
            if (addressesAndAmounts.length > 255) {
                addressesArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
            else {
                addressesArray = addressesAndAmounts.map((item: any) => {
                    return item.address;
                });
                amountsArray = addressesAndAmounts.map((item: any) => {
                    return item.amount.toString().trim();
                });
            }
            setTotalAddressesPerTx(addressesArray.length);
            const finalAmount = amountsArray.map((item: any) => {
                return ethers.utils.parseUnits(item, props.token.decimals);
            });
            const ammountT = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
            setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals));
            const tokenContract = new Contract(props.token.address, RTokenAbi, signer);
            const isApproved = await tokenContract.allowance(address, contractsAddresses[network.name][0].FeeShare);
            const msgValue = feePerAddressNative.mul(addressesAndAmounts.length);
            const gasPrice = await signer.provider.getGasPrice();
            // setMaxFeePerGas(gasPrice.maxFeePerGas.sub(gasPrice.maxPriorityFeePerGas).add(networkSpeed.maxPriorityFeePerGas))
            // const feePerGas = gasPrice.maxFeePerGas.sub(gasPrice.maxPriorityFeePerGas).add(networkSpeed.maxPriorityFeePerGas)
            const txInfo = {
                value: msgValue,
                gasPrice
            }
            if (ethers.utils.formatUnits(ammountT, props.token.decimals) > props.token.userBalance) {
                setError(true);
                setErrorMessage(`You don't have enough balance to pay fee. Your token balance is  ${!props.isNativeFee ? parseFloat(props.token.userBalance).toFixed(4) + props.token.name : parseFloat(props.token.userBalanceDeposit).toFixed(4) + props.token.name}`)
                setLoading(false);
                setIsCalculated(true);
            }
            if (ethers.utils.formatUnits(isApproved, props.token.decimals) >= ethers.utils.formatUnits(ammountT, props.token.decimals)) {
                const txInform = {
                    method: "multiSend(address,address[],uint256[])",
                    token: props.token.address,
                    addressesToSend: addressesArray,
                    finalAmount,
                    txInfo,
                    isApproved: true
                }
                if (addressesAndAmounts.length === 0) {
                    setGasPrice("0");
                    setTxFee("0");
                    setTotalFee("0");
                    setTxToSend(txInform);
                    setAmmount("0");
                    setLoading(false);
                    setIsCalculated(true);
                }
                else {
                    const unitsUsed = await feeShare.estimateGas["multiSend(address,address[],uint256[])"](props.token.address, addressesArray, finalAmount, txInfo);
                    setTxToSend(txInform);
                    setGasPrice(gasPrice.mul(unitsUsed).toString());
                    setTxFee(ethers.utils.formatUnits(feePerAddressNative.mul(addressesArray.length)))
                    setTotalFee(ethers.utils.formatEther(feePerAddressNative.mul(addressesArray.length).add(gasPrice.mul(unitsUsed))));
                    setIsCalculated(true);
                    setLoading(false);
                }
                if (addressesAndAmounts.length === 0) {
                    setTotalTransactions(0)
                }
                else {
                    setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 255));
                }
            }
            else {
                try {
                    const txInform = {
                        method: "multiSend(address,address[],uint256[])",
                        token: props.token.address,
                        addressesToSend: addressesArray,
                        finalAmount,
                        txInfo,
                        isApproved: false
                    }
                    const dataToApprove = addressesAndAmounts.map((item: any) => {
                        return ethers.utils.parseUnits(item.amount.trim(), props.token.decimals);
                    }).reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
                    const unitsUsed = await tokenContract.estimateGas.approve(contractsAddresses[network.name][0].FeeShare, dataToApprove);

                    setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals));
                    setGasPrice(gasPrice.mul(unitsUsed).toString());
                    setTotalFee(ethers.utils.formatUnits(gasPrice.mul(unitsUsed)));
                    setTxToSend(txInform);
                    setLoading(false);
                    setIsCalculated(true);
                    if (addressesAndAmounts.length === 0) {
                        setTotalTransactions(0)
                    }
                    else {
                        setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 2 : Math.ceil(addressesAndAmounts.length / 255) + 1);
                    }
                }
                catch (err) {
                    setGasPrice("0");
                    setTxFee("0");
                    setTotalFee("0");
                    setAmmount("0");
                    setLoading(false);
                    setIsCalculated(true);
                }

            }
            setLoading(false);
        }
    }
    const sendTokenAndPayNative = async () => {

        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const tokenContract = new Contract(props.token.address, RTokenAbi, signer);
        const isApproved = await tokenContract.allowance(address, contractsAddresses[network.name][0].FeeShare);
        if (parseFloat(ethers.utils.formatUnits(isApproved, props.token.decimals)) >= parseFloat(ammount)) {
            const idToastSendTokenNativeFee = toast.loading("Sending transaction please wait...")
            feeShare[txToSend.method](props.token.address, txToSend.addressesToSend, txToSend.finalAmount, txToSend.txInfo).then((tx: any) => {
                tx.wait().then((receipt: any) => {
                    toast.update(idToastSendTokenNativeFee, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
                    if (isConnected && network.id === 56) {
                        calculateTokenAndPayNativeBSC();
                        dispatch(fetchUserBalanceSingleToken({ address, token: props.token, networkName: network.name, provider }))
                    }
                    else if (isConnected && network.id === 137) {
                        calculateTokenAndPayNativePolygon();
                        dispatch(fetchUserBalanceSingleToken({ address, token: props.token, networkName: network.name, provider }))
                    }
                    else {
                        dispatch(removeSendedAddress(txToSend.addressesToSend.length))
                        calculateTokenAndPayNative();
                    }
                    dispatch(removeSendedAddress(txToSend.addressesToSend.length))
                }).catch((err: any) => {
                    // console.log(err, "err")
                    toast.update(idToastSendTokenNativeFee, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
                })
            }).catch((err: any) => {
                // console.log(err, "err")
                toast.update(idToastSendTokenNativeFee, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
            });
        }
        else {
            const dataToApprove = addressesAndAmounts.map((item: any) => {
                return ethers.utils.parseUnits(item.amount.trim(), props.token.decimals);
            }).reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
            const tokenContract = new Contract(props.token.address, RTokenAbi, signer);
            const approveToast = toast.loading("Approving please wait...")
            if (network.id === 56) {
                // const gasPrice = await provider.getGasPrice();
                tokenContract.approve(contractsAddresses[network.name][0].FeeShare, dataToApprove).then((res: any) => {
                    res.wait().then(async (receipt: any) => {
                        toast.update(approveToast, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
                        setTxToSend({ ...txToSend, isApproved: true });
                        calculateTokenAndPayNativeBSC();
                        sendTokenAndPayNative();
                        dispatch(removeSendedAddress(txToSend.addressesToSend.length))
                    }).catch((err: any) => {
                        toast.update(approveToast, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
                    });
                }).catch((err: any) => {
                    toast.update(approveToast, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
                })
            }
            else if (network.id === 137) {
                tokenContract.approve(contractsAddresses[network.name][0].FeeShare, dataToApprove).then((res: any) => {
                    res.wait().then(async (receipt: any) => {
                        toast.update(approveToast, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
                        setTxToSend({ ...txToSend, isApproved: true });
                        calculateTokenAndPayNativePolygon();
                        sendTokenAndPayNative();
                        dispatch(removeSendedAddress(txToSend.addressesToSend.length))
                    }).catch((err: any) => {
                        toast.update(approveToast, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
                    });
                }).catch((err: any) => {
                    toast.update(approveToast, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
                })
            }
            else {
                tokenContract.approve(contractsAddresses[network.name][0].FeeShare, dataToApprove, { "maxFeePerGas": ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei'), "maxPriorityFeePerGas": ethers.utils.parseUnits(networkSpeed.maxPriorityFeePerGas.toFixed(1), 'gwei') }).then((res: any) => {
                    res.wait().then(async (receipt: any) => {
                        toast.update(approveToast, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
                        setTxToSend({ ...txToSend, isApproved: true });
                        await calculateTokenAndPayNative()
                        await sendTokenAndPayNative()

                    }).catch((err: any) => {
                        toast.update(approveToast, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
                    });
                }).catch((err: any) => {
                    toast.update(approveToast, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
                })
            }

        }
    }
    const sendTokenAndPayNativeOptimism = async () => {
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        const tokenContract = new Contract(props.token.address, RTokenAbi, signer);
        const isApproved = await tokenContract.allowance(address, contractsAddresses[network.name][0].FeeShare);

        if (parseFloat(ethers.utils.formatUnits(isApproved, props.token.decimals)) >= parseFloat(ammount)) {
            const idToastSendTokenNativeFee = toast.loading("Sending transaction please wait...")
            feeShare[txToSend.method](props.token.address, txToSend.addressesToSend, txToSend.finalAmount, txToSend.txInfo).then((tx: any) => {
                tx.wait().then(async (receipt: any) => {
                    toast.update(idToastSendTokenNativeFee, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
                    dispatch(removeSendedAddress(txToSend.addressesToSend.length))
                    await calculateTokenAndPayNativeOptimism();
                    await dispatch(fetchUserBalanceSingleToken({ address, token: props.token, networkName: network.name, provider }))
                }).catch((err: any) => {
                    // console.log(err, "err")
                    toast.update(idToastSendTokenNativeFee, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
                })
            }).catch((err: any) => {
                // console.log(err, "err")
                toast.update(idToastSendTokenNativeFee, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
            });
        }
        else {
            const tokenContract = new Contract(props.token.address, RTokenAbi, signer);
            const idToastSendTokenNativeFee = toast.loading("Sending transaction please wait...")
            tokenContract.approve(contractsAddresses[network.name][0].FeeShare, ethers.utils.parseUnits(ammount, props.token.decimals)).then((res: any) => {
                res.wait().then(async (receipt: any) => {
                    toast.update(idToastSendTokenNativeFee, { render: "Transaction succesfuly", autoClose: 2000, type: "success", isLoading: false, position: toast.POSITION.TOP_CENTER });
                    setTxToSend({ ...txToSend, isApproved: true });
                    await calculateTokenAndPayNativeOptimism()
                    await sendTokenAndPayNative()
                }).catch((err: any) => {
                    toast.update(idToastSendTokenNativeFee, { render: "Transaction rejected!", autoClose: 2000, type: "error", isLoading: false, position: toast.POSITION.TOP_CENTER });
                });
            });
        }
    }
    const calculateTokenAndPayToken = async () => {
        setIsCalculated(false);
        setError(false);
        setErrorMessage("");
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        //first 
        if (addressesAndAmounts.length === 0) {
            setTotalTransactions(0)
        }
        else {
            setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 255));
        }
        let addressesArray = [];
        let amountsArray = [];
        if (addressesAndAmounts.length === 0) {
            addressesArray = [];
            amountsArray = [];
        }
        else if (addressesAndAmounts.length > 255) {
            addressesArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                return item.address;
            });
            amountsArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                return item.amount.toString().trim();
            });
        }
        else {
            addressesArray = addressesAndAmounts.map((item: any) => {
                return item.address;
            });
            amountsArray = addressesAndAmounts.map((item: any) => {
                return item.amount.toString().trim();
            });
        }
        const finalAmount = amountsArray.map((item: any) => {
            return ethers.utils.parseUnits(item, props.token.decimals);
        });
        const ammountT = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
        setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals))

        const calculateFeeAsset = await feeShare["calculateFee(address)"](props.token.address);
        setTotalAddressesPerTx(addressesArray.length)
        try {
            const unitsUsed = await feeShare.estimateGas["multiSendFee(address,address[],uint256[],uint256)"](props.token.address, addressesArray, finalAmount, ethers.utils.parseUnits(networkSpeed.maxPriorityFeePerGas.toFixed(1), 'gwei').mul(3));
            const txFeeInToken = await feeShare["calculateTxfeeToken(address,uint256)"](props.token.address, ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(1), 'gwei').mul(3).mul(unitsUsed));
            setTotalFee(ethers.utils.formatUnits(txFeeInToken.add(calculateFeeAsset.mul(addressesArray.length)), props.token.decimals))
            const minimalForwarderContract = new Contract(contractsAddresses[network.name][0].MinimalForwarder, MinimalForwarderAbi, signer);
            const dataMessage = new ethers.utils.Interface(FeeShareAbi).encodeFunctionData("multiSendFee", [props.token.address, addressesArray, finalAmount, ethers.utils.parseUnits(networkSpeed.maxPriorityFeePerGas.toFixed(1), 'gwei').mul(3)]);
            if (+ethers.utils.formatUnits(ammountT) > +props.token.userBalanceDeposit) {
                setError(true);
                setErrorMessage("You don't have enough balance token to pay the fee")
                setIsCalculated(true);
            }
            const nonce = await minimalForwarderContract.getNonce(address);
            const values = {
                from: address,
                to: contractsAddresses[network.name][0].FeeShare,
                value: ethers.BigNumber.from("0"),
                nonce: nonce,
                data: dataMessage,
                gas: unitsUsed.mul(2),
            }

            const txInform = {
                method: "multiSendFee(address,address[],uint256[],uint256)",
                token: props.token.address,
                addressesToSend: addressesArray,
                finalAmount,
                txInfo: values,
                isApproved: true
            }
            setTxToSend(txInform);
            setSignedTxToSend(values);
            setLoading(false);
            setIsCalculated(true);
        }
        catch (err) {
            // console.log(err, "err")
            setError(true);
            setLoading(true);
            setErrorMessage("User deposit is less than amount needed to pay the fee")
            setIsCalculated(false);
        }
    }
    const calculateTokenAndPayTokenPolygon = async () => {
        setIsCalculated(false);
        setError(true);
        setErrorMessage("");
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        //first 
        if (addressesAndAmounts.length === 0) {
            setTotalTransactions(0)
        }
        else {
            setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 255));
        }
        const { addressesArray, amountsArray } = returnAddressesAndAmounts(props.token.isNative);
        const finalAmount = amountsArray.map((item: any) => {
            return ethers.utils.parseUnits(item, props.token.decimals);
        });
        const ammountT = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
        setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals))
        const calculateFeeAsset = await feeShare["calculateFee(address)"](props.token.address);
        setTotalAddressesPerTx(addressesArray.length)
        try {
            const unitsUsed = await feeShare.estimateGas["multiSendFee(address,address[],uint256[],uint256)"](props.token.address, addressesArray, finalAmount, ethers.utils.parseUnits(networkSpeed.maxPriorityFeePerGas.toFixed(2), 'gwei').mul(110).div(100));
            const txFeeInToken = await feeShare["calculateTxfeeToken(address,uint256)"](props.token.address, ethers.utils.parseUnits(networkSpeed.maxFeePerGas.toFixed(2), 'gwei').mul(unitsUsed));
            setTotalFee(ethers.utils.formatUnits(txFeeInToken.add(calculateFeeAsset.mul(addressesArray.length)), props.token.decimals))
            const minimalForwarderContract = new Contract(contractsAddresses[network.name][0].MinimalForwarder, MinimalForwarderAbi, signer);
            const dataMessage = new ethers.utils.Interface(FeeShareAbi).encodeFunctionData("multiSendFee", [props.token.address, addressesArray, finalAmount, ethers.utils.parseUnits(networkSpeed.maxPriorityFeePerGas.toFixed(2), 'gwei').mul(110).div(100)]);
            if (+ethers.utils.formatUnits(ammountT) > +props.token.userBalanceDeposit) {
                setError(true);
                setErrorMessage("You don't have enough balance tokens to pay the fee.")
                setIsCalculated(true);
                setLoading(false);
            }
            const nonce = await minimalForwarderContract.getNonce(address);
            const values = {
                from: address,
                to: contractsAddresses[network.name][0].FeeShare,
                value: ethers.BigNumber.from("0"),
                nonce: nonce,
                data: dataMessage,
                gas: unitsUsed.mul(2),
            }
            const txInform = {
                method: "multiSendFee(address,address[],uint256[],uint256)",
                token: props.token.address,
                addressesToSend: addressesArray,
                finalAmount,
                txInfo: values,
                isApproved: true
            }
            setTxToSend(txInform);
            setSignedTxToSend(values);
            setLoading(false);
            setError(false);
            setIsCalculated(true);
        }
        catch (err) {
            // console.log(err, "err")
            setError(true);
            setLoading(false);
            setErrorMessage("The amount deposited by the user is insufficient to cover the fee.")
            setIsCalculated(true);
        }
    }
    const calculateTokenAndPayTokenBsc = async () => {
        setIsCalculated(false);
        setError(false);
        const signer = await fetchSigner()
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        //first 
        addressesAndAmounts.length === 0 ? setTotalTransactions(0) : setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 255));
        let addressesArray = [];
        let amountsArray = [];
        if (addressesAndAmounts.length === 0) {
            addressesArray = [];
            amountsArray = [];
        }
        else if (addressesAndAmounts.length > 255) {
            addressesArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                return item.address;
            });
            amountsArray = addressesAndAmounts.slice(0, 255).map((item: any) => {
                return item.amount.toString().trim();
            });
        }
        else {
            addressesArray = addressesAndAmounts.map((item: any) => {
                return item.address;
            });
            amountsArray = addressesAndAmounts.map((item: any) => {
                return item.amount.toString().trim();
            });
        }
        const finalAmount = amountsArray.map((item: any) => {
            return ethers.utils.parseUnits(item);
        });
        const ammountT = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
        setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals))
        const calculateFeeAsset = await feeShare["calculateFee(address)"](props.token.address);
        setTotalAddressesPerTx(addressesArray.length)
        try {
            const unitsUsed = await feeShare.estimateGas["multiSendFee(address,address[],uint256[],uint256)"](props.token.address, addressesArray, finalAmount, 5);
            const gasPrice = await provider.getGasPrice();
            const txFeeInToken = await feeShare["calculateTxfeeToken(address,uint256)"](props.token.address, gasPrice.mul(unitsUsed));
            setTotalFee(ethers.utils.formatUnits(txFeeInToken.add(calculateFeeAsset.mul(addressesArray.length)), props.token.decimals))
            const minimalForwarderContract = new Contract(contractsAddresses[network.name][0].MinimalForwarder, MinimalForwarderAbi, signer);
            const dataMessage = new ethers.utils.Interface(FeeShareAbi).encodeFunctionData("multiSendFee", [props.token.address, addressesArray, finalAmount, 5]) as any;
            if (totalAmmountTokensToSend > props.token.userBalanceDeposit) {
                setError(true);
                setErrorMessage("You don't have enough balance tokens to pay the fee.")
                setIsCalculated(true);
            }
            const nonce = await minimalForwarderContract.getNonce(address);
            const values = {
                from: address,
                to: contractsAddresses[network.name][0].FeeShare,
                value: 0,
                nonce: nonce.toString(),
                data: dataMessage,
                gas: 210000,
            }

            const txInform = {
                method: "multiSendFee(address,address[],uint256[],uint256)",
                token: props.token.address,
                addressesToSend: addressesArray,
                finalAmount,
                txInfo: values,
                isApproved: true
            }
            setTxToSend(txInform);
            setSignedTxToSend(values);
            setLoading(false);
            setIsCalculated(true);
        }
        catch (err) {
            // console.log(err, "err")
            setError(true);
            setLoading(false);
            setErrorMessage("The amount deposited by the user is insufficient to cover the fee.")
            setIsCalculated(true);
        }
    }
    const calculateTokenAndPayTokenOptimism = async () => {
        setIsCalculated(false);
        setError(false);
        const signer = await fetchSigner()
        //get signer drom provider
        const feeShare = new Contract(contractsAddresses[network.name][0].FeeShare, FeeShareAbi, signer);
        //first 
        addressesAndAmounts.length === 0 ? setTotalTransactions(0) : setTotalTransactions(addressesAndAmounts.length / 255 === 0 ? 1 : Math.ceil(addressesAndAmounts.length / 255));
        const { addressesArray, amountsArray } = returnAddressesAndAmounts(props.token.isNative);
        const finalAmount = amountsArray.map((item: any) => {
            return ethers.utils.parseUnits(item);
        });
        const ammountT = finalAmount.reduce((acc: any, b: any) => (acc.add(b)), ethers.BigNumber.from(0));
        setAmmount(ethers.utils.formatUnits(ammountT, props.token.decimals))
        const calculateFeeAsset = await feeShare["calculateFee(address)"](props.token.address);
        setTotalAddressesPerTx(addressesArray.length)
        try {
            const unitsUsed = await feeShare.estimateGas["multiSendFee(address,address[],uint256[],uint256)"](props.token.address, addressesArray, finalAmount, 0);
            const gasPrice = await provider.getGasPrice();
            const txFeeInToken = await feeShare["calculateTxfeeToken(address,uint256)"](props.token.address, gasPrice.mul(unitsUsed));
            setTotalFee(ethers.utils.formatUnits(txFeeInToken.add(calculateFeeAsset.mul(addressesArray.length)), props.token.decimals))
            const minimalForwarderContract = new Contract(contractsAddresses[network.name][0].MinimalForwarder, MinimalForwarderAbi, signer);
            const dataMessage = new ethers.utils.Interface(FeeShareAbi).encodeFunctionData("multiSendFee", [props.token.address, addressesArray, finalAmount, 0]) as any;
            if (totalAmmountTokensToSend > props.token.userBalanceDeposit) {
                setError(true);
                setErrorMessage("You don't have enough balance tokens to pay the fee.")
                setIsCalculated(true);
            }
            const nonce = await minimalForwarderContract.getNonce(address);
            const values = {
                from: address,
                to: contractsAddresses[network.name][0].FeeShare,
                value: ethers.BigNumber.from(0),
                nonce: ethers.BigNumber.from(nonce),
                data: dataMessage,
                gas: 210000,
            }

            const txInform = {
                method: "multiSendFee(address,address[],uint256[],uint256)",
                token: props.token.address,
                addressesToSend: addressesArray,
                finalAmount,
                txInfo: values,
                isApproved: true
            }
            setTxToSend(txInform);
            setSignedTxToSend(values);
            setLoading(false);
            setIsCalculated(true);
        }
        catch (err) {
            // console.log(err, "err")
            setError(true);
            setLoading(false);
            setErrorMessage("The amount deposited by the user is insufficient to cover the fee.")
            setIsCalculated(true);
        }
    }
    const signMetaTx = async (req: any) => {
        const signature = await signTypedData({
            domain: {
                chainId: chain.id,
                name: 'FeeShare',
                verifyingContract: contractsAddresses[network.name][0].MinimalForwarder,
                version: '1.0.0',
            },
            types: {
                // Refer to PrimaryType
                ForwardRequest: [
                    { name: 'from', type: 'address' },
                    { name: 'to', type: 'address' },
                    { name: 'value', type: 'uint256' },
                    { name: 'gas', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'data', type: 'bytes' },
                ],
                EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'version', type: 'string' },
                    { name: 'chainId', type: 'uint256' },
                    { name: 'verifyingContract', type: 'address' },
                ],
            },
            value: {
                from: req.from,
                to: req.to,
                value: ethers.BigNumber.from("0"),
                gas: req.gas,
                nonce: req.nonce,
                data: req.data.toString()

            },
        })
        return signature;

    }
    const sendSignedTransaction = async () => {
        const signature = await signMetaTx(signedTxToSend);
        const dataBuffer = { 'values': signedTxToSend, 'signature': signature }
        const priviteKey = process.env.REACT_APP_KEY_PAYER_MAIN
        const walletPrivateKey = new Wallet(priviteKey);
        let walletSigner = walletPrivateKey.connect(provider)
        const contractForwarder = new ethers.Contract(
            contractsAddresses[network.name][0].MinimalForwarder,
            MinimalForwarderAbi,
            walletSigner
        );
        try {
            const toastSendSigned = toast.loading("Sending transaction please wait...")
            contractForwarder.execute(dataBuffer.values, dataBuffer.signature).then((result: any) => {
                result.wait().then((receipt: any) => {
                    toast.update(toastSendSigned, { render: "Transaction sended successfully", type: "success", isLoading: false, autoClose: 2000, position: toast.POSITION.TOP_CENTER })
                    dispatch(fetchUserBalanceSingleToken({ address, token: props.token, networkName: network.name, provider }))
                    calculateTokenAndPayToken()
                }).catch((error: any) => {
                    // console.log(error, "error")
                    toast.update(toastSendSigned, { render: "Transaction failed", type: "error", isLoading: false, autoClose: 2000, position: toast.POSITION.TOP_CENTER })
                });
            }).catch((error: any) => {
                // console.log(error, "error")
                toast.error("Transaction failed", { autoClose: 2000, position: toast.POSITION.TOP_CENTER })
            });
        }
        catch (err) {
            // console.log(err, "err")
            toast.error("Transaction failed", { autoClose: 2000, position: toast.POSITION.TOP_CENTER })
        }
    }
    const sendSignedTransactionPolygon = async () => {
        const signature = await signMetaTx(signedTxToSend);
        const dataBuffer = { 'values': signedTxToSend, 'signature': signature }
        const priviteKey = process.env.REACT_APP_KEY_PAYER_MAIN
        const walletPrivateKey = new Wallet(priviteKey);
        let walletSigner = walletPrivateKey.connect(provider)
        const contractForwarder = new ethers.Contract(
            contractsAddresses[network.name][0].MinimalForwarder,
            MinimalForwarderAbi,
            walletSigner
        );
        //estimate gas used for execute function and send transaction
        try {
            const gasLimit = await contractForwarder.estimateGas.execute(dataBuffer.values, dataBuffer.signature);
            const gasPrice = await walletSigner.getGasPrice();
            contractForwarder.execute(dataBuffer.values, dataBuffer.signature,
                {
                    gasPrice: gasPrice.mul(110).div(100),
                    value: ethers.utils.parseEther("0"),
                    gasLimit: gasLimit.mul(110).div(100)
                }).then((result: any) => {
                    const toastSendSigned = toast.loading("Sending transaction, please wait...");
                    result.wait().then((receipt: any) => {
                        toast.update(toastSendSigned, {
                            render: "Transaction sent successfully",
                            type: "success",
                            isLoading: false,
                            autoClose: 2000,
                            position: toast.POSITION.TOP_CENTER
                        });
                        dispatch(fetchUserBalanceSingleToken({ address, token: props.token, networkName: network.name, provider }))
                        calculateTokenAndPayTokenPolygon()
                    }).catch((error: any) => {
                        // console.log(error, "error")
                        toast.update(toastSendSigned, {
                            render: "Transaction failed",
                            type: "error",
                            isLoading: false,
                            autoClose: 2000,
                            position: toast.POSITION.TOP_CENTER
                        });
                    });
                }).catch((error: any) => {
                    toast.error("Transaction failed", { autoClose: 2000, position: toast.POSITION.TOP_CENTER });
                });
        }
        catch (err) {
            toast.error("Transaction failed", { autoClose: 2000, position: toast.POSITION.TOP_CENTER });
        }
    }
    const sendSignedTransactionArbitrum = async () => {
        const signature = await signMetaTx(signedTxToSend);
        const dataBuffer = { 'values': signedTxToSend, 'signature': signature }
        const priviteKey = process.env.REACT_APP_KEY_PAYER_MAIN
        const walletPrivateKey = new Wallet(priviteKey);
        let walletSigner = walletPrivateKey.connect(provider)
        const contractForwarder = new ethers.Contract(
            contractsAddresses[network.name][0].MinimalForwarder,
            MinimalForwarderAbi,
            walletSigner
        );
        //estimate gas used for execute function and send transaction
        try {
            const gasLimit = await contractForwarder.estimateGas.execute(dataBuffer.values, dataBuffer.signature);
            contractForwarder.execute(dataBuffer.values, dataBuffer.signature,
                {
                    value: ethers.utils.parseEther("0"),
                    gasLimit: gasLimit.mul(110).div(100)
                }).then((result: any) => {
                    const toastSendSigned = toast.loading("Sending transaction, please wait...");
                    result.wait().then((receipt: any) => {
                        toast.update(toastSendSigned, {
                            render: "Transaction sent successfully",
                            type: "success",
                            isLoading: false,
                            autoClose: 2000,
                            position: toast.POSITION.TOP_CENTER
                        });
                        dispatch(fetchUserBalanceSingleToken({ address, token: props.token, networkName: network.name, provider }))
                        dispatch(removeSendedAddress(txToSend.addressesToSend.length))
                        calculateTokenAndPayToken()
                    }).catch((error: any) => {
                        // console.log(error, "error")
                        toast.update(toastSendSigned, {
                            render: "Transaction failed",
                            type: "error",
                            isLoading: false,
                            autoClose: 2000,
                            position: toast.POSITION.TOP_CENTER
                        });
                    });
                }).catch((error: any) => {
                    // console.log(error, "error")
                    toast.error("Transaction failed", { autoClose: 2000, position: toast.POSITION.TOP_CENTER });
                });
        }
        catch (err) {
            // console.log(err, "err")
            toast.error("Transaction failed", { autoClose: 2000, position: toast.POSITION.TOP_CENTER });
        }

    }
    useEffect(() => {
        if (!props.token.isOpen) {
            props.showPrev();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.token.isOpen])
    useEffect(() => {

        if (!props.token.isOpen || !networkSpeed) {
            return;
        }

        switch (network.id) {
            case 97:
            case 56:
                if (props.isNative) {
                    calculateNativeBSC();
                } else if (!props.isNativeFee) {
                    calculateTokenAndPayNativeBSC();
                } else {
                    calculateTokenAndPayTokenBsc();
                }
                break;
            case 10:
                if (props.isNative) {
                    calculateNativeOptimism();
                } else if (!props.isNativeFee) {
                    calculateTokenAndPayNativeOptimism();
                } else {
                    calculateTokenAndPayTokenOptimism();
                }
                break;
            case 137:
            case 80001:
            case 43114:
                if (props.isNative) {
                    calculateNativePolygon();
                    // dispatch(calculateNativePolygon({token:props.token, isNative:props.isNative}))
                }
                else if (!props.isNativeFee) {
                    calculateTokenAndPayNativePolygon();
                } else {
                    calculateTokenAndPayTokenPolygon();
                }
                break;
            default:
                if (props.isNative) {
                    calculateNative();
                } else if (!props.isNativeFee) {
                    calculateTokenAndPayNative();
                } else {
                    calculateTokenAndPayToken();
                }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addressesAndAmounts, networkSpeed]);

    const sendTransaction = async () => {
        if (props.isNative) {
            sendNativeTx()
        }
        else if (!props.isNativeFee) {
            if (network.id === 10) {
                sendTokenAndPayNativeOptimism()
            }
            else {
                sendTokenAndPayNative()
            }
        }
        else {
            if (network.id === 137) {
                sendSignedTransactionPolygon()
            }
            else if (network.id === 42161) {
                sendSignedTransactionArbitrum()
            }
            else {
                sendSignedTransaction()
            }

        }
    }
    return (
        <>
            <div className="mb-3">
                {
                    loading ? <div className="loader-container justify-center flex">
                        <div className="spinner"></div>
                    </div> :
                        <div>
                            <h3 className="mb-1">Summary</h3>
                            <div className={` ${!isCalculated ? 'blur-sm' : ''} bg-white flex flex-row w-full sm:flex-col rounded-md`}>
                                <div className="flex flex-col w-full">
                                    <div className="px-3 py-3 flex flex-col border-b-2">
                                        <span className="text-xl text-blue-900 font-bold">
                                            {totalAddressesPerTx}
                                        </span>
                                        <span className="text-xs text-gray-400">Total number of addresses </span>
                                    </div>
                                    <div className="px-3 py-3 flex flex-col border-b-2">
                                        <span className="text-xl text-blue-900 font-bold">
                                            {totalTransactions}
                                        </span>
                                        <span className="text-xs text-gray-400">Total number of transactions needed </span>
                                    </div>
                                    <div className="px-3 py-3 flex flex-col">
                                        <span className="text-xl text-blue-900 font-bold">
                                            {
                                                props.isNativeFee ? `${parseFloat(totalFee).toFixed(12)} - ${props.token.name}` : `${parseFloat(totalFee).toFixed(12)} - ${chain?.nativeCurrency.symbol}`
                                            }
                                        </span>
                                        {
                                            props.isNativeFee ? "" : <span className="text-gray-400 text-sm"> {txFee} commision fee  + {ethers.utils.formatEther(gasPrice)} transaction fee </span>
                                        }
                                        <span className="text-xs text-gray-400">Approximate cost of operation </span>
                                    </div>
                                </div>
                                <div className="flex flex-col border-l-2 w-full">
                                    <div className="px-3 py-3 flex flex-col border-b-2">
                                        <span className="text-xl text-blue-900 font-bold">
                                            {parseFloat(ammount).toFixed(4)} {props.token.name}
                                        </span>
                                        <span className="text-xs text-gray-400">Total number of tokens to be sent </span>
                                    </div>
                                    <div className="px-3 py-3 flex flex-col border-b-2">
                                        <span className="text-xl text-blue-900 font-bold">
                                            {!props.isNativeFee ? `${parseFloat(props.token.userBalance).toFixed(4)} ${props.token.name}` : `${parseFloat(props.token.userBalanceDeposit).toFixed(4)}  ${props.token.name}`}
                                        </span>
                                        <span className={" text-xs text-gray-400"}>
                                            Your token balance {props.isNativeFee ? " deposited" : ""}
                                        </span>
                                    </div>
                                    <div className="px-3 py-3 flex flex-col">
                                        <span className="text-xl text-blue-900 font-bold">
                                            {parseFloat(totalFee).toFixed(4)} {props.isNativeFee ? props.token.name : chain?.nativeCurrency.symbol} + {parseFloat(ammount).toFixed(4)}  {props.token.name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            Total amount to send per transaction
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {errorMessage ? <MultiSendError error={errorMessage} /> : null}
                            <div className="mt-2 flex sm:flex-col w-full">
                                <button className="bg-blue-500 text-white font-bold px-5 py-1 mr-2 sm:mr-0 sm:mb-2 rounded-md" onClick={props.showPrev}>Prev</button>
                                {!isCalculated || error ?
                                    <button className="bg-neutral-400 text-white font-bold px-5 py-1 rounded-md backdrop:blur-md" disabled>Send</button> :
                                    <button className="bg-neutral-800 text-white font-bold px-5 py-1 rounded-md" onClick={sendTransaction}>Send</button>}
                            </div>
                        </div>
                }
            </div>
        </>

    )
}
export default Summary;
