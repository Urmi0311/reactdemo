import {
  Backdrop,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControlLabel,
  Switch
} from '@material-ui/core'
import {
  Backup as BackupIcon,
  Help as HelpIcon,
  Done as DoneIcon,
  Clear as ClearIcon,
  LocalShipping as LocalShippingIcon
} from '@material-ui/icons'
import firebase from 'firebase'
import React, { useEffect, useState } from 'react'
import { Title } from 'react-admin'
import { Helmet } from 'react-helmet'
import ReactPlayer from 'react-player'
import { instance } from '../../config/firebase'
import FreeLiquidDialog from './FreeLiquidDialog'
import ProductGrid from './ProductGrid'
import vapeKitsVideo from './resources/videos/Vape_Kit_and_E-Liquid.mp4'
import vasesVideo from './resources/videos/Vases.mp4'
import SkuScanner from './SkuScanner'
import WebOrdersGuideline from './resources/pdf/Guidelines for Web Order System.pdf'
import moment from 'moment'

const PACKAGE_TYPE_MAP = {
  ShoshaNZ: [
    {
      name: 'DLE',
      code: 'CPOLTPDL'
    },
    {
      name: 'A5',
      code: 'CPOLTPA5'
    },
    {
      name: 'A4',
      code: 'CPOLTPA4'
    }
  ],
  ShoshaAU: [
    {
      name: 'DHL Express',
      code: 'WPX'
    }
  ]
}

