import React, { Component, Fragment } from 'react'
import Breadcrumb from '../common/breadcrumb';
import data from '../../assets/data/sales-transactions';
import Datatable from './pendingOrdersDatatable';
import {getAllOrders} from '../../firebase/firebase.utils'

export class Delivered extends Component {
    
    constructor(props){
        super(props)
        this.state ={
            delivered:[]
        }
    }

    componentDidMount=async()=>{
        const allOrders = await getAllOrders()
        const delivered = allOrders.filter(order=>order.status === "delivered")
        this.setState({delivered})
    }

    handleUpdateRow =async (orderIdArray) =>{
        const newDelivered = this.state.delivered.filter((order) => !orderIdArray.includes((order.orderId).toString()))
        this.setState({delivered:newDelivered})
    }

    render() {
        const {delivered} = this.state
        return (
            <Fragment>
                <Breadcrumb title="Delivered" parent="Sales" />

                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5>Delivered</h5>
                                </div>
                                <div className="card-body">
                                    <div id="batchDelete" className="transactions">
                                        <Datatable
                                            multiSelectOption={false}
                                            myData={delivered}
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

export default Delivered;
