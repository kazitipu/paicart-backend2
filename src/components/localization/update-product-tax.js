import React, { Component,Fragment } from 'react';
import Breadcrumb from '../common/breadcrumb';
import {updateProductTax,getSingleProductTax} from '../../firebase/firebase.utils'


export class Update_Product_Tax extends Component {
    constructor(props) {
        super(props)
        this.state = {
            id:'',
            name:'',
            below_1kg:''
        }
    }

    componentDidMount =async ()=>{
        if (this.props.match.params.id){
            const product = await getSingleProductTax(this.props.match.params.id)
            this.setState({...product})
            console.log(this.state)
        }
    }
    
  
    handleChange = (event) => {
        const {name,value} =event.target;
        this.setState({ [name]:value });
    }

    handleFormSubmit = async (event) =>{
        event.preventDefault()
            await updateProductTax({...this.state})
            alert(`shipping charge for ${this.state.name} updated successfully!`)
            this.setState({
                id:'',
                name:'',
                below_1kg:'' 
        })
    }  
       
        
    

    handleDiscard =()=>{
        this.setState({
            id:'',
            name:'',
            below_1kg:''
        })
    }

    render(){
        const {loader} = this.state
        
        return (
            <Fragment>   
            
                <Breadcrumb title="Update Product Shipping Charge" parent="localization" />

                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5>Update Product shipping charges</h5>
                                    <h6>Update product id,name and below_1kg shipping charges.Other shipping charges will  be auto updated. </h6>
                                </div>
                                <div className="card-body">
                                    <div className="row product-adding">
                                        <div className="col-xl-12">
                                            <form className="needs-validation add-product-form" onSubmit={this.handleFormSubmit}>
                                                <div className="form form-label-center">
                                                    <div className="form-group mb-3 row">
                                                        <label className="col-xl-3 col-sm-4 mb-0">Product Id :</label>
                                                        <div className="col-xl-8 col-sm-7">
                                                            <input className="form-control" name="id" value={this.state.id} type="text" onChange={this.handleChange} required readOnly />
                                                        </div>
                                                        <div className="valid-feedback">Looks good!</div>
                                                    </div>
                                                   
                                                   
                                                    <div className="form-group row">
                                                        <label className="col-xl-3 col-sm-4 mb-0" >Product Name :</label>
                                                        <div className="col-xl-8 col-sm-7">
                                                            <input className="form-control" id="exampleFormControlSelect1" name="name" value={this.state.name} onChange={this.handleChange}  required/>
                                                        </div>
                                                    </div>
                                                    <div className="form-group row">
                                                        <label className="col-xl-3 col-sm-4 mb-0" >Below 1kg :</label>
                                                        <div className="col-xl-8 col-sm-7">
                                                            <input className="form-control" id="exampleFormControlSelect1" name="below_1kg" value={this.state.below_1kg} onChange={this.handleChange}  required />
                                                        </div>
                                                    </div>
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
                    </div>
                </div> 
            </Fragment>
        
           
           
        )
    }
}

export default Update_Product_Tax
