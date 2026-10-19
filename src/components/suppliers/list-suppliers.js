import React, { Component, Fragment } from 'react';
import Breadcrumb from '../common/breadcrumb';
import data from '../../assets/data/listVendor';
import Datatable from './adminsDatatable'
import {connect} from 'react-redux'

class ListSuppliers extends Component {
    constructor(props){
        super(props)
        this.state ={
            adminData:[]
        }
    }
    componentDidMount=()=>{
        this.setState({adminData:this.props.allAdmins})
        console.log(this.props.allAdmins)
    }
   
    render() {
    
        return (
            <Fragment>
                <Breadcrumb title="Supplier List" parent="supplier" />
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <h5>Supplier Details</h5>
                        </div>
                        <div className="card-body vendor-table coupon-list-delete">
                            <Datatable
                                multiSelectOption={true}
                                myData={this.props.allAdmins}
                                pageSize={10}
                                pagination={true}
                                class="-striped -highlight"
                            />
                        </div>
                    </div>
                </div>
            </Fragment>
        )
    }
}

const mapStateToProps=(state)=>{
    console.log(state.admins.admins)
    return{
        allAdmins:state.admins.admins
    }
}
export default connect(mapStateToProps,)(ListSuppliers);
