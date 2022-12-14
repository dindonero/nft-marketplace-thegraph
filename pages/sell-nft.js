import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import { Form, useNotification } from "web3uikit"
import { ethers } from "ethers"
import nftAbi from "../constants/BasicNft.json"
import { useMoralis, useWeb3Contract } from "react-moralis"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import networkMapping from "../constants/networkMappings.json"
import { useState } from "react"

export default function Home() {

    const { chainId } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"

    const [isDisabled, setIsDisabled] = useState(false)
    const [isAlreadyApproved, setIsAlreadyApproved] = useState(false)

    const marketplaceAddress = networkMapping[chainString].NftMarketplace[0]
    const dispatch = useNotification()

    const { runContractFunction } = useWeb3Contract()

    async function isApproved(data) {
        const nftAddress = data.data[0].inputResult
        const tokenId = data.data[1].inputResult

        const isApprovedOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "getApproved",
            params: {
                tokenId: tokenId
            }
        }
        const falses = await runContractFunction({
            params: isApprovedOptions,
            onSuccess: (result) => result.toString() === marketplaceAddress,
            onError: (error) => console.log(error)
        })
        console.log(falses)
        return falses
    }

    async function approveAndList(data) {
        console.log("Approving...")
        const nftAddress = data.data[0].inputResult
        const tokenId = data.data[1].inputResult
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString()

        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: marketplaceAddress,
                tokenId: tokenId
            }
        }

        await runContractFunction({
            params: approveOptions,
            onSuccess: (tx) => handleApproveSuccess(tx, nftAddress, tokenId, price),
            onError: (error) => console.log(error)
        })
    }

    async function alreadyApprovedOnlyList(data) {
        const nftAddress = data.data[0].inputResult
        const tokenId = data.data[1].inputResult
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString()

        await handleApproveSuccess(null, nftAddress, tokenId, price)
    }

    async function handleApproveSuccess(tx, nftAddress, tokenId, price) {
        if (tx) await tx.wait(1)
        console.log("Time to list")
        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price
            }
        }
        await runContractFunction({
            params: listOptions,
            onSuccess: (tx) => handleListSuccess(tx, nftAddress, tokenId, price),
            onError: (error) => {
                //console.log(isDisabled)
                setIsDisabled(false)
                //console.log(isDisabled)
                console.log(error)
            }
        })
    }

    async function handleListSuccess(tx, nftAddress, tokenId, price) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "listing updated",
            title: "Listing updated - please refresh (and move blocks)",
            position: "topR"
        })
    }

    return (
        <div className={styles.container}>
            <Form
                onSubmit={async (data) => approveAndList(data)}
                    isDisabled={isDisabled}
                    data={[{
                    name: "NFT Address",
                    type: "text",
                    inputWidth: "50%",
                    value: "",
                    key: "nftAddress"
                },
                {
                    name: "Token ID",
                    type: "number",
                    value: "",
                    key: "tokenId"
                },
                {
                    name: "Price (in ETH)",
                    type: "number",
                    value: "",
                    key: "price"
                }
                    ]}/>
                    </div>
                    )
                }
