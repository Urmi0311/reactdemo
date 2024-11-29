import {
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText
} from '@material-ui/core'
import React, { memo } from 'react'
import AddIcon from '@material-ui/icons/Add'

const ListItemChild = ({ item, addToList }) => {
  return (
    <ListItem>
      <ListItemText
        primary={`${item.product_name} - (Qty ${item.warehouse_quantity})`}
        secondary={item.SKU}
      />
      <ListItemSecondaryAction>
        <IconButton
          edge='end'
          onClick={() => {
            addToList(item)
          }}
        >
          <AddIcon color='primary' />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const areEqual = (prev, next) => {
  // console.log("prev", prev, "next", next)
  return true
}

export default memo(ListItemChild, areEqual)
