import React, { Component, Fragment } from 'react'
import Breadcrumb from '../common/breadcrumb';
import Datatable from './paymentsDatatable'
import {getAllPayments} from '../../firebase/firebase.utils'

export class UnverifiedPayments extends Component {
    constructor(props){
        super(props)
        this.state ={
            unVerifiedPayments:[]
        }
    }

    componentDidMount=async()=>{
        const allPayments = await getAllPayments()
        if (allPayments.length >0){
            var unVerifiedPaymentsArray=[]
            allPayments.forEach((payment)=>{ 
                payment.payments.forEach(inPayment=>{
                if (inPayment.paymentStatus === 'unVerified'){
                    unVerifiedPaymentsArray.push(inPayment)
                }
                })
            })
            console.log(unVerifiedPaymentsArray)
            this.setState({unVerifiedPayments:unVerifiedPaymentsArray})
        }

    
       
    }

    handlePaymentStatusChange =(paymentObj)=>{
        const updatedUnverifiedPayment = this.state.unVerifiedPayments.filter(payment=>payment.paymentId !== paymentObj.paymentId)
        this.setState({unVerifiedPayments:updatedUnverifiedPayment})
    }
    
    render() {
        const {unVerifiedPayments} = this.state
        console.log(unVerifiedPayments)
        return (
            <Fragment>
                <Breadcrumb title="Unverified Payments" parent="Payments" />
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5>Unverified Payments</h5>
                                </div>
                                <div className="card-body">
                                    <div id="batchDelete" className="category-table order-table coupon-list-delete">
                                        <Datatable
                                            multiSelectOption={false}
                                            myData={unVerifiedPayments}
                                            pageSize={10}
                                            pagination={true}
                                            class="-striped -highlight"
                                            {...this.props}
                                            handlePaymentStatusChange = {this.handlePaymentStatusChange}
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

export default UnverifiedPayments;
