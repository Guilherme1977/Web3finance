import { Web3State } from "../../Web3DataContext";
import Row from "./Row";
import TableHeader from "./TableHeader";

const Table = () => {
    const { tokens, setTokens } = Web3State();
    const openElement = (nameAsset: string) => {
       const updatedTokens = tokens.map((token: any) => {
            if (token.name === nameAsset) {
                token.isOpen = !token.isOpen
            }
            else {
                token.isOpen = false
            }
            return token;
        })
        setTokens([...updatedTokens])
    }
 
    return (
        <>
            <TableHeader />
            {tokens && tokens.map((element: any, index: number) => {
                return <Row key={index} openElement={openElement} element={element} />
            })}
        </>
    )
}
export default Table;