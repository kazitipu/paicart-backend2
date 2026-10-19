import React, { Component, Fragment } from 'react'
import Breadcrumb from '../common/breadcrumb';
import data from '../../assets/data/sales-transactions';
import Datatable from './pendingOrdersDatatable';
import {getAllOrders} from '../../firebase/firebase.utils'

export class PendingOrders extends Component {
    constructor(props){
        super(props)
        this.state ={
            pendingOrders:[]
        }
    }

    componentDidMount=async()=>{
        const allOrders = await getAllOrders()
        const pendingOrders = allOrders.filter(order=>order.status === "order_pending")
        this.setState({pendingOrders})
    }

    handleUpdateRow =async (orderIdArray) =>{
        const newPendingOrders = this.state.pendingOrders.filter((order) => !orderIdArray.includes((order.orderId).toString()))
        this.setState({pendingOrders:newPendingOrders})
    }

    
    render() {
        const {pendingOrders} = this.state
        return (
            <Fragment>
                <Breadcrumb title="Pending Orders" parent="Sales" />

                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5>Pending Orders</h5>
                                </div>
                                <div className="card-body">
                                    <div id="batchDelete" className="transactions">
                                        <Datatable
                                            multiSelectOption={false}
                                            myData={pendingOrders}
                                            pageSize={10}
                                            pagination={true}
                                            class="-striped -highlight"
                                            {...this.props}
                                            handleUpdateRow ={this.handleUpdateRow}
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

export default PendingOrders
