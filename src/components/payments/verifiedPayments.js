import React, { Component, Fragment } from 'react'
import Breadcrumb from '../common/breadcrumb';
import Datatable from './paymentsDatatable'
import {getAllPayments} from '../../firebase/firebase.utils'

export class VerifiedPayments extends Component {
    constructor(props){
        super(props)
        this.state ={
            verifiedPayments:[]
        }
    }

    componentDidMount=async()=>{
        const allPayments = await getAllPayments()
        if (allPayments.length >0){
            var verifiedPaymentsArray=[]
            allPayments.forEach((payment)=>{ 
                payment.payments.forEach(inPayment=>{
                if (inPayment.paymentStatus === 'Verified'){
                    verifiedPaymentsArray.push(inPayment)
                }
                })
            })
            console.log(verifiedPaymentsArray)
            this.setState({verifiedPayments:verifiedPaymentsArray})
        }
       
    }
    render() {
        const {verifiedPayments} = this.state
        console.log(verifiedPayments)
        return (
            <Fragment>
                <Breadcrumb title="Verified Payments" parent="Payments" />
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5>Verified Payments</h5>
                                </div>
                                <div className="card-body">
                                    <div id="batchDelete" className="category-table order-table coupon-list-delete">
                                        <Datatable
                                            multiSelectOption={false}
                                            myData={verifiedPayments}
                                            pageSize={10}
                                            pagination={true}
                                            class="-striped -highlight"
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

export default VerifiedPayments;
