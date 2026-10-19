import React, { Component, Fragment } from 'react'
import Breadcrumb from '../common/breadcrumb'
import data from '../../assets/data/listPages';
import Datatable from './product-to-order-datatable';
import {connect} from 'react-redux'
import {productToOrder} from '../../firebase/firebase.utils'

class ProductToOrder extends Component {
    // componentDidMount=async()=>{
    //     await ProductToOrder(this.props.productsToOrderArray)

    // }
    render() {
        return (
            <Fragment>
                <Breadcrumb title="Products to Order" parent="Pages" />
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5>Products to Order</h5>
                                </div>
                                <div className="card-body">
                                    <div id="batchDelete" className="category-table order-table coupon-list-delete">
                                        <Datatable
                                            multiSelectOption={false}
                                            myData={this.props.productsToOrderArray}
                                            pageSize={10}
                                            pagination={false}
                                            class="-striped -highlight"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Fragment>
        )
    }
}

const mapStateToProps =(state)=>{
    const notOrdered = state.orders.orders.filter(order=>order.status ==='payment_approved')
    const productsToOrderArray =[]
    notOrdered.forEach(order=>{
        productsToOrderArray.push(...order.order)})
    const obj =productsToOrderArray.reduce((acc,product)=>{
        acc[product.id]?acc[product.id].quantity += product.quantity:acc[product.id]=product
        return acc
    },{})
    const unDuplicatedProductsArray = Object.values(obj)
    return{
        productsToOrderArray:unDuplicatedProductsArray
    }
}

export default connect(mapStateToProps)(ProductToOrder)
