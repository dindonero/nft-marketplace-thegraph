import { Modal, Input, useNotification } from "web3uikit"
import { useState } from "react"
import { useWeb3Contract } from "react-moralis"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { ethers } from "ethers"


export default function updateListingModal({ nftAddress, tokenId, isVisible, marketplaceAddress, onClose }) {
    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0)

    const dispatch = useNotification()

    const handleUpdateListingSuccess = async (tx) => {
        dispatch({
            type: "success",
            message: "listing updated",
            title: "Listing updated - please refresh (and move blocks)",
            position: "topR"
        })
        onClose && onClose()
        setPriceToUpdateListingWith("0")
    }

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0")
        }
    })

    return (
        <Modal isVisible={isVisible} onCancel={onClose} onCloseButtonPressed={onClose}
               onOk={() => {
                   updateListing({
                       onError: (error) => {
                           console.log(error)
                       },
                       onSuccess: () => handleUpdateListingSuccess()
                   })
               }}
        >
            <Input
                label="Update listing price in L1 Currency (ETH)"
                name="New listing price"
                type="number"
                onChange={(event) => {
                    setPriceToUpdateListingWith(event.target.value)
                }}
                onOk={() => {
                }}
            />
        </Modal>
    )
}