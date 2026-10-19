import React, { Component, Fragment } from 'react'
import Breadcrumb from '../common/breadcrumb';
import data from '../../assets/data/sales-transactions';
import Datatable from './pendingOrdersDatatable';
import {getAllOrders} from '../../firebase/firebase.utils'

export class ChinaWarehouse extends Component {
    
    constructor(props){
        super(props)
        this.state ={
            chinaWarehouse:[]
        }
    }

    componentDidMount=async()=>{
        const allOrders = await getAllOrders()
        const chinaWarehouse = allOrders.filter(order=>order.status === "china_warehouse")
        this.setState({chinaWarehouse})
    }

    handleUpdateRow =async (orderIdArray) =>{
        const newChinaWarehouse = this.state.chinaWarehouse.filter((order) => !orderIdArray.includes((order.orderId).toString()))
        this.setState({chinaWarehouse:newChinaWarehouse})
    }

    render() {
        const {chinaWarehouse} = this.state
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
                                            myData={chinaWarehouse}
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

export default ChinaWarehouse;
