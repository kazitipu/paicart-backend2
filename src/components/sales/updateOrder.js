import React, { Component,Fragment } from 'react';
import Breadcrumb from '../common/breadcrumb';
import {updateOrder,getSingleOrder} from '../../firebase/firebase.utils'

export class UpdateOrder extends Component {
    constructor(props){
        super(props)
        this.state = {
            orderId:'',
            status:'',
            paid:0
          
            
        }
    }
    componentDidMount =async ()=>{
        if (this.props.match.params.orderId){
            const order = await getSingleOrder(this.props.match.params.orderId)
            this.setState({orderId:this.props.match.params.orderId, status:order.status, paid:order.paymentStatus.paid})
            console.log(this.state)
        }
    }
  

    handleChange = (event) => {
        
        const {name,value} =event.target;
        this.setState({ [name]:value }); 
}

    handleFormSubmit = async (event) =>{
        event.preventDefault()
        
        await updateOrder(this.state)
    
            
        
       
        this.setState( this.state = {
            orderId:'',
            status:'',
            paid:0
        })
        this.props.history.push(this.props.history.location.state.from)
        
    }


    render(){
            return (
                <Fragment>
                <Breadcrumb title="Update Order Status" parent="Order" />

                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5>Update Order status</h5>
                                </div>
                                            
                            <div className="col-xl-7">
                            <form className="needs-validation add-product-form" onSubmit={this.handleFormSubmit}>
                            <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-sm-4 mb-0">Order Id :</label>
                                                    <div className="col-xl-8 col-sm-7">
                                                        <input className="form-control" name="orderId" value={this.state.orderId} type="text" readOnly required />
                                                    </div>
                                                    <div className="valid-feedback">Looks good!</div>
                                                </div>
                            <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">Order status :</label>
                            <div className="col-xl-8 col-sm-7">
                            <select className="form-control digits" id="exampleFormControlSelect1" name="status" value={this.state.status} onChange={this.handleChange}>
                                <option>order_pending</option>
                                <option>payment_approved</option>
                                <option>ordered</option>
                                <option>china_warehouse</option>
                                <option>in-shipping</option>
                                <option>in_stock</option>
                                <option>ready_to_ship</option>
                                <option>delivered</option>
                            </select>
                        </div>
                            <div className="valid-feedback">Looks good!</div>
                        </div>
                        <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-sm-4 mb-0">Paid :</label>
                                                    <div className="col-xl-8 col-sm-7">
                                                        <input className="form-control" name="paid" value={this.state.paid} onChange={this.handleChange} type="number" required />
                                                    </div>
                                                    <div className="valid-feedback">Looks good!</div>
                                                </div>
                    
                    <div className="offset-xl-3 offset-sm-4">
                                                <button type="submit" className="btn btn-primary">Add</button>
                                                <button type="button" onClick={this.handleDiscard} className="btn btn-light">Discard</button>
                                            </div>
                    </form>
                    </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </Fragment>
            )
    }
}

export default UpdateOrder;