export const WebOrders = () => {
  const [orderList, setOrderList] = useState([])
  const [orderObjByOrderNumber, setOrderObjByOrderNumber] = useState({})
  const [skuInput, setSkuInput] = useState('')
  const [outletId, setOutletId] = useState()
  const [waiting, setWaiting] = useState(true)
  const [orderNumber, setOrderNumber] = useState('')
  const [showPrescription, setShowPrescription] = useState(false)
  const [orderNumberValueStore, setOrderNumberValueStore] = useState('')
  const [orderData, setOrderData] = useState([])
  const [orderObj, setOrderObj] = useState({})
  const [showGrid, setShowGrid] = useState(false)
  const [columnDefinition, setColumnDefinition] = useState([
    { headerName: 'Name', field: 'name' },
    { headerName: 'SKU', field: 'sku' },
    { headerName: 'Order Quantity', field: 'order_quantity' },
    { headerName: 'Counted', field: 'counted_quantity' },
    {
      headerName: 'Status',
      field: 'match',
      cellRenderer: 'statusCellRenderer'
    },
    { headerName: 'Replace', field: 'isFree', cellRenderer: 'btnCellRenderer' }
  ])
  const [actionSpace, setActionSpace] = useState(null)
  const [customerDetails, setCustomerDetails] = useState()

  const [isFreeLiquid, setIsFreeLiquid] = useState(false)
  const [isFreeAdded, setIsFreeAdded] = useState()
  const [openFreeLiquidDialog, setOpenFreeLiquidDialog] = useState(false)
  const [freeData, setFreeData] = useState()
  const [selectedLiquid, setSelectedLiquid] = useState()

  const [openDialog, setOpenDialog] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [staffName, setStaffName] = useState('')

  const [openRedirectDialog, setOpenRedirectDialog] = useState(false)
  const [reason, setReason] = useState('')

  const [viewCustomerDetails, setViewCustomerDetails] = useState(false)

  const [gridApi, setGridApi] = useState(null)
  const [showHelpSection, setShowHelpSection] = useState(false)

  const [requirePicture, setRequirePicture] = useState([])
  const [uploadOrderNumber, setUploadOrderNumber] = useState('')
  const [showUploadPictureDialog, setShowUploadPictureDialog] = useState(false)
  const [currentFile, setCurrentFile] = useState(null)

  const [helpContent, setHelpContent] = useState(<></>)
  const [showImageUploadReason, setShowImageUploadReason] = useState(false)
  const [imageReasonText, setImageReasonText] = useState('')
  const [imageReasonStaff, setImageReasonStaff] = useState('')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const [trackingGenerated, setTrackingGenerated] = useState(false)
  const [currentOrderObj, setCurrentOrderObj] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadingPrescription, setDownloadingPrescription] = useState(false)
  const [pdfsBase64, setPdfsBase64] = useState({})
  const [automaticTicket, setAutomaticTicket] = useState(false)
  const [packagingType, setPackagingType] = useState('CPOLTPDL')

  // Courier pickup
  const [showCourierPickupDialog, setShowCourierPickupDialog] = useState(false)
  const [courierPickupJobs, setCourierPickupJobs] = useState([])

  // Pick up tracking
  const [remainingPickupOrder, setRemainingPickupOrder] = useState([])
  // Set hold for order
  const [holdOrder, setHoldOrder] = useState(false)

  useEffect(() => {
    const db = firebase
      .database()
      .ref(`users/${sessionStorage.getItem('uid')}`)
    db.once('value')
      .then(async (doc) => {
        const data = doc.val()
        if (
          data === undefined ||
          data.outlet_id === undefined ||
          data.outlet_id === null
        ) {
          alert(
            'Error: This account does not have a store associated with it.'
          )
          setWaiting(false)
        } else if (data === null) {
          alert('This user does not have a database entry.')
          setWaiting(false)
        } else {
          setOutletId(data.outlet_id)
          await instance
            .get('web-orders/order-list', {
              params: {
                outlet_id: data.outlet_id,
                all: false,
                include_all_details: true
              }
            })
            .then((response) => {
              setOrderList(response.data)
              const orderNumberObj = {}
              for (const obj of response.data) {
                orderNumberObj[obj.orderNumber] = obj
              }
              setOrderObjByOrderNumber(orderNumberObj)
              setWaiting(false)
            })
            .catch((err) => {
              alert(err)
              setWaiting(false)
            })
        }
      })
      .catch((err) => {
        alert(err)
        setWaiting(false)
      })
  }, [])

  useEffect(() => {
    const getData = async () => {
      try {
        setWaiting(true)
        const requiredPicturesData = (
          await instance.get('web-orders/web-order-picture')
        ).data
        setRequirePicture(requiredPicturesData)

        const courierPickupData = (
          await instance.get('/web-orders/courier-pickup')
        ).data
        setCourierPickupJobs(courierPickupData)

        const pendingPickupData = (
          await instance.get('/web-orders/pending-pickup')
        ).data
        setRemainingPickupOrder(pendingPickupData)
      } catch (err) {
        alert(`Error: ${err?.response?.data ?? ''}`)
      } finally {
        setWaiting(false)
      }
    }
    getData()
  }, [])

  const handleBookPickup = async (courier) => {
    try {
      setShowCourierPickupDialog(false)
      setWaiting(true)
      const result = (
        await instance.post('/web-orders/courier-pickup', {
          courier
        })
      ).data
      setCourierPickupJobs((old) => {
        return [...old, result]
      })
      alert(`Booking for ${courier} successful.`)
    } catch (err) {
      alert(`Error: ${err?.response?.data ?? ''}`)
    } finally {
      setWaiting(false)
    }
  }

  const confirmPickup = async (objectId) => {
    const confirmResult = confirm(
      'Are you sure this courier pickup has been completed?'
    )
    if (!confirmResult) {
      return
    }
    try {
      setWaiting(true)
      await instance.post('/web-orders/courier-pickup-confirmation', {
        objectId
      })
      setCourierPickupJobs((old) => {
        return old.filter((c) => c._id !== objectId)
      })
    } catch (err) {
      alert(`Error: ${err?.response?.data ?? ''}`)
    } finally {
      setWaiting(false)
    }
  }

  const handleSelect = (e) => {
    const value = e.target.value
    const [orderNumberTarget, indexTarget] = value.split('|')
    const currentOrderObjTemp = orderList?.[indexTarget] ?? null
    const country = e.target.value.substring(0, 2)
    setShowPrescription(country === 'AU')
    setOrderNumberValueStore(value)
    setOrderNumber(orderNumberTarget)
    setCurrentIndex(indexTarget)
  }

  const handleLoad = async () => {
    if (orderNumber === '') {
      alert('Error: No order selected')
      return
    }
    setActionSpace(null)
    setWaiting(true)
    const freeItems = {}
    if (orderObjByOrderNumber[orderNumber] !== undefined) {
      const obj = orderObjByOrderNumber[orderNumber]
      const _orderObj = {}
      const data = obj.products.map((item) => {
        const obj = {
          name: item.name,
          sku: item.sku,
          order_quantity: item.qty,
          counted_quantity: 0,
          match: false
        }
        if (item.sku.includes('FREE')) {
          setIsFreeLiquid(true)
          setIsFreeAdded(false)
          obj.isFree = true
          freeItems[item.sku] = obj
        } else {
          setIsFreeAdded(true)
          obj.isFree = false
        }
        _orderObj[item.sku] = obj
        return obj
      })
      if (obj !== null) {
        if (obj?.websiteType === 'ShoshaNZ') {
          setAutomaticTicket(false)
        } else {
          setAutomaticTicket(false)
        }
      }
      if (obj.webOrderStatus === 'Holded') {
        setHoldOrder(true)
      }

      setCurrentOrderObj(obj)
      setFreeData(freeItems)
      setCustomerDetails(obj.customer)
      setOrderObj(_orderObj)
      setOrderData(data)
      setShowGrid(true)
      setLoaded(true)
    }

    setWaiting(false)
  }

  const handleScan = (sku) => {
    setSkuInput('')
    if (orderObj[sku] === undefined) {
      alert('Error: The scanned product is not in this order.')
      return
    }

    const obj = orderObj[sku]
    let current = obj.counted_quantity
    current += 1

    let match = obj.match
    if (current === obj.order_quantity) {
      match = true
    } else if (current > obj.order_quantity) {
      alert('Error: Scanned order is higher than expected.')
      return
    }

    obj.counted_quantity = current
    obj.match = match

    const newOrderObj = {
      ...orderObj,
      [sku]: obj
    }

    setOrderObj(newOrderObj)

    const newOrderData = []
    for (const [key, value] of Object.entries(newOrderObj)) {
      newOrderData.push(value)
    }

    setOrderData(newOrderData)
  }

  const handleSkipImageUpload = async () => {
    if (imageReasonText.trim() === '' || imageReasonStaff.trim() === '') {
      alert('Please fill in both textboxes.')
      return
    }
    setShowUploadPictureDialog(false)
    setWaiting(true)
    try {
      await instance.post('web-orders/web-order-picture-skip', {
        order_number: uploadOrderNumber,
        reason: imageReasonText,
        staff: imageReasonStaff
      })
      setImageReasonText('')
      setImageReasonStaff('')
      alert(`Successfully skipped order ${uploadOrderNumber}`)
      setRequirePicture((old) => {
        return old.filter((c) => c.orderNumber !== uploadOrderNumber)
      })
    } catch (err) {
      alert(err)
      setShowUploadPictureDialog(true)
    }
    setWaiting(false)
  }

  const uploadFile = async () => {
    setShowUploadPictureDialog(false)
    setWaiting(true)
    try {
      const newFormData = new FormData()
      newFormData.append('webOrderPicture', currentFile)
      newFormData.append('orderNumber', uploadOrderNumber)
      await instance.post('web-orders/web-order-picture', newFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      alert(
        `Successfully uploaded image for order number ${uploadOrderNumber}`
      )
      setRequirePicture((old) => {
        return old.filter((c) => c.orderNumber !== uploadOrderNumber)
      })
    } catch (err) {
      alert(err?.response?.data)
      setShowUploadPictureDialog(true)
    }
    setWaiting(false)
  }

  const checkOrder = async () => {
    try {
      const { data } = await instance.get(
        '/web-orders/check-before-complete-order',
        {
          params: {
            order_number: orderNumber,
            outlet_id: outletId
          }
        }
      )

      return data
    } catch (err) {
      alert(err)
    }
  }

  const handleFinish = async () => {
    // if (!downloadShippingTicket || !downloadPackingSlip) {
    //   alert("Please download both files before confirming.")
    //   return
    // }

    if (String(staffName).trim() === '') {
      alert('Please enter the name of the staff that packed this order.')
      return
    }

    let cleanedTrackingNumber

    // Check the tracking number
    if (!automaticTicket || !trackingGenerated) {
      if (String(trackingNumber).trim() === '') {
        alert('Please enter the tracking number.')
        return
      }

      cleanedTrackingNumber = String(trackingNumber)
        .trim()
        .toUpperCase()
        .split(' ')
        .join('')

      if (String(orderNumber).trim().toUpperCase() === cleanedTrackingNumber) {
        alert('The tracking number should not be the order number!!!')
        return
      }

      if (cleanedTrackingNumber.length < 10) {
        alert('The tracking number is not valid!')
        return
      }
    }

    const currentData = []
    gridApi.forEachNode((rowNode, index) => {
      currentData.push(rowNode.data)
    })

    for (const row of currentData) {
      if (row.match !== true) {
        alert(
          'Not all products are packed. Please double check the status column.'
        )
        setOpenDialog(false)
        return
      }
      if (row.isFree === true) {
        alert('Please replace Free E-Liquid.')
        setOpenDialog(false)
        return
      }
    }

    const confirmResult = window.confirm(
      'Are you sure you are done with this order?'
    )

    if (confirmResult !== true) {
      return
    }
    setOpenDialog(false)
    setWaiting(true)
    try {
      await instance.post('/web-orders/complete-order', {
        order_number: orderNumber,
        outlet_id: outletId,
        tracking_number: cleanedTrackingNumber,
        staff_name: String(staffName).trim(),
        order_data: orderData
      })
      alert('Order Complete')
      setOrderList((old) => {
        return old.filter((current) => current.orderNumber !== orderNumber)
      })
      setShowGrid(false)
      setOrderNumber(null)
      setTrackingNumber('')
      setStaffName('')
      setCurrentIndex(null)
      setLoaded(false)
      setTrackingGenerated(false)
      setCurrentOrderObj(null)
      setDownloading(false)
      setPdfsBase64({})
      setAutomaticTicket(false)
    } catch (err) {
      alert(err)
    }
    setWaiting(false)
  }

  const handleReview = async () => {
    alert('Please double check the ordered products.')
    setActionSpace(true)
  }

  const handleRedirect = async () => {
    if (String(reason).trim() === '') {
      alert('Please provide the redirect reason.')
      return
    }
    setOpenRedirectDialog(false)
    setWaiting(true)

    try {
      const { data } = await instance.post('/web-orders/redirect-order', {
        order_number: orderNumber,
        outlet_id: outletId,
        reason
      })
      setOrderList((old) => {
        return old.filter((current) => current.orderNumber !== orderNumber)
      })
      setShowGrid(false)
      setOrderNumber(null)
      setWaiting(false)
      setCurrentIndex(null)
      setLoaded(false)
      alert(data)
    } catch (err) {
      alert('Please contact IT team.')
      setWaiting(false)
    }
  }

  const generateShipmentTicket = async () => {
    try {
      setDownloading(true)
      const data = (
        await instance.get('web-orders/get-shipment-pdf', {
          params: {
            order_number: currentOrderObj.orderNumber,
            parcel_code: packagingType
          }
        })
      ).data
      setPdfsBase64(data)
      setTrackingGenerated(true)
    } catch (err) {
      alert(err.response.data)
      setAutomaticTicket(false)
    } finally {
      setDownloading(false)
    }
  }

  const downloadPDF = (type) => {
    let linkSource = ''
    let fileName = ''
    const orderNumber = currentOrderObj.orderNumber
    if (type === 'ShipmentLabel') {
      linkSource = `data:application/pdf;base64,${pdfsBase64?.shipmentLabelPDFBase64}`
      fileName = `${orderNumber}-Shipment-Label.pdf`
    } else if (type === 'PackingSlip') {
      linkSource = `data:application/pdf;base64,${pdfsBase64?.packingSlipPDFBase64}`
      fileName = `${orderNumber}-Packing-Slip.pdf`
    } else {
      return
    }

    const downloadLink = document.createElement('a')
    downloadLink.href = linkSource
    downloadLink.download = fileName
    downloadLink.click()
    downloadLink.remove()
  }

  const generatePrescription = async () => {
    setDownloadingPrescription(true)
    await instance
      .get('/web-orders/get-file-link', {
        params: {
          orderId: orderNumber,
          folder: 'Prescription'
        },
        responseType: 'blob'
      })
      .then((response) => {
        const file = new Blob([response.data], { type: 'application/pdf' })
        const fileURL = URL.createObjectURL(file)
        const downloadLink = document.createElement('a')
        downloadLink.href = fileURL
        downloadLink.download = `${orderNumber}`
        downloadLink.click()
        downloadLink.remove()
      })
      .catch((error) => {
        alert('Something wrong with file')
      })
    setDownloadingPrescription(false)
  }

  return (
    <>
      <Helmet title='Web Orders' defer={false} />
      <Title title='Web Orders' />
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} style={{ textAlign: 'center' }}>
              <Typography variant='h6'>Web Order System</Typography>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant='contained'
                color='primary'
                endIcon={<HelpIcon />}
                onClick={() => {
                  setShowHelpSection(true)
                }}
              >
                Help Section
              </Button>
            </Grid>
            <Grid item xs={12}>
              {requirePicture.length === 0
                ? (
                  <> </>
                  )
                : (
                  <>
                    <Typography variant='body1'>
                      Please upload pictures for the following orders:
                    </Typography>
                    <List>
                      {requirePicture.map((c) => {
                        return (
                          <ListItem
                            key={c.orderNumber}
                            style={{
                              border: '1px solid black',
                              borderRadius: 10
                            }}
                          >
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={4}>
                                <Typography variant='boyd1'>
                  {c.orderNumber}
                </Typography>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <ul>
                  {c.products.map((p) => {
                                  return (
                                    <li key={p.product_id}>
                                      {`${p.name} - ${p.sku} - Qty ${p.qty_invoiced}`}
                                    </li>
                                  )
                                })}
                </ul>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Button
                  variant='contained'
                  color='primary'
                  endIcon={<BackupIcon />}
                  onClick={() => {
                                  setUploadOrderNumber(c.orderNumber)
                                  setShowUploadPictureDialog(true)
                                }}
                >
                                Upload Picture
                </Button>
                              </Grid>
                            </Grid>
                          </ListItem>
                        )
                      })}
                    </List>
                  </>
                  )}
            </Grid>
            <Grid item xs={12}>
              <Button
                variant='contained'
                color='primary'
                endIcon={<LocalShippingIcon />}
                onClick={() => setShowCourierPickupDialog(true)}
              >
                Book Courier Pickup
              </Button>
            </Grid>
            {remainingPickupOrder.length === 0 ? (
              <></>
            ) : (
              <Grid item xs={12}>
                <div
                  style={{
                    padding: 10,
                    border: '1px solid black',
                    borderRadius: 10
                  }}
                >
                  <Typography variant='body1'>
                    Orders Pending for Pickup (Update every 30 minutes):
                  </Typography>
                  <ul>
                    {remainingPickupOrder.map((orderObj) => {
                      return (
                        <li key={orderObj._id}>
                          <div>
                            <p>{orderObj.orderNumber}</p>
                            {!orderObj.orderNumber.startsWith('NZ') &&
                              !orderObj.orderNumber.startsWith('AU') && (
                                <Button
                                  variant='outlined'
                                  color='primary'
                                  onClick={async () => {
                                    const confirmResult = window.confirm(
                                      `We cannot track the status of this website type at the moment. Click 'ok' below if the ${orderObj.orderNumber} order has been picked up already.`
                                    )

                                    if (confirmResult) {
                                      try {
                                        setWaiting(true)
                                        await instance.put(
                                          '/web-orders/pending-pickup',
                                          {
                                            orderNumber: orderObj.orderNumber
                                          }
                                        )

                                        // If successful
                                        // Remove this order number from the pending pickup list
                                        setRemainingPickupOrder((old) =>
                                          old.filter(
                                            (obj) => obj._id !== orderObj._id
                                          )
                                        )
                                      } catch (err) {
                                        alert(
                                          `Error: ${err?.response?.data ?? ''}`
                                        )
                                      } finally {
                                        setWaiting(false)
                                      }
                                    }
                                  }}
                                >
                                  {`Confirm ${orderObj.orderNumber} order picked up`}
                                </Button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Grid>
            )}
            {courierPickupJobs.length === 0
              ? (
                <></>
                )
              : (
                <Grid item xs={12}>
                  <div
                    style={{
                      padding: 10,
                      border: '1px solid black',
                      borderRadius: 10
                    }}
                  >
                    <Typography variant='body1'>
                      Upcoming Courier Pickup(s):
                    </Typography>
                    <ul>
                      {courierPickupJobs.map((value, index) => {
                        return (
                          <li key={index}>
                            {value.courier}
                            <ul>
                              <li>{`Caller Name: ${value.outletName}`}</li>
                              <li>
                  {`Requested Pickup Time: ${moment(
                                value.pickupDate
                              ).format('DD MMM YYYY HH:mm')}`}
                </li>
                              <li>
                  {`Job Number: ${
                                value?.resultData?.results?.job_number || 'N/A'
                              }`}
                </li>
                              <li>
                  <Button
                                variant='contained'
                                color='primary'
                                onClick={() => confirmPickup(value._id)}
                              >
                                Confirm Courier Picked Up Parcel(s)
                              </Button>
                </li>
                            </ul>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </Grid>
                )}
            <Grid item xs={12}>
              <Typography variant='h6'>
                {`${orderList.length} orders remaining.`}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl>
                <InputLabel>Order Number</InputLabel>
                <Select
                  value={orderNumberValueStore}
                  onChange={handleSelect}
                  style={{ width: 200 }}
                  disabled={loaded}
                >
                  {orderList.map((item, index) => {
                    return (
                      <MenuItem
                        // key={index}
                        key={item.orderNumber}
                        value={`${item.orderNumber}|${index}`}
                      >
                        {item.orderNumber}
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
              {loaded
                ? (
                  <Button
                    color='primary'
                    variant='contained'
                    style={{ marginLeft: 30, width: 100, marginTop: 10 }}
                    onClick={() => {
                      setHoldOrder(false)
                      setShowGrid(false)
                      setLoaded(false)
                      setTrackingGenerated(false)
                      setCurrentOrderObj(null)
                      setDownloading(false)
                      setPdfsBase64({})
                      setAutomaticTicket(false)
                      setTrackingNumber('')
                    }}
                  >
                    Edit
                  </Button>
                  )
                : (
                  <Button
                    color='primary'
                    variant='contained'
                    style={{ marginLeft: 30, width: 100, marginTop: 10 }}
                    onClick={handleLoad}
                  >
                    Load
                  </Button>
                  )}
            </Grid>
            {holdOrder && (
              <Grid>
                <h1 style={{ color: 'red' }}>
                  This order is currently on hold. Please inform online team.
                </h1>
              </Grid>
            )}

            <Grid item xs={12} style={{ marginTop: 20 }}>
              {showGrid
                ? (
                  <>
                    <Grid container>
                      <Grid item xs={12}>
                        <Typography variant='body1'>Customer Details:</Typography>
                        {customerDetails !== undefined
                          ? (
                            <>
                              <div
                                style={{
                  border: '1px solid black',
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 20,
                  width: 'fit-content'
                }}
                              >
                                <Typography variant='body1'>
                  {`Name: ${customerDetails.firstName} ${customerDetails.lastName}`}
                </Typography>
                                <Typography variant='body1'>
                  {`Email: ${customerDetails.email}`}
                </Typography>
                                <Typography variant='body1'>
                  {`Phone number: ${customerDetails.phone}`}
                </Typography>
                                <Typography variant='body1'>
                  {`Address: ${customerDetails.street}, ${
                                customerDetails.city
                              } ${customerDetails.postCode}, ${
                                customerDetails.country === 'AU'
                                  ? 'Australia'
                                  : customerDetails.country === 'NZ'
                                    ? 'New Zealand'
                                    : customerDetails.country
                              }`}
                </Typography>
                              </div>
                            </>
                            )
                          : (
                            <> </>
                            )}
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        style={{ marginBottom: 20, marginTop: 10 }}
                      >
                        <SkuScanner
                          handleScan={handleScan}
                          setSkuInput={setSkuInput}
                          skuInput={skuInput}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <ProductGrid
                          dataArr={orderData}
                          setWaiting={setWaiting}
                          _columnDefinition={columnDefinition}
                          gridApi={gridApi}
                          setGridApi={setGridApi}
                          setOpenFreeLiquidDialog={setOpenFreeLiquidDialog}
                          freeData={freeData}
                          setSelectedLiquid={setSelectedLiquid}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        style={{ marginTop: 20, textAlign: 'center' }}
                      >
                        {actionSpace === null
                          ? (
                            <>
                              <Grid item xs={12}>
                                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleReview}
                  disabled={holdOrder}
                >
                                Review
                </Button>
                              </Grid>
                              <Grid item xs={12} style={{ marginTop: 30 }}>
                                <Button
                  variant='contained'
                  color='primary'
                  style={{ backgroundColor: 'rgb(218 23 23)' }}
                  disabled={holdOrder}
                  onClick={() => setOpenRedirectDialog(true)}
                >
                                Redirect Order
                </Button>
                              </Grid>
                            </>
                            )
                          : (
                            <>
                              <Grid item xs={12} style={{ marginTop: 40 }}>
                                <Button
                  variant='contained'
                  color='primary'
                  onClick={async () => {
                                  const check = await checkOrder()
                                  if (check === true) {
                                    setOpenDialog(true)
                                    const websiteType =
                                    currentOrderObj?.websiteType
                                    const packagesArray =
                                    PACKAGE_TYPE_MAP[websiteType]
                                    if (Array.isArray(packagesArray)) {
                                      setPackagingType(packagesArray[0].code)
                                    }
                                  } else if (check === false) {
                                    alert(
                                      'The order already assigned to other store. Please contact Online Team.'
                                    )
                                  } else {
                                    alert(
                                      'Something went wrong. Please contact IT team.'
                                    )
                                  }
                                }}
                >
                                Finish Order
                </Button>
                              </Grid>
                              <Grid item xs={12} style={{ marginTop: 30 }}>
                                <Button
                  variant='contained'
                  color='primary'
                  style={{ backgroundColor: 'rgb(218 23 23)' }}
                  onClick={() => setOpenRedirectDialog(true)}
                >
                                Redirect Order
                </Button>
                              </Grid>
                            </>
                            )}
                      </Grid>
                    </Grid>
                  </>
                  )
                : (
                  <> </>
                  )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Backdrop style={{ zIndex: 10000 }} open={waiting}>
        <CircularProgress style={{ color: 'white' }} />
      </Backdrop>
      <Dialog
        open={openDialog}
        onEscapeKeyDown={() => setOpenDialog(false)}
        onBackdropClick={() => setOpenDialog(false)}
      >
        <DialogTitle>Scan the tracking number:</DialogTitle>
        <DialogContent>
          {customerDetails !== undefined
            ? (
              <>
                <Typography variant='body1'>
                  Please ensure you are packing for the correct customer:
                </Typography>
                <div
                  style={{
                    border: '1px solid black',
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 20,
                    width: 'fit-content'
                  }}
                >
                  <Typography variant='body1'>
                    {`Name: ${customerDetails.firstName} ${customerDetails.lastName}`}
                  </Typography>
                  <Typography variant='body1'>
                    {`Email: ${customerDetails.email}`}
                  </Typography>
                  <Typography variant='body1'>
                    {`Phone number: ${customerDetails.phone}`}
                  </Typography>
                  <Typography variant='body1'>
                    {`Address: ${customerDetails.street}, ${
                    customerDetails.city
                  } ${customerDetails.postCode}, ${
                    customerDetails.country === 'AU'
                      ? 'Australia'
                      : customerDetails.country === 'NZ'
                        ? 'New Zealand'
                        : customerDetails.country
                  }`}
                  </Typography>
                </div>
              </>
              )
            : (
              <> </>
              )}

          {/* {currentOrderObj !== null &&
            currentOrderObj?.websiteType === 'ShoshaNZ' && (
              <Grid container>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={automaticTicket}
                        onChange={() => setAutomaticTicket((old) => !old)}
                        color="primary"
                      />
                    }
                    label="Automatic Ticket Generation"
                  />
                </Grid>
              </Grid>
            )} */}
          <h3 style={{ color: 'red' }}>
            Generating ticket is not working now. Please ask online team ("Web
            order" Group on Team) to get shipping label
          </h3>
          {currentOrderObj !== null &&
          currentOrderObj?.websiteType === 'ShoshaNZ' &&
          automaticTicket ? (
            <>
              <Grid container>
                <Grid item xs={12}>
                  <FormControl fullWidth style={{ marginTop: 10 }}>
                    <InputLabel>Packaging Type</InputLabel>
                    <Select
                      value={packagingType}
                      onChange={(e, value) => {
                        setPackagingType(e.target.value)
                      }}
                      fullWidth
                    >
                      {(
                        PACKAGE_TYPE_MAP[currentOrderObj?.websiteType] ?? []
                      ).map((p) => (
                        <MenuItem value={p.code}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} style={{ marginTop: 10 }}>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={() => {
                      generateShipmentTicket()
                      // alert("Generating ticket not working at the moment. Sorry")
                    }}
                  >
                    Generate Ticket
                  </Button>
                </Grid>
                {/* Download Prescription */}
                <Grid item xs={12} style={{ marginTop: 15 }}>
                  {trackingGenerated && !downloading
                    ? (
                      <Grid container>
                        <Grid item xs={12}>
                          <Button
                            variant='contained'
                            color='primary'
                            onClick={() => downloadPDF('ShipmentLabel')}
                          >
                            Download Shipment Label
                          </Button>
                        </Grid>
                        <Grid item xs={12} style={{ marginTop: 15 }}>
                          <Button
                            variant='contained'
                            color='primary'
                            onClick={() => downloadPDF('PackingSlip')}
                          >
                            Download Packing Slip
                          </Button>
                        </Grid>
                      </Grid>
                      )
                    : downloading
                      ? (
                        <CircularProgress style={{ color: 'black' }} />
                        )
                      : (
                        <></>
                        )}
                </Grid>
              </Grid>
            </>
              ) : (
                <TextField
                  autoFocus
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  label='Please SCAN the Tracking Number'
                  type='text'
                  fullWidth
                />
              )}

          <TextField
            value={staffName}
            style={{ marginTop: 20 }}
            onChange={(e) => setStaffName(e.target.value)}
            label='Staff Name'
            type='text'
            fullWidth
          />
          {showPrescription && (
            <Grid item xs={12} style={{ marginTop: 10 }}>
              <Button
                variant='contained'
                color='primary'
                onClick={() => {
                  generatePrescription()
                }}
              >
                Download Prescription
              </Button>
            </Grid>
          )}
          {downloadingPrescription && (
            <CircularProgress style={{ color: 'black', marginTop: 15 }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color='primary'>
            Cancel
          </Button>
          <Button onClick={handleFinish} color='primary'>
            Done
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openRedirectDialog}
        onEscapeKeyDown={() => setOpenRedirectDialog(false)}
        onBackdropClick={() => setOpenRedirectDialog(false)}
      >
        <DialogTitle>Enter the tracking number:</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            label='Reason for redirect'
            type='text'
            fullWidth
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRedirectDialog(false)} color='primary'>
            Cancel
          </Button>
          <Button onClick={handleRedirect} color='primary'>
            Done
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={viewCustomerDetails}
        onEscapeKeyDown={() => setViewCustomerDetails(false)}
        onBackdropClick={() => setViewCustomerDetails(false)}
      >
        <DialogTitle>Customer Details:</DialogTitle>
        <DialogContent>
          {customerDetails != null
            ? (
              <>
                <Typography variant='body1'>
                  {`Name: ${customerDetails.firstName} ${customerDetails.lastName}`}
                </Typography>
                <Typography variant='body1'>
                  {`Email: ${customerDetails.email}`}
                </Typography>
                <Typography variant='body1'>
                  {`Phone number: ${customerDetails.phone}`}
                </Typography>
                <Typography variant='body1'>
                  {`Address: ${customerDetails.street}, ${customerDetails.city} ${
                  customerDetails.postCode
                }, ${
                  customerDetails.country === 'AU'
                    ? 'Australia'
                    : customerDetails.country === 'NZ'
                      ? 'New Zealand'
                      : customerDetails.country
                }`}
                </Typography>
              </>
              )
            : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewCustomerDetails(false)} color='primary'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      {openFreeLiquidDialog
        ? (
          <FreeLiquidDialog
            handleScan={handleScan}
            setSkuInput={setSkuInput}
            skuInput={skuInput}
            setOpenFreeLiquidDialog={setOpenFreeLiquidDialog}
            data={selectedLiquid}
            orderData={orderData}
            setOrderData={setOrderData}
            setOrderObj={setOrderObj}
            orderObj={orderObj}
            setIsFreeAdded={setIsFreeAdded}
          />
          )
        : null}
      <Dialog
        open={showHelpSection}
        onEscapeKeyDown={() => setShowHelpSection(false)}
        onBackdropClick={() => setShowHelpSection(false)}
        maxWidth='xs'
      >
        <DialogTitle>Web Order System Help:</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <a
                href={WebOrdersGuideline}
                target='_blank'
                rel='noopener noreferrer'
              >
                View Web Order Guideline
              </a>
            </Grid>
            <Grid item xs={12}>
              <a
                onClick={() => {
                  setHelpContent(
                    <ReactPlayer url={vapeKitsVideo} controls width='auto' />
                  )
                }}
              >
                View Web Order Packing Guide (Video) - Vape Kits and E-Liquid
              </a>
            </Grid>
            <Grid item xs={12}>
              <a
                onClick={() => {
                  setHelpContent(
                    <ReactPlayer url={vasesVideo} controls width='auto' />
                  )
                }}
              >
                View Web Order Packing Guide (Video) - Vases
              </a>
            </Grid>
            <Grid item xs={12}>
              {helpContent}
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      <Fab
        color='primary'
        style={{ position: 'absolute', bottom: 20, right: 20 }}
        onClick={() => {
          setShowHelpSection(true)
        }}
      >
        <HelpIcon />
      </Fab>
      <Dialog
        open={showUploadPictureDialog}
        onEscapeKeyDown={() => setShowUploadPictureDialog(false)}
        onBackdropClick={() => setShowUploadPictureDialog(false)}
      >
        <DialogTitle>
          Select or take a picture of the order packing:
        </DialogTitle>
        <DialogContent>
          <Grid container>
            <Grid item xs={12} style={{ marginBottom: 10 }}>
              <a
                href={require('./resources/images/Packing_Example.jpg')}
                target='_blank'
                rel='noopener noreferrer'
              >
                Order Packing Example Images
              </a>
            </Grid>
            <Grid item xs={12} style={{ marginTop: 10, marginBottom: 30 }}>
              <input
                type='file'
                name='fileUpload'
                accept='image/*'
                onChange={(e) => {
                  setCurrentFile(e.target.files[0])
                }}
              />
            </Grid>
            <Grid item xs={12} style={{ marginBottom: 20 }}>
              <Button variant='contained' color='primary' onClick={uploadFile}>
                Confirm File Upload
              </Button>
            </Grid>
            <Grid item xs={12} style={{ marginBottom: 20, marginTop: 10 }}>
              <Button
                variant='contained'
                color='primary'
                style={{ backgroundColor: '#e46565' }}
                onClick={() => {
                  setShowImageUploadReason(true)
                }}
              >
                Skip Image Upload
              </Button>
            </Grid>
            <Grid
              item
              xs={12}
              style={{
                marginBottom: 20,
                display: showImageUploadReason ? 'block' : 'none'
              }}
            >
              <Typography variant='body1'>
                Please enter the reason for skipping image upload for this
                order:
              </Typography>
              <TextField
                variant='outlined'
                value={imageReasonText}
                onChange={(e) => {
                  setImageReasonText(e.target.value)
                }}
                fullWidth
                placeholder='Enter Skip Reason'
                style={{ marginBottom: 10 }}
              />
              <TextField
                variant='outlined'
                value={imageReasonStaff}
                onChange={(e) => {
                  setImageReasonStaff(e.target.value)
                }}
                fullWidth
                placeholder='Enter Staff Name'
                style={{ marginBottom: 10 }}
              />
              <Button
                variant='contained'
                color='primary'
                style={{ backgroundColor: '#e46565' }}
                onClick={handleSkipImageUpload}
              >
                Confirm Skip Image Upload
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showCourierPickupDialog}
        onEscapeKeyDown={() => setShowCourierPickupDialog(false)}
        onBackdropClick={() => setShowCourierPickupDialog(false)}
      >
        <DialogTitle>Book CourierPost (NZ) or DHL (AU) Pickup:</DialogTitle>
        <DialogContent>
          <Button
            variant='contained'
            color='primary'
            onClick={() => {
              handleBookPickup('CourierPost')
            }}
          >
            Book CourierPost (NZ) Pickup
          </Button>
          <br />
          <br />
          <br />
          <Button
            variant='contained'
            color='primary'
            onClick={() => {
              // handleBookPickup('DHL')
            }}
          >
            Book DHL (AU) Pickup - Currently Unavailable
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
