import React, { Component, Fragment } from 'react'
import Breadcrumb from '../common/breadcrumb';
import data from '../../assets/data/sales-transactions';
import Datatable from './pendingOrdersDatatable';
import {getAllOrders} from '../../firebase/firebase.utils'

export class InShipment extends Component {
    
    constructor(props){
        super(props)
        this.state ={
            inShipment:[]
        }
    }

    componentDidMount=async()=>{
        const allOrders = await getAllOrders()
        const inShipment = allOrders.filter(order=>order.status === "in-shipping")
        this.setState({inShipment})
    }

    handleUpdateRow =async (orderIdArray) =>{
        const newInShipment = this.state.inShipment.filter((order) => !orderIdArray.includes((order.orderId).toString()))
        this.setState({inShipment:newInShipment})
    }

    render() {
        const {inShipment} = this.state
        return (
            <Fragment>
                <Breadcrumb title="Ordered" parent="Sales" />

                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5>Ordered</h5>
                                </div>
                                <div className="card-body">
                                    <div id="batchDelete" className="transactions">
                                        <Datatable
                                            multiSelectOption={false}
                                            myData={inShipment}
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

export default InShipment;
