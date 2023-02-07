import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Contract, ethers } from 'ethers';
import { RootState } from '../store';
import contractsAddresses from "../../contracts/AddressesContracts.json";
import OracleAbi from "../../contracts/oracle/Oracle.json";
import RTokenAbi from "../../contracts/RTokenAbi.json";
export interface Asset {
    address: string;
    amount: string;
}
export interface MultiDepositState {
  addressesToSend: Asset[];
  userTokenBalance: number;
  userNativeBalance: number;
  transactionFee: number;
  totalTransactions: number;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: MultiDepositState = {
  addressesToSend: [],
  userTokenBalance: 0,
  userNativeBalance: 0,
  transactionFee: 0,
  status: 'idle',
  totalTransactions: 0
};

export const multiDepositSlice = createSlice({
  name: 'multiDeposit',
  initialState,
  reducers: {
    updateAddressesToSend: (state, action) => {
      state.addressesToSend = action.payload;
    },
    removeSendedAddress: (state, action) => {
      //delete 10 elements from start of array
     state.addressesToSend.splice(0, action.payload);
      
    },
    calculateUserTokenBalance: (state, action) => {
      state.userTokenBalance = action.payload;
    },
    calculateUserNativeBalance: (state, action) => {
      state.userNativeBalance = action.payload;
    },
    calculateTransactionFee: (state, action) => {
      state.transactionFee = action.payload;
    }
  },
});

export const { 
  updateAddressesToSend,
  calculateTransactionFee,
  removeSendedAddress

} = multiDepositSlice.actions;
export const currentNetwork = (state: RootState) => state.network.value.filter((network: any) => network.isActive)[0];
export const totalAddresses = (state: RootState) => state.multiDeposit.addressesToSend.length;
export const calculateTotalAmountTokens = (state: RootState) => state.multiDeposit.addressesToSend.reduce((acc: number, asset: Asset) => acc + parseFloat(asset.amount), 0);

export const addressesToSend = (state: RootState) => state.multiDeposit.addressesToSend;
export const arrayOfAmounts = (state: RootState) => state.multiDeposit.addressesToSend.map((asset: Asset) => asset.amount.toString().trim());
export const arrayOfAddresses = (state: RootState) => state.multiDeposit.addressesToSend.map((asset: Asset) => asset.address.trim());
export default multiDepositSlice.reducer;
export const getUserTokenBalamce = createAsyncThunk(
  'multiDeposit/calculateUserTokenBalance',
  async (args: any, { getState }) => {
    const state = getState() as any;
    const providerBsc = new ethers.providers.JsonRpcProvider('https://practical-cold-owl.bsc-testnet.discover.quiknode.pro/' + process.env.REACT_APP_QUICK_NODE_KEY);
    const contractBsc = new Contract(contractsAddresses["Binance Smart Chain Testnet"][0].PriceOracle, OracleAbi, providerBsc);
    const newBsc = state.token.bscTokens.map(async (token: any) => {
      const tokenContract = new Contract(contractsAddresses[state.network.selectedNetwork.name][0]["r" + token.name], RTokenAbi, providerBsc);
      const totalDeposits = await tokenContract.totalSupply();
      const decimals = await tokenContract.decimals();
      const bscPrice = await contractBsc.getAssetPrice(token.address);
      return { ...token, tokenPrice: ethers.utils.formatUnits(bscPrice, 8), deposits: ethers.utils.formatUnits(totalDeposits, decimals) }
    })
    return Promise.all(newBsc);
  }
)