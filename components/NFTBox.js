import { useState, useEffect } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketpaceAbi from "../constants/NftMarketplace.json"
import nftAbi from "../constants/BasicNft.json"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"
import UpdateListingModal from "./UpdateListingModal"

const truncateStr = (fullStr, strLen) => {
    if (fullStr.lenght <= strLen) return fullStr

    const separator = "..."
    const separatorLen = separator.length
    const chartsToShow = strLen - separatorLen
    const frontChars = Math.ceil(chartsToShow / 2)
    const backChars = Math.floor(chartsToShow / 2)
    return fullStr.substring(0, frontChars) + separator + fullStr.substring(fullStr.length - backChars)
}

export default function NFTBox({ price, nftAddress, tokenId, marketplaceAddress, seller }) {

    const { isWeb3Enabled, account } = useMoralis()
    const dispatch = useNotification()

    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [showModal, setShowModal] = useState(false)
    const hideModal = () => setShowModal(false)

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            undefined: tokenId
        }
    })

    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftMarketpaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId
        }
    })


    async function updateUI() {
        const tokenURI = await getTokenURI({
            onSuccess: (result) => console.log(result),
            onError: (error) => console.log(`error ${error}`)
        })//"ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"
// broken await getTokenURI()
        console.log(tokenURI)

        if (tokenURI) {
            const requestUrl = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestUrl)).json()
            const imageURI = tokenURIResponse.image
            const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            setImageURI(imageURIURL)
            setTokenName(tokenURIResponse.name)
            setTokenDescription(tokenURIResponse.description)
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15)

    const handleCardClick = () => {
        isOwnedByUser ? setShowModal(true) : buyItem({
            onError: (error) => console.log(error),
            onSuccess: () => handleBuyItemSuccess()

        })
    }

    const handleBuyItemSuccess = () => {
        dispatch({
            type: "success",
            message: "item purchased",
            title: "Item purchased - please refresh (and move blocks)",
            position: "topR"
        })
        setShowModal(false)
    }

    return (
        <div>
            {imageURI ? (
                <div>
                    <UpdateListingModal
                        isVisible={showModal}
                        tokenId={tokenId}
                        marketplaceAddress={marketplaceAddress}
                        nftAddress={nftAddress}
                        onClose={hideModal}
                    />
                    <Card title={tokenName} description={tokenDescription} onClick={handleCardClick}>
                        <div className="p-2">
                            <div className="flex flex-col items-end gap-2">
                                <div>#{tokenId}</div>
                                <div className="italic text-sm">Owned by {formattedSellerAddress}</div>
                                <Image loader={() => imageURI} src={imageURI} height="200" width="200" />
                                <div>{ethers.utils.formatUnits(price, "ether")}</div>
                            </div>
                        </div>
                    </Card>
                </div>) : (
                <div>Loading...</div>)}
        </div>
    )

}