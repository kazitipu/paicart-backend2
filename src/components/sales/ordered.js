import React, { Component, Fragment } from 'react'
import Breadcrumb from '../common/breadcrumb';
import data from '../../assets/data/sales-transactions';
import Datatable from './pendingOrdersDatatable';
import {getAllOrders} from '../../firebase/firebase.utils'

export class Ordered extends Component {
    
    constructor(props){
        super(props)
        this.state ={
            ordered:[]
        }
    }

    componentDidMount=async()=>{
        const allOrders = await getAllOrders()
        const ordered = allOrders.filter(order=>order.status === "ordered")
        this.setState({ordered})
    }

    handleUpdateRow =async (orderIdArray) =>{
        const newOrdered = this.state.ordered.filter((order) => !orderIdArray.includes((order.orderId).toString()))
        this.setState({ordered:newOrdered})
    }



    render() {
        const {ordered} = this.state
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
                                            myData={ordered}
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

export default Ordered;
