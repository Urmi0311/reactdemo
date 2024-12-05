import React, { useState, Component, useEffect } from 'react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { AgGridColumn, AgGridReact } from '@ag-grid-community/react'
import {
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogContent,
  TextField,
  CircularProgress,
  List,
  Typography
} from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import { instance } from '../../config/firebase'
import { useNotify } from 'react-admin'
import ListItemChild from './ListItemChild'

const BtnCellRenderer = (props) => {
  const handleClick = (e) => {
    const deletedRow = props.node.data
    e.gridApi.applyTransaction({ remove: [deletedRow] })
  }

  return (
    // <span><button onClick={() => handleClick(props.node)}>Delete</button></span>
    <span>
      <IconButton
        style={{ color: '#f50057' }}
        onClick={() => handleClick(props.node)}
      >
        <DeleteIcon />
      </IconButton>
    </span>
  )
}

const ProductGrid = ({
  dataArr,
  mainCategoryName,
  subCategoryName,
  setWaiting,
  _columnDefinition,
  role,
  outletId,
  startDate,
  endDate,
  setStartDate,
  setShowGrid,
  isNew
}) => {
  const notify = useNotify()
  const [gridApi, setGridApi] = useState(null)
  const [gridColumnApi, setGridColumnApi] = useState(null)
  const [pageSize, setPageSize] = useState(10000)
  const [frameworkComponents, setFrameworkComponents] = useState({
    btnCellRenderer: BtnCellRenderer
  })
  const [columnDefinition, setColumnDefinition] = useState(_columnDefinition)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  const [rowData, setRowData] = useState()

  useEffect(() => {
    setRowData(dataArr)
    if (gridApi !== null) {
      gridApi.setRowData(dataArr)
    }
    if (gridColumnApi !== null) {
      gridColumnApi.autoSizeAllColumns()
    }
  }, [dataArr])

  const onGridReady = (params) => {
    setGridApi(params.api)
    setGridColumnApi(params.columnApi)
    // params.api.sizeColumnsToFit()
    // params.api.autoSizeAllColumns()
    params.columnApi.autoSizeAllColumns()
    // const sortModel = [
    //   {
    //     colId: "product_name", sort: "asc"
    //   }
    // ]
    // params.api.setSortModel(sortModel)
  }

  const handleClick = async () => {
    if (window.confirm('Are you sure you want to approve this?') !== true) {
      return
    }
    setWaiting(true)
    const currentData = []
    gridApi.forEachNode((rowNode, index) => {
      currentData.push(rowNode.data)
    })

    await instance
      .post('stock-order', {
        product_data: currentData,
        main_category: mainCategoryName,
        outlet_id: outletId,
        isNew
      })
      .then((response) => {
        notify('Confirm successful', 'info')
        setWaiting(false)
        setShowGrid(false)
      })
      .catch((err) => {
        alert(err)
        setWaiting(false)
      })
  }

  const handleSearch = async () => {
    setSearchLoading(true)
    await instance
      .get('search-products', {
        params: {
          name: searchText,
          main_category: mainCategoryName,
          sub_category: subCategoryName,
          show_sub_category: false,
          outlet_id: outletId
        }
      })
      .then((response) => {
        setSearchResults(response.data)
        setSearchLoading(false)
      })
      .catch((err) => {
        alert(err)
        setSearchLoading(false)
      })
  }

  const addToList = (item) => {
    const currentData = []
    gridApi.forEachNode((rowNode, index) => {
      currentData.push(rowNode.data)
    })
    currentData.push(item)
    setRowData(currentData)

    // let newArr = []
    // setRowData(old => {
    //   old.push(item)
    //   newArr = old
    //   return newArr
    // })

    if (gridApi !== null) {
      gridApi.setRowData(currentData)
    }
    if (gridColumnApi !== null) {
      gridColumnApi.autoSizeAllColumns()
    }
  }

  return (
    <>
      <Grid container>
        <Grid item xs={12} style={{ marginBottom: 30 }}>
          <Button
            variant='contained'
            color='primary'
            onClick={() => setShowProductDialog(true)}
          >
            Add Product
          </Button>
        </Grid>
        <Grid item xs={12}>
          <div
            className='ag-theme-alpine'
            style={{
              height: role === process.env.REACT_APP_ADMIN_ROLE ? '80vh' : 600,
              width: '100%'
            }}
          >
            <AgGridReact
              onGridReady={onGridReady}
              modules={[ClientSideRowModelModule]}
              rowData={rowData}
              columnDefs={columnDefinition}
              defaultColDef={{
                sortable: true,
                resizable: true,
                filter: 'agTextColumnFilter'
                // suppressSizeToFit: true
              }}
              pagination
              paginationPageSize={pageSize}
              frameworkComponents={frameworkComponents}
            />
          </div>
        </Grid>
        <Grid item xs={12} style={{ textAlign: 'center', marginTop: 20 }}>
          <Button color='primary' variant='contained' onClick={handleClick}>
            Approve
          </Button>
        </Grid>
      </Grid>
      <Dialog
        open={showProductDialog}
        onEscapeKeyDown={() => setShowProductDialog(false)}
      >
        <DialogContent>
          <Grid container>
            <Grid item xs={10}>
              <TextField
                variant='outlined'
                label='Product Name'
                fullWidth
                id='productName'
                name='productName'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <Button
                variant='contained'
                color='primary'
                fullWidth
                style={{ marginTop: 10, marginLeft: 10 }}
                onClick={handleSearch}
                // type="submit"
              >
                Search
              </Button>
            </Grid>
            <Grid item xs={12}>
              {searchLoading
                ? (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <CircularProgress />
                  </div>
                  )
                : (
                  <List dense={false}>
                    {searchResults.length === 0
                      ? (
                        <Typography
                          variant='body1'
                          style={{ textAlign: 'center', marginTop: 20 }}
                        >
                          No search results
                        </Typography>
                        )
                      : (
                        <>
                          {searchResults.map((item) => {
                            return (
                              <ListItemChild
                                key={item.id}
                                item={item}
                                addToList={addToList}
                              />
                            )
                          })}
                        </>
                        )}
                  </List>
                  )}
            </Grid>
            <Grid item xs={12} style={{ marginTop: 20, textAlign: 'center' }}>
              <Button
                variant='contained'
                color='primary'
                onClick={() => setShowProductDialog(false)}
                style={{ marginTop: 20 }}
              >
                Close
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  )
}
export default ProductGrid
