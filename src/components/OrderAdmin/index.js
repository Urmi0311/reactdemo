import React, { useState, useEffect } from 'react'
import {
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  Backdrop,
  CircularProgress,
  Radio,
  FormControl,
  FormControlLabel
} from '@material-ui/core'
import { Header, Segment } from 'semantic-ui-react'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { instance } from '../../config/firebase'
import moment from 'moment'
import ProductGrid from './ProductGrid'
import { useNotify } from 'react-admin'
import { CSVDownload, CSVLink } from 'react-csv'

export const OrderAdmin = () => {
  const notify = useNotify()
  const [outlets, setOutlets] = useState([{ name: 'Loading...' }])
  const [outletId, setOutletId] = useState()
  const [mainCategory, setMainCategory] = useState('Vape')
  const [subCategory, setSubCategory] = useState('Vape Kits')
  const [dataArr, setDataArr] = useState([])
  const [startDate, setStartDate] = useState()
  const [endDate, setEndDate] = useState()
  const [waiting, setWaiting] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [role, setRole] = useState(sessionStorage.getItem('role'))
  const [dateData, setDateData] = useState([])
  const [tags, setTags] = useState([])
  const [columnDefinition, setColumnDefinition] = useState([
    { headerName: 'Name', field: 'product_name' },
    { headerName: 'SKU', field: 'sku' },
    {
      headerName: 'Product Type',
      field: 'product_type'
    },
    { headerName: 'Warehouse Qty', field: 'warehouse_quantity' },
    { headerName: 'Store Qty', field: 'store_quantity' },
    { headerName: 'Sold', field: 'sold', minWidth: 100 },
    {
      headerName: 'Order Qty',
      field: 'order_quantity',
      cellRendererParams: (params) => {
        return {
          inputType: 'number'
        }
      }
    },
    { headerName: 'Approved Qty', field: 'approved_quantity', editable: true },
    { headerName: 'Note', field: 'note', minWidth: 300 }
  ])
  const [excelDownload, setExcelDownload] = useState(null)
  const [staffName, setStaffName] = useState('')
  const [newChecked, setNewChecked] = useState(false)

  useEffect(() => {
    const run = async () => {
      await instance
        .get('main-category-tags')
        .then(async (response) => {
          const _mainTags = response.data
          setTags(_mainTags)
          setWaiting(false)
        })
        .catch((err) => {
          alert(err)
        })
    }

    run()
  }, [])

  useEffect(() => {
    instance.get('modified-outlets').then((response) => {
      setOutlets(response.data)
    })
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', (e) => {
      // Cancel the event
      e.preventDefault() // If you prevent default behavior in Mozilla Firefox prompt will always be shown
      // Chrome requires returnValue to be set
      e.returnValue = ''
    })
  }, [])

  const getFixedDate = (date) => {
    const d = moment(date)
    const dateString = d.format('DD MMM YYYY')
    return dateString
  }

  const handleExcel = async () => {
    if (outletId == null) {
      alert('Please select an outlet')
      return
    }

    setWaiting(true)
    await instance
      .get('confirmed-excel', {
        params: {
          outlet_id: outletId,
          main_category: mainCategory
        }
      })
      .then((response) => {
        const data = response.data
        if (data === 'does not exist') {
          alert('Error: Order not approved yet.')
          return
        }
        const csv = data.csv
        const filename = data.name
        // <CSVDownload data={data} target="_blank" />
        setExcelDownload(
          <CSVLink data={csv} filename={`${filename}.csv`}>
            Download me
          </CSVLink>
        )
      })
      .catch((err) => {
        alert('Error: Order not approved yet.', err)
      })

    setWaiting(false)
  }

  const handleView = async () => {
    if (outletId == null) {
      alert('Please select an outlet')
      return
    }

    setExcelDownload(null)

    setWaiting(true)
    await instance
      .get('stock-order', {
        params: {
          outlet_id: outletId,
          main_category: mainCategory,
          sub_category: subCategory,
          isNew: newChecked
        }
      })
      .then((r) => {
        if (Object.keys(r.data).length === 0) {
          notify('The store does not have new order.', 'info')
          setDataArr([])
          setDateData([])
          setShowGrid(false)
          setWaiting(false)
        } else {
          setDataArr(r.data.data)
          setDateData(r.data.datesArr)
          setStaffName(r.data.staffName)
          setShowGrid(true)
          setWaiting(false)
        }
      })
      .catch((err) => {
        console.log(err)
      })
  }
  const handleNewCheck = (e) => {
    newChecked ? setNewChecked(false) : setNewChecked(true)
  }
  return (
    <>
      <Segment.Group>
        <Segment>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Header as='h2' content='Ordering System Admin' />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={outlets}
                getOptionLabel={(option) => option.name}
                onChange={(event, value) => {
                  if (value == null) {
                    return
                  }
                  setOutletId(value.id)
                  setExcelDownload(null)
                }}
                fullWidth
                renderInput={(params) => (
                  <TextField {...params} label='Store' variant='outlined' />
                )}
              />
            </Grid>
            <Grid item xs={4}>
              <Select
                value={mainCategory}
                onChange={(event) => {
                  setMainCategory(event.target.value)
                  setExcelDownload(null)
                }}
                fullWidth
              >
                {tags.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            {/* {mainCategory === "Vape"
              ?
              <Grid item xs={4}>
                <Select value={subCategory} onChange={(event) => setSubCategory(event.target.value)} fullWidth>
                  {tags.map((tag) => (
                    <MenuItem value={tag}>{tag}</MenuItem>
                  ))}
                </Select>
              </Grid>
              :
              <> </>
            } */}
            <Grid item xs={4}>
              <Button variant='contained' color='primary' onClick={handleView}>
                View
              </Button>
            </Grid>
            <Grid item xs={12}>
              <FormControl component='fieldset'>
                <FormControlLabel
                  value='new'
                  control={
                    <Radio checked={newChecked} onClick={handleNewCheck} />
                  }
                  label='Approve New Category?'
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              {excelDownload === null
                ? (
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleExcel}
                  >
                    Download Excel
                  </Button>
                  )
                : (
                    excelDownload
                  )}
            </Grid>
            {showGrid
              ? (
                <>
                  <Grid item xs={12}>
                    {dateData.map((d) => {
                      return (
                        <Typography variant='body1' key={d.name}>
                          {`${d.name} sale range: ${getFixedDate(
                          d.startDate
                        )} - ${getFixedDate(d.endDate)}`}
                        </Typography>
                      )
                    })}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant='body1'>{`Order confirmed by: ${staffName}`}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <ProductGrid
                      dataArr={dataArr}
                      mainCategoryName={mainCategory}
                      subCategoryName={subCategory}
                      setWaiting={setWaiting}
                      _columnDefinition={columnDefinition}
                      outletId={outletId}
                      startDate={startDate}
                      endDate={endDate}
                      setStartDate={setStartDate}
                      setShowGrid={setShowGrid}
                      role={role}
                      isNew={newChecked}
                    />
                  </Grid>
                </>
                )
              : (
                <> </>
                )}
          </Grid>
        </Segment>
      </Segment.Group>
      <Backdrop open={waiting} style={{ zIndex: 10000 }}>
        <CircularProgress style={{ color: 'white' }} />
      </Backdrop>
    </>
  )
}
