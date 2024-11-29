import React from 'react'
import { TextField } from '@material-ui/core'

const SkuScanner = ({ skuInput, setSkuInput, handleScan }) => {
  return (
    <TextField
      variant="outlined"
      label="SCAN the SKU here"
      fullWidth
      value={skuInput}
      onChange={(e) => {
        setSkuInput(e.target.value)
      }}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          handleScan(e.target.value)
        }
      }}
    />
  )
}

export default SkuScanner
