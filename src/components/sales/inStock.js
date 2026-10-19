import React, { Component, Fragment } from 'react'
import Breadcrumb from '../common/breadcrumb';
import data from '../../assets/data/sales-transactions';
import Datatable from './pendingOrdersDatatable';
import {getAllOrders} from '../../firebase/firebase.utils'

export class InStock extends Component {
    
    constructor(props){
        super(props)
        this.state ={
            inStock:[]
        }
    }

    componentDidMount=async()=>{
        const allOrders = await getAllOrders()
        const inStock = allOrders.filter(order=>order.status === "in_stock")
        this.setState({inStock})
    }

    handleUpdateRow =async (orderIdArray) =>{
        const newInStock = this.state.inStock.filter((order) => !orderIdArray.includes((order.orderId).toString()))
        this.setState({inStock:newInStock})
    }

    render() {
        const {inStock} = this.state
        return (
            <Fragment>
                <Breadcrumb title="In Stock" parent="Sales" />

                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5>In Stock</h5>
                                </div>
                                <div className="card-body">
                                    <div id="batchDelete" className="transactions">
                                        <Datatable
                                            multiSelectOption={false}
                                            myData={inStock}
                                            pageSize={10}
                                            pagination={true}
                                            class="-striped -highlight"
                                            handleUpdateRow ={this.handleUpdateRow}
                                            {...this.props}
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

export default InStock;
