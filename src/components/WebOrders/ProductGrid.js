import React, { useState, useEffect } from 'react'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { AgGridReact } from '@ag-grid-community/react'
import {
  ColumnsToolPanelModule,
  SetFilterModule,
  ClipboardModule
} from '@ag-grid-enterprise/all-modules'
import { Button, Grid } from '@material-ui/core'
import { FindReplace, Done, Close } from '@material-ui/icons'
import { useNotify } from 'react-admin'
import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'

const StatusCellRenderer = (props) => {
  const match = props.node.data.match
  return (
    <span>
      {match
        ? (
          <Done
            style={{
              color: 'green',
              marginTop: 10
            }}
          />
          )
        : (
          <Close
            style={{
              color: '#f50057',
              marginTop: 10
            }}
          />
          )}
    </span>
  )
}

const ProductGrid = ({
  gridApi,
  setGridApi,
  dataArr,
  setWaiting,
  _columnDefinition,
  setOpenFreeLiquidDialog,
  freeData,
  setSelectedLiquid
}) => {
  const BtnCellRenderer = (props) => {
    const handleClick = (e) => {
      setOpenFreeLiquidDialog(true)
      setSelectedLiquid(freeData[props.node.data.sku])
    }
    const isFree = props.node.data.isFree
    return (
      <span>
        {isFree
          ? (
            <FindReplace
              style={{
                color: 'red',
                marginTop: 10,
                cursor: 'pointer'
              }}
              onClick={handleClick}
            />
            )
          : null}
      </span>
    )
  }

  const notify = useNotify()
  const [gridColumnApi, setGridColumnApi] = useState(null)
  const [frameworkComponents, setFrameworkComponents] = useState({
    statusCellRenderer: StatusCellRenderer,
    btnCellRenderer: BtnCellRenderer
  })
  const [columnDefinition, setColumnDefinition] = useState(_columnDefinition)
  const [pageSize, setPageSize] = useState(10000)
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
    const sortModel = [
      {
        colId: 'product_name',
        sort: 'asc'
      }
    ]
    params.api.setSortModel(sortModel)
  }

  const addToList = (item) => {
    const currentData = []
    gridApi.forEachNode((rowNode, index) => {
      currentData.push(rowNode.data)
    })
    currentData.push(item)
    setRowData(currentData)

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
        <Grid item xs={12}>
          <div
            className='ag-theme-alpine'
            style={{
              height: 600,
              width: '100%'
            }}
          >
            <AgGridReact
              onGridReady={onGridReady}
              sideBar={{
                toolPanels: [
                  {
                    id: 'columns',
                    labelDefault: 'Columns',
                    labelKey: 'columns',
                    iconKey: 'columns',
                    toolPanel: 'agColumnsToolPanel'
                  }
                ]
              }}
              rowData={rowData}
              modules={[
                ClientSideRowModelModule,
                ColumnsToolPanelModule,
                SetFilterModule
              ]}
              columnDefs={columnDefinition}
              defaultColDef={{
                sortable: true,
                resizable: true
                // suppressSizeToFit: true
              }}
              pagination
              paginationPageSize={pageSize}
              frameworkComponents={frameworkComponents}
            />
          </div>
        </Grid>
      </Grid>
    </>
  )
}

export default ProductGrid
