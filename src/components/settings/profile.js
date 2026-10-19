import React, { Component ,Fragment} from 'react'

import designer from '../../assets/images/dashboard/designer.jpg';
import Tabset_profile from './tabset-profile';
import Breadcrumb from '../common/breadcrumb';
import {connect} from 'react-redux'
import {auth,uploadImage,updateProfileImage} from '../../firebase/firebase.utils'
import {updateProfileImageRedux} from '../../actions'

export class Profile extends Component {
    constructor(props){
        super(props)
        this.state={
            admin:null,
            pictures:'',
            file:''
        }
    }
    _handleImgChange= async (e) => {
        e.preventDefault();

        let reader = new FileReader();
        let file = e.target.files[0];
        var { pictures } = this.state;

        reader.onloadend = () => {
            pictures = reader.result;
            this.setState({
                file: file,
                pictures,
            });
        }
        if (file){
            reader.readAsDataURL(file)
            const imgUrl =await uploadImage(file)
            pictures = imgUrl
            await updateProfileImage(imgUrl,this.props.currentAdmin.adminId)
            this.props.updateProfileImageRedux(imgUrl)
            this.setState({
                pictures
            })
            console.log(pictures)
        }  
      
    }
   
    render() {  
        const {currentAdmin} = this.props
        var {pictures} = this.state
        if (currentAdmin){
            return (
                <Fragment>
                    <Breadcrumb title="Profile" parent="Settings" />
                     <div className="container-fluid">
                    <div className="row">
                        <div className="col-xl-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="profile-details text-center">
                                    <div className="file-upload-product">
                                    <div className="box-input-file">
                                      
                                      {currentAdmin.image?<img src={currentAdmin.image} alt="" className="img-fluid img-90 rounded-circle blur-up lazyloaded" />:<><img src={pictures} alt="" className="img-fluid img-90 rounded-circle blur-up lazyloaded" /><input className="upload input-field" type="file" onChange={this._handleImgChange} /></>}  
                                     
                                    </div></div>
                                        <h5 className="f-w-600 f-16 mb-0">{currentAdmin.name}</h5>
                                        <span>{currentAdmin.email}</span>
                                        <div className="social">
                                            <div className="form-group btn-showcase">
                                                <button className="btn social-btn btn-fb d-inline-block"> <i className="fa fa-facebook"></i></button>
                                                <button className="btn social-btn btn-twitter d-inline-block"><i className="fa fa-google"></i></button>
                                                <button className="btn social-btn btn-google d-inline-block mr-0"><i className="fa fa-twitter"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="project-status">
                                        <h5 className="f-w-600 f-16">Employee Status</h5>
                                        <div className="media">
                                            <div className="media-body">
                                                <h6>Performance <span className="pull-right">80%</span></h6>
                                                <div className="progress sm-progress-bar">
                                                    <div className="progress-bar bg-primary" role="progressbar" style={{width: '90%'}} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="media">
                                            <div className="media-body">
                                                <h6>Overtime <span className="pull-right">60%</span></h6>
                                                <div className="progress sm-progress-bar">
                                                    <div className="progress-bar bg-secondary" role="progressbar" style={{width: '60%'}} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="media">
                                            <div className="media-body">
                                                <h6>Leaves taken <span className="pull-right">50%</span></h6>
                                                <div className="progress sm-progress-bar">
                                                    <div className="progress-bar bg-danger" role="progressbar" style={{width: '50%'}} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-8">
                            <div className="card profile-card">
                                <div className="card-body">
                                    <Tabset_profile currentAdmin={currentAdmin}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </Fragment>
            )
        }else{
            return <div>loading</div>
        }
        
    }
}

const mapStateToProps =(state) =>{
    return{
        currentAdmin:state.admins.currentAdmin
    }
}
export default connect(mapStateToProps,{updateProfileImageRedux})(Profile)
