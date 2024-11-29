import React, { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@material-ui/core'
import SkuScanner from './SkuScanner'
import { instance } from '../../config/firebase'

const FreeLiquidDialog = ({
  setOpenFreeLiquidDialog,
  data,
  skuInput,
  setSkuInput,
  orderData,
  setOrderData,
  setOrderObj,
  orderObj,
  setIsFreeAdded,
}) => {
  const [scanned, setScanned] = useState(false)
  const [scannedProduct, setScannedProduct] = useState(undefined)
  const [isFound, setIsFound] = useState(true)
  const [isError, setIsError] = useState(false)

  const setNewData = () => {
    const orderData1 = orderData
    const index = orderData1.findIndex((c) => c.sku === data.sku)
    orderData1.splice(index, 1)
    const obj = {
      name: scannedProduct.variant_name,
      sku: scannedProduct.sku,
      order_quantity: data.order_quantity,
      counted_quantity: 0,
      match: false,
      isFree: false,
    }
    orderData1.push(obj)
    delete orderObj[data.sku]
    orderObj[scannedProduct.sku] = obj
    setOrderObj(orderObj)
    setOrderData(JSON.parse(JSON.stringify(orderData1)))
    setIsFreeAdded(true)
    setOpenFreeLiquidDialog(false)
  }

  const handleFreeScan = async () => {
    const { data: freeData } = await instance.get(`/products/${data.sku}`, {
      params: {
        isID: true,
      },
    })
    await instance
      .get(`/products/${skuInput}`, {
        params: {
          isID: true,
        },
      })
      .then(({ data: res }) => {
        setScannedProduct(res.data)
        setIsError(false)
        res.data.variant_options.forEach((c) => {
          if (c.name === 'nicotine_strength') {
            const nicotineValue = c.value
            const expectedNicotineValue = freeData.data.variant_options[0].value

            // check for speical condition to allow store to scan 24MG expected for 18MG
            // and scan 16MG expected for 12MG
            if (expectedNicotineValue === '24mg' && nicotineValue === '18mg') {
              // allow
              setScanned(true)
              setIsFound(true)
              return 1
            } else if (
              expectedNicotineValue === '16mg' &&
              nicotineValue === '12mg'
            ) {
              // allow
              setScanned(true)
              setIsFound(true)
              return 1
            }

            // check if nicotine strength is matching the expected value
            if (nicotineValue === expectedNicotineValue) {
              setScanned(true)
              setIsFound(true)
              return 1
            } else {
              setScanned(false)
              setIsFound(false)
              return -1
            }
          } else {
            setScanned(false)
            setIsFound(false)
            return -1
          }
        })
      })
      .catch((e) => {
        console.log(e)
        setIsError(true)
      })
  }

  return (
    <Dialog
      open={true}
      onEscapeKeyDown={() => setOpenFreeLiquidDialog(false)}
      onBackdropClick={() => setOpenFreeLiquidDialog(false)}
    >
      <DialogTitle>Scan Free Liquid for {data.name}</DialogTitle>
      <DialogContent>
        <SkuScanner
          skuInput={skuInput}
          setSkuInput={setSkuInput}
          handleScan={handleFreeScan}
        />
        <Divider />
        {scanned ? (
          <Typography variant={'body1'}>
            Name: {scannedProduct.variant_name}
          </Typography>
        ) : null}
        {!isFound ? (
          <Typography variant={'body1'}>Wrong MG</Typography>
        ) : isError ? (
          <Typography variant={'body1'}>SKU does not exists</Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={setNewData}
          color="primary"
          variant={'contained'}
          disabled={!scanned}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FreeLiquidDialog
